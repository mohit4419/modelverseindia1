/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { CLOUDINARY_CONFIG, isCloudinaryConfigured } from '../config/cloudinary';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';

const VALID_FOLDERS = [
  'avatars',
  'portfolio-images',
  'portfolio-videos',
  'verification-documents',
  'contracts',
  'invoices',
  'banners',
  'temp',
];

export class StorageService {
  private uploadDir = path.join(process.cwd(), 'public', 'uploads');
  private rootStorageDir = path.join(process.cwd(), 'storage');

  constructor() {
    // Ensure upload and root storage directories exist locally
    try {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
      if (!fs.existsSync(this.rootStorageDir)) {
        fs.mkdirSync(this.rootStorageDir, { recursive: true });
      }
      // Ensure all valid subfolders exist
      for (const folder of VALID_FOLDERS) {
        const localPubDir = path.join(this.uploadDir, folder);
        const localRootDir = path.join(this.rootStorageDir, folder);
        if (!fs.existsSync(localPubDir)) {
          fs.mkdirSync(localPubDir, { recursive: true });
        }
        if (!fs.existsSync(localRootDir)) {
          fs.mkdirSync(localRootDir, { recursive: true });
        }
      }
    } catch (e) {
      console.error('Error creating local storage directories:', e);
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'temp'
  ): Promise<{ url: string; publicId?: string }> {
    const sanitizedFolder = VALID_FOLDERS.includes(folder) ? folder : 'temp';
    const fileExtension = path.extname(originalName) || '.bin';
    const fileName = `upload_${Date.now()}_${Math.floor(Math.random() * 100000)}${fileExtension}`;

    // 1. Check if Supabase Storage is configured and attempt upload
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        console.log(`Supabase is configured. Attempting upload for ${originalName} under folder ${sanitizedFolder}...`);
        
        // Attempt upload to bucket 'storage' with path 'folder/filename'
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('storage')
          .upload(`${sanitizedFolder}/${fileName}`, fileBuffer, {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: false
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabaseAdmin.storage
            .from('storage')
            .getPublicUrl(`${sanitizedFolder}/${fileName}`);

          console.log(`[StorageService] Successfully uploaded file to Supabase Storage 'storage' bucket: ${urlData.publicUrl}`);
          return {
            url: urlData.publicUrl,
            publicId: `storage:${sanitizedFolder}/${fileName}`
          };
        } else {
          // If the 'storage' bucket doesn't exist or has RLS/signature limits, try folder bucket
          const { data: folderUploadData, error: folderUploadError } = await supabaseAdmin.storage
            .from(sanitizedFolder)
            .upload(fileName, fileBuffer, {
              contentType: mimeType,
              cacheControl: '3600',
              upsert: false
            });

          if (!folderUploadError && folderUploadData) {
            const { data: urlData } = supabaseAdmin.storage
              .from(sanitizedFolder)
              .getPublicUrl(fileName);

            console.log(`[StorageService] Successfully uploaded file to Supabase Storage bucket '${sanitizedFolder}': ${urlData.publicUrl}`);
            return {
              url: urlData.publicUrl,
              publicId: `${sanitizedFolder}:${fileName}`
            };
          } else {
            const detailMsg = (uploadError || folderUploadError)?.message || 'Bucket or signature restriction';
            console.info(`[StorageService] Supabase cloud storage skipped (${detailMsg}). Seamlessly saved to local workspace storage.`);
          }
        }
      } catch (err: any) {
        console.info(`[StorageService] Supabase Storage upload unavailable (${err?.message || 'Connection error'}). Falling back to local storage.`);
      }
    }

    if (isCloudinaryConfigured) {
      try {
        console.log(`Cloudinary is configured. Mocking Cloudinary secure upload stream for ${originalName} under folder ${sanitizedFolder}...`);
      } catch (err) {
        console.error('Cloudinary direct upload failed, falling back to local storage:', err);
      }
    }

    // Default Local storage upload fallback
    // Path inside public uploads (for web serving)
    const pubDestDir = path.join(this.uploadDir, sanitizedFolder);
    const pubFilePath = path.join(pubDestDir, fileName);

    // Path inside root storage/ directory (for secure backend archives)
    const rootDestDir = path.join(this.rootStorageDir, sanitizedFolder);
    const rootFilePath = path.join(rootDestDir, fileName);

    // Ensure folders exist (extra safety)
    if (!fs.existsSync(pubDestDir)) fs.mkdirSync(pubDestDir, { recursive: true });
    if (!fs.existsSync(rootDestDir)) fs.mkdirSync(rootDestDir, { recursive: true });

    // Write to both places to ensure they are synchronized
    fs.writeFileSync(pubFilePath, fileBuffer);
    fs.writeFileSync(rootFilePath, fileBuffer);

    console.log(`Saved uploaded asset to local workspace: ${pubFilePath} and ${rootFilePath}`);

    const relativeUrl = `/uploads/${sanitizedFolder}/${fileName}`;
    return {
      url: relativeUrl,
      publicId: `local:${sanitizedFolder}/${fileName}`,
    };
  }

  async deleteFile(publicId: string): Promise<boolean> {
    if (!publicId) return false;

    // Parse storage type and actual path
    let storageType = 'local';
    let realPath = publicId;

    if (publicId.includes(':')) {
      const parts = publicId.split(':');
      storageType = parts[0];
      realPath = parts.slice(1).join(':');
    }

    if (storageType === 'storage' && isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.storage.from('storage').remove([realPath]);
        if (!error) {
          console.log(`Deleted file from Supabase Storage 'storage' bucket: ${realPath}`);
          return true;
        }
      } catch (e) {
        console.error(`Failed to delete file from Supabase Storage: ${realPath}`, e);
      }
    } else if (isSupabaseConfigured && supabaseAdmin) {
      // Try to delete from folder-level bucket if storageType matches the folder name
      try {
        const pathParts = realPath.split('/');
        const bucketName = storageType !== 'local' ? storageType : pathParts[0];
        const fileName = pathParts.length > 1 ? pathParts.slice(1).join('/') : realPath;

        if (VALID_FOLDERS.includes(bucketName)) {
          const { error } = await supabaseAdmin.storage.from(bucketName).remove([fileName]);
          if (!error) {
            console.log(`Deleted file from Supabase Storage bucket '${bucketName}': ${fileName}`);
            return true;
          }
        }
      } catch (e) {
        console.error(`Failed to delete folder-bucket file from Supabase Storage: ${realPath}`, e);
      }
    }

    // Always attempt clean up locally as fallback/sync
    const localId = realPath; // e.g. "avatars/filename"
    const filePathPub = path.join(this.uploadDir, localId);
    const filePathRoot = path.join(this.rootStorageDir, localId);
    let deleted = false;

    try {
      if (fs.existsSync(filePathPub)) {
        fs.unlinkSync(filePathPub);
        deleted = true;
      }
    } catch (e) {
      console.error(`Failed to delete local public file ${filePathPub}:`, e);
    }

    try {
      if (fs.existsSync(filePathRoot)) {
        fs.unlinkSync(filePathRoot);
        deleted = true;
      }
    } catch (e) {
      console.error(`Failed to delete local root storage file ${filePathRoot}:`, e);
    }

    return deleted;
  }
}


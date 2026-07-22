/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Response } from 'express';
import { StorageService } from '../services/storage.service';
import { parseBase64Upload, UploadedFileRequest } from '../middleware/upload';

const router = Router();
const storageService = new StorageService();

// General / Base64 upload route
router.post('/upload', parseBase64Upload as any, async (req: UploadedFileRequest, res: Response) => {
  try {
    if (!req.fileBuffer) {
      return res.status(400).json({ success: false, error: 'No file buffer provided. Please upload base64 fileData.' });
    }

    const folder = req.body.folder || 'temp';
    const uploadResult = await storageService.uploadFile(
      req.fileBuffer,
      req.fileName || 'upload.png',
      req.mimeType || 'image/png',
      folder
    );

    return res.status(200).json({
      success: true,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
    });
  } catch (err: any) {
    console.error('File upload route failed:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Specific API V1 Upload routes
router.post('/uploads/avatar', parseBase64Upload as any, async (req: UploadedFileRequest, res: Response) => {
  try {
    if (!req.fileBuffer) return res.status(400).json({ success: false, error: 'No file buffer provided.' });
    const result = await storageService.uploadFile(req.fileBuffer, req.fileName || 'avatar.png', req.mimeType || 'image/png', 'avatars');
    return res.status(200).json({ success: true, url: result.url });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/uploads/portfolio', parseBase64Upload as any, async (req: UploadedFileRequest, res: Response) => {
  try {
    if (!req.fileBuffer) return res.status(400).json({ success: false, error: 'No file buffer provided.' });
    const result = await storageService.uploadFile(req.fileBuffer, req.fileName || 'portfolio.png', req.mimeType || 'image/png', 'portfolio-images');
    return res.status(200).json({ success: true, url: result.url });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/uploads/document', parseBase64Upload as any, async (req: UploadedFileRequest, res: Response) => {
  try {
    if (!req.fileBuffer) return res.status(400).json({ success: false, error: 'No file buffer provided.' });
    const result = await storageService.uploadFile(req.fileBuffer, req.fileName || 'document.pdf', req.mimeType || 'application/pdf', 'verification-documents');
    return res.status(200).json({ success: true, url: result.url });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

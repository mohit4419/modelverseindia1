import { useState } from 'react';
import { uploadApi } from '../api/upload.api';

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (payload: { fileData: string; fileName?: string; mimeType?: string; folder?: string }): Promise<string> => {
    setUploading(true);
    setError(null);
    try {
      const result = await uploadApi.uploadFile(payload);
      return result.url;
    } catch (e: any) {
      setError(e.message || 'File upload failed');
      throw e;
    } finally {
      setUploading(false);
    }
  };

  return { uploadFile, uploading, error };
}


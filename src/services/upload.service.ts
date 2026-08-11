import { uploadApi } from '../api/upload.api';

export const uploadService = {
  async uploadFile(payload: { fileData: string; fileName?: string; mimeType?: string; folder?: string }) {
    return uploadApi.uploadFile(payload);
  }
};


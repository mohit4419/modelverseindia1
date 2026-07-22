import { uploadApi } from '../api/upload.api';

export const uploadService = {
  async uploadFile(payload: { fileData: string; fileName?: string; mimeType?: string }) {
    return uploadApi.uploadFile(payload);
  }
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const uploadApi = {
  async uploadFile(payload: { fileData: string; fileName?: string; mimeType?: string; folder?: string }): Promise<{ url: string; publicId: string }> {
    const response = await fetch('/api/v2/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to upload file');
    }
    return result;
  }
};


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';

export interface UploadedFileRequest extends Request {
  fileBuffer?: Buffer;
  fileName?: string;
  mimeType?: string;
}

/**
 * Middleware to check and prepare base64 or binary media payloads for storage
 */
export function parseBase64Upload(req: UploadedFileRequest, res: Response, next: NextFunction) {
  const { fileData, fileName, mimeType } = req.body;

  if (fileData) {
    try {
      // If the client sends files encoded in base64 within a JSON request body
      const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
      req.fileBuffer = Buffer.from(base64Data, 'base64');
      req.fileName = fileName || `upload_${Date.now()}.png`;
      req.mimeType = mimeType || 'image/png';
    } catch (err) {
      return res.status(400).json({ error: 'Failed to parse base64 file data.' });
    }
  }

  next();
}

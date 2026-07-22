/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ENV } from './env';

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || '',
};

export const isCloudinaryConfigured = !!(
  CLOUDINARY_CONFIG.cloudName &&
  CLOUDINARY_CONFIG.apiKey &&
  CLOUDINARY_CONFIG.apiSecret
);

if (isCloudinaryConfigured) {
  console.log('Cloudinary successfully configured for server-side media assets.');
} else {
  console.warn('Cloudinary environment keys are missing; falling back to local storage media engine.');
}

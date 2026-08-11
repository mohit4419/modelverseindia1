/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { v2 as cloudinary } from 'cloudinary';

let cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
let apiKey = process.env.CLOUDINARY_API_KEY || '';
let apiSecret = process.env.CLOUDINARY_API_SECRET || '';

const cloudinaryUrl = process.env.CLOUDINARY_URL || '';

if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://')) {
  try {
    const urlClean = cloudinaryUrl.replace('cloudinary://', '');
    const [credentials, cloud] = urlClean.split('@');
    if (credentials && cloud) {
      const [key, secret] = credentials.split(':');
      if (key && key !== '<your_api_key>') apiKey = apiKey || key;
      if (secret && secret !== '<your_api_secret>') apiSecret = apiSecret || secret;
      if (cloud) cloudName = cloudName || cloud;
    }
  } catch (e) {
    console.error('Error parsing CLOUDINARY_URL:', e);
  }
}

export const CLOUDINARY_CONFIG = {
  cloudName,
  apiKey,
  apiSecret,
};

export const isCloudinaryConfigured = !!(
  CLOUDINARY_CONFIG.cloudName &&
  CLOUDINARY_CONFIG.apiKey &&
  CLOUDINARY_CONFIG.apiSecret &&
  CLOUDINARY_CONFIG.apiKey !== '<your_api_key>' &&
  CLOUDINARY_CONFIG.apiSecret !== '<your_api_secret>'
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CONFIG.cloudName,
    api_key: CLOUDINARY_CONFIG.apiKey,
    api_secret: CLOUDINARY_CONFIG.apiSecret,
    secure: true,
  });
  console.log(`[Cloudinary] Successfully configured Cloudinary for cloud "${CLOUDINARY_CONFIG.cloudName}".`);
} else {
  console.warn('[Cloudinary] Keys missing or set to placeholders; using secondary storage fallbacks.');
}

export { cloudinary };


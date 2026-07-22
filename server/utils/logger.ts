/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const logger = {
  info: (msg: string, ...meta: any[]) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, ...meta);
  },
  warn: (msg: string, ...meta: any[]) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, ...meta);
  },
  error: (msg: string, err?: any) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, err || '');
  },
  debug: (msg: string, ...meta: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG] [${new Date().toISOString()}] ${msg}`, ...meta);
    }
  }
};

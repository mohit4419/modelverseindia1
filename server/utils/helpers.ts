/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Format raw numbers to Indian Rupees (INR)
 */
export function formatCurrencyINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Sanitize query params or filter undefined keys out of objects
 */
export function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const clean: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined && obj[key] !== null) {
      clean[key] = obj[key];
    }
  });
  return clean as Partial<T>;
}

/**
 * Delay execution asynchronously
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

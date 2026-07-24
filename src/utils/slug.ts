/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SlugOptions {
  maxLength?: number;
  appendTimestamp?: boolean;
  uniqueSuffix?: string;
  preserveCase?: boolean;
}

/**
 * Converts a string title into an SEO-friendly URL slug.
 *
 * Example:
 *   "How to Build a High-Converting Portfolio in 2026!"
 *   => "how-to-build-a-high-converting-portfolio-in-2026"
 */
export function slugify(text: string, options: SlugOptions = {}): string {
  if (!text || typeof text !== 'string') {
    return 'article-' + Date.now();
  }

  const {
    maxLength = 80,
    appendTimestamp = false,
    uniqueSuffix,
    preserveCase = false
  } = options;

  let slug = text.trim();

  if (!preserveCase) {
    slug = slug.toLowerCase();
  }

  // Remove diacritics / accents (e.g., é -> e, à -> a)
  slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Replace invalid characters with space first
  slug = slug.replace(/[^a-z0-9\s-]/gi, ' ');

  // Replace spaces and multiple underscores/hyphens with a single hyphen
  slug = slug.replace(/[\s\-_]+/g, '-');

  // Strip leading and trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');

  // Truncate cleanly on word/hyphen boundary if length exceeds maxLength
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Trim back to the last hyphen so we don't end mid-word
    const lastHyphen = slug.lastIndexOf('-');
    if (lastHyphen > 20) {
      slug = slug.substring(0, lastHyphen);
    }
    slug = slug.replace(/^-+|-+$/g, '');
  }

  // Fallback if empty after sanitization
  if (!slug) {
    slug = 'blog-post';
  }

  if (uniqueSuffix) {
    slug = `${slug}-${uniqueSuffix}`;
  } else if (appendTimestamp) {
    const timestamp = Date.now().toString(36);
    slug = `${slug}-${timestamp}`;
  }

  return slug;
}

/**
 * Alias for slugify for easy import across services
 */
export const generateSlug = slugify;

/**
 * Generates a guaranteed unique slug against a list of existing slugs in the database/state.
 */
export function generateUniqueSlug(title: string, existingSlugs: string[] = []): string {
  const baseSlug = slugify(title);
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let count = 1;
  let candidate = `${baseSlug}-${count}`;
  while (existingSlugs.includes(candidate)) {
    count++;
    candidate = `${baseSlug}-${count}`;
  }

  return candidate;
}

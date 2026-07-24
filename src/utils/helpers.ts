export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateUUID(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function truncateText(text: string, limit = 100): string {
  if (text.length <= limit) return text;
  return text.substring(0, limit) + '...';
}

export { slugify, generateSlug, generateUniqueSlug } from './slug';

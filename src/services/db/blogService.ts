/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlogItem } from '../../types';
import { SEED_BLOGS } from './seedData';

export const blogService = {
  async getBlogs(): Promise<BlogItem[]> {
    try {
      const res = await fetch('/api/v2/blogs');
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          localStorage.setItem('mvi_blogs', JSON.stringify(result.data));
          return result.data;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch blogs from server API, falling back to local cache:', err);
    }

    const local = localStorage.getItem('mvi_blogs');
    return local ? JSON.parse(local) : SEED_BLOGS;
  },

  async saveBlog(blog: BlogItem): Promise<void> {
    try {
      const res = await fetch('/api/v2/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blog)
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          await this.getBlogs();
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to save blog to server API:', err);
    }

    // Local storage fallback
    const local = localStorage.getItem('mvi_blogs');
    const blogs: BlogItem[] = local ? JSON.parse(local) : [...SEED_BLOGS];
    const existingIndex = blogs.findIndex(b => b.id === blog.id);
    if (existingIndex > -1) {
      blogs[existingIndex] = blog;
    } else {
      blogs.unshift(blog);
    }
    localStorage.setItem('mvi_blogs', JSON.stringify(blogs));
  },

  async deleteBlog(blogId: string): Promise<void> {
    try {
      const res = await fetch(`/api/v2/blogs/${blogId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await this.getBlogs();
        return;
      }
    } catch (err) {
      console.warn('Failed to delete blog on server API:', err);
    }

    // Local storage fallback
    const local = localStorage.getItem('mvi_blogs');
    const blogs: BlogItem[] = local ? JSON.parse(local) : [...SEED_BLOGS];
    const filtered = blogs.filter(b => b.id !== blogId);
    localStorage.setItem('mvi_blogs', JSON.stringify(filtered));
  }
};

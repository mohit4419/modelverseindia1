/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlogItem } from '../../types';
import { SEED_BLOGS } from './seedData';

export const blogService = {
  async getBlogs(): Promise<BlogItem[]> {
    const local = localStorage.getItem('mvi_blogs');
    return local ? JSON.parse(local) : SEED_BLOGS;
  },

  async saveBlog(blog: BlogItem): Promise<void> {
    const blogs = await this.getBlogs();
    const existingIndex = blogs.findIndex(b => b.id === blog.id);
    if (existingIndex > -1) {
      blogs[existingIndex] = blog;
    } else {
      blogs.unshift(blog);
    }
    localStorage.setItem('mvi_blogs', JSON.stringify(blogs));
  },

  async deleteBlog(blogId: string): Promise<void> {
    const blogs = await this.getBlogs();
    const filtered = blogs.filter(b => b.id !== blogId);
    localStorage.setItem('mvi_blogs', JSON.stringify(filtered));
  }
};

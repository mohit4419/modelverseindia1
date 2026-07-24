/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlogItem, BlogCategory } from '../../types';
import { SEED_BLOGS } from './seedData';

export const blogService = {
  async getBlogs(filters?: { role?: string; userEmail?: string; status?: string; category?: string; search?: string }): Promise<BlogItem[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.role) params.append('role', filters.role);
      if (filters?.userEmail) params.append('userEmail', filters.userEmail);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);

      const queryString = params.toString();
      const url = `/api/v2/blogs${queryString ? '?' + queryString : ''}`;

      const res = await fetch(url);
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

  async saveBlog(blog: BlogItem): Promise<BlogItem | void> {
    try {
      const res = await fetch('/api/v2/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blog)
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          return result.data;
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
    return blog;
  },

  async updateStatus(blogId: string, status: 'published' | 'rejected' | 'pending' | 'draft', role: string = 'admin'): Promise<boolean> {
    try {
      const res = await fetch(`/api/v2/blogs/${blogId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, role })
      });
      if (res.ok) {
        return true;
      }
    } catch (err) {
      console.warn('Failed to update blog status on server API:', err);
    }

    // Local storage fallback
    const local = localStorage.getItem('mvi_blogs');
    if (local) {
      const blogs: BlogItem[] = JSON.parse(local);
      const target = blogs.find(b => b.id === blogId);
      if (target) {
        target.status = status;
        localStorage.setItem('mvi_blogs', JSON.stringify(blogs));
        return true;
      }
    }
    return false;
  },

  async deleteBlog(blogId: string): Promise<void> {
    try {
      const res = await fetch(`/api/v2/blogs/${blogId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
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
  },

  async getCategories(): Promise<BlogCategory[]> {
    try {
      const res = await fetch('/api/v2/blog-categories');
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          return result.data;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch blog categories:', err);
    }

    return [
      { id: 'cat-1', name: 'Fashion', slug: 'fashion', isActive: true },
      { id: 'cat-2', name: 'Modeling Tips', slug: 'modeling-tips', isActive: true },
      { id: 'cat-3', name: 'Beauty', slug: 'beauty', isActive: true },
      { id: 'cat-4', name: 'Lifestyle', slug: 'lifestyle', isActive: true },
      { id: 'cat-5', name: 'Industry News', slug: 'industry-news', isActive: true },
      { id: 'cat-6', name: 'Success Stories', slug: 'success-stories', isActive: true }
    ];
  }
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlogItem, BlogCategory } from '../../types';
import { SEED_BLOGS } from './seedData';
import { supabase } from '../../supabaseClient';
import { isSupabaseAvailable } from './helpers';

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
      console.warn('Failed to fetch blogs from server API, attempting direct Supabase query:', err);
    }

    // Direct Supabase fallback
    if (isSupabaseAvailable && supabase) {
      try {
        let query = supabase.from('blogs').select('*').is('deleted_at', null).order('created_at', { ascending: false });
        if (filters?.status) query = query.eq('status', filters.status);
        if (filters?.category) query = query.eq('category', filters.category);

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          const mapped: BlogItem[] = data.map((row: any) => {
            const resolvedImg = row.featured_image || row.image_url || row.image || row.imageUrl || 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800&auto=format&fit=crop';
            return {
              id: row.id,
              title: row.title,
              slug: row.slug,
              category: row.category || 'Industry Tips',
              categoryId: row.category_id || row.categoryId,
              summary: row.brief_summary || row.summary || row.excerpt || '',
              content: row.content || '',
              excerpt: row.excerpt || row.brief_summary || row.summary || '',
              imageUrl: resolvedImg,
              featuredImage: resolvedImg,
              author: row.author_name || row.author || 'Anonymous Author',
            authorName: row.author_name || row.author,
            authorId: row.author_id || row.userId,
            publishedDate: row.published_at 
              ? new Date(row.published_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
              : (row.published_date || row.publishedDate || 'Jul 24, 2026'),
            publishedAt: row.published_at || row.publishedDate,
            authorEmail: row.author_email || row.authorEmail,
            authorRole: row.author_role || row.authorRole || 'contributor',
            userId: row.user_id || row.userId || row.author_id,
            status: row.status || 'published',
            isFeatured: Boolean(row.is_featured),
            readTime: row.read_time || 3,
            views: row.views || 0,
            likesCount: row.likes_count || 0,
            commentsCount: row.comments_count || 0
          };
        });
          localStorage.setItem('mvi_blogs', JSON.stringify(mapped));
          return mapped;
        }
      } catch (sbErr) {
        console.warn('Direct Supabase fetch blogs warning:', sbErr);
      }
    }

    const local = localStorage.getItem('mvi_blogs');
    return local ? JSON.parse(local) : SEED_BLOGS;
  },

  async saveBlog(blog: BlogItem): Promise<BlogItem | void> {
    let savedData: BlogItem | null = null;

    try {
      const res = await fetch('/api/v2/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blog)
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          savedData = result.data;
        }
      }
    } catch (err) {
      console.warn('Failed to save blog to server API, attempting direct Supabase fallback:', err);
    }

    // Direct Supabase fallback
    if (isSupabaseAvailable && supabase) {
      try {
        const slug = blog.slug || blog.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
        const row = {
          id: String(blog.id),
          title: blog.title,
          slug,
          category: blog.category || 'Industry Tips',
          category_id: blog.categoryId ? String(blog.categoryId) : null,
          brief_summary: blog.summary,
          summary: blog.summary,
          content: blog.content,
          excerpt: blog.excerpt || blog.summary,
          featured_image: blog.imageUrl,
          image_url: blog.imageUrl,
          image: blog.imageUrl,
          author_name: blog.authorName || blog.author,
          author: blog.author,
          author_role: blog.authorRole || 'contributor',
          author_email: blog.authorEmail || null,
          author_id: (blog.authorId || blog.userId) ? String(blog.authorId || blog.userId) : null,
          user_id: (blog.userId || blog.authorId) ? String(blog.userId || blog.authorId) : null,
          status: blog.status || 'published',
          is_featured: blog.isFeatured || false,
          read_time: blog.readTime || 3,
          published_at: blog.publishedAt || new Date().toISOString(),
          published_date: blog.publishedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('blogs').upsert(row);
        if (!error) {
          console.log('[blogService] Direct Supabase save succeeded for blog:', blog.id);
        } else {
          console.warn('[blogService] Direct Supabase save warning:', error.message);
        }
      } catch (sbErr) {
        console.error('[blogService] Direct Supabase save error:', sbErr);
      }
    }

    const finalBlog = savedData || blog;

    // Update local storage cache
    const local = localStorage.getItem('mvi_blogs');
    const blogs: BlogItem[] = local ? JSON.parse(local) : [...SEED_BLOGS];
    const existingIndex = blogs.findIndex(b => b.id === finalBlog.id);
    if (existingIndex > -1) {
      blogs[existingIndex] = finalBlog;
    } else {
      blogs.unshift(finalBlog);
    }
    localStorage.setItem('mvi_blogs', JSON.stringify(blogs));

    return finalBlog;
  },

  async updateStatus(blogId: string, status: 'published' | 'rejected' | 'pending' | 'draft', role: string = 'admin'): Promise<boolean> {
    let apiSuccess = false;
    try {
      const res = await fetch(`/api/v2/blogs/${blogId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, role })
      });
      if (res.ok) {
        apiSuccess = true;
      }
    } catch (err) {
      console.warn('Failed to update blog status on server API:', err);
    }

    if (isSupabaseAvailable && supabase) {
      try {
        await supabase.from('blogs').update({ status, updated_at: new Date().toISOString() }).eq('id', blogId);
      } catch (sbErr) {
        console.warn('Direct Supabase status update error:', sbErr);
      }
    }

    // Update local storage cache
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
    return apiSuccess;
  },

  async deleteBlog(blogId: string): Promise<void> {
    try {
      const res = await fetch(`/api/v2/blogs/${blogId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // Continue to sync local cache
      }
    } catch (err) {
      console.warn('Failed to delete blog on server API:', err);
    }

    if (isSupabaseAvailable && supabase) {
      try {
        await supabase.from('blogs').update({ deleted_at: new Date().toISOString() }).eq('id', blogId);
      } catch (sbErr) {
        console.warn('Direct Supabase delete error:', sbErr);
      }
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

    if (isSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase.from('blog_categories').select('*').eq('is_active', true);
        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            icon: c.icon,
            isActive: c.is_active
          }));
        }
      } catch (sbErr) {
        console.warn('Direct Supabase blog categories query error:', sbErr);
      }
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

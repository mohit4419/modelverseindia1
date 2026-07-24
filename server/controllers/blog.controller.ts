/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { blogRepository, BlogItem, generateSlug, calculateReadTime } from '../repositories/blog.repository';

export class BlogController {
  static async getBlogs(req: Request, res: Response) {
    try {
      const { status, category, search, role, userEmail } = req.query as Record<string, string>;
      const allBlogs = await blogRepository.findAll({ status, category, search, role, userEmail });

      const isAdmin = role === 'admin';
      const normalizedEmail = (userEmail || '').trim().toLowerCase();

      // Permission filtering:
      // Admin sees everything (or filtered by query)
      // Non-admin sees: published posts OR posts created by themselves (even if pending or rejected)
      const visibleBlogs = allBlogs.filter((blog) => {
        if (isAdmin) return true;
        
        const blogStatus = blog.status || 'published';
        if (blogStatus === 'published') return true;

        if (normalizedEmail) {
          if (blog.authorEmail && blog.authorEmail.trim().toLowerCase() === normalizedEmail) {
            return true;
          }
          if (blog.author && blog.author.toLowerCase().includes(normalizedEmail)) {
            return true;
          }
        }

        return false;
      });

      return res.status(200).json({ success: true, count: visibleBlogs.length, data: visibleBlogs });
    } catch (err: any) {
      console.error('[BlogController] getBlogs error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getBlogById(req: Request, res: Response) {
    try {
      const idOrSlug = req.params.id || req.params.slug;
      if (!idOrSlug) {
        return res.status(400).json({ success: false, error: 'Blog ID or slug is required.' });
      }

      const blog = await blogRepository.findByIdOrSlug(idOrSlug);
      if (!blog) {
        return res.status(404).json({ success: false, error: 'Blog post not found.' });
      }

      return res.status(200).json({ success: true, data: blog });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async saveBlog(req: Request, res: Response) {
    try {
      const { 
        id, 
        title, 
        category, 
        categoryId,
        summary, 
        content, 
        imageUrl, 
        author, 
        authorName,
        publishedDate, 
        authorEmail, 
        authorRole, 
        userId,
        status: requestedStatus,
        isFeatured,
        seoTitle,
        seoDescription,
        seoKeywords
      } = req.body;

      if (!title || !content) {
        return res.status(400).json({ success: false, error: 'Title and content are required.' });
      }

      const isEditing = Boolean(id);
      const existing = isEditing ? await blogRepository.findByIdOrSlug(id) : null;

      const userRole = authorRole || 'contributor';
      const isAdmin = userRole === 'admin';

      // Status rule: Admin posts default to 'published'. Client/Model posts default to 'pending' unless admin approves.
      let finalStatus: 'published' | 'pending' | 'rejected' | 'draft' = 'published';
      if (requestedStatus) {
        finalStatus = requestedStatus;
      } else if (existing) {
        finalStatus = existing.status || 'published';
      } else if (!isAdmin) {
        finalStatus = 'pending';
      }

      const blogId = id || req.params.id || ('blog_' + Date.now());
      const slug = (existing && existing.title === title && existing.slug) ? existing.slug : generateSlug(title);
      const readTime = calculateReadTime(content);

      const blog: BlogItem = {
        id: blogId,
        title: title.trim(),
        slug,
        category: category || 'Industry Tips',
        categoryId,
        summary: summary ? summary.trim() : (content.slice(0, 150) + '...'),
        excerpt: summary ? summary.trim() : (content.slice(0, 150) + '...'),
        content: content.trim(),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800&auto=format&fit=crop',
        featuredImage: imageUrl,
        author: author || authorName || 'Anonymous Author',
        authorName: authorName || (author ? author.split('(')[0].trim() : 'Anonymous Author'),
        publishedDate: publishedDate || (existing?.publishedDate) || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        publishedAt: existing?.publishedAt || new Date().toISOString(),
        authorEmail: authorEmail || existing?.authorEmail,
        authorRole: userRole,
        userId: userId || existing?.userId,
        status: finalStatus,
        isFeatured: typeof isFeatured === 'boolean' ? isFeatured : (existing?.isFeatured || false),
        readTime,
        views: existing?.views || 0,
        likesCount: existing?.likesCount || 0,
        commentsCount: existing?.commentsCount || 0,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || summary,
        seoKeywords: seoKeywords || category
      };

      const saved = await blogRepository.save(blog);
      return res.status(200).json({ success: true, data: saved });
    } catch (err: any) {
      console.error('[BlogController] saveBlog error:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, isFeatured, role } = req.body;

      if (role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Only administrators can moderate blog publication status.' });
      }

      if (!id) {
        return res.status(400).json({ success: false, error: 'Blog ID is required.' });
      }

      const updated = await blogRepository.updateStatus(id, status, isFeatured);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Blog post not found.' });
      }

      return res.status(200).json({ success: true, data: updated, message: `Blog status updated to ${status}` });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async deleteBlog(req: Request, res: Response) {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Blog ID is required.' });
      }

      const success = await blogRepository.delete(id);
      return res.status(200).json({ success: true, message: 'Blog post deleted successfully.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await blogRepository.getCategories();
      return res.status(200).json({ success: true, data: categories });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

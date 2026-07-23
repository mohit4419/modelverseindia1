/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { blogRepository, BlogItem } from '../repositories/blog.repository';

export class BlogController {
  static async getBlogs(req: Request, res: Response) {
    try {
      const list = await blogRepository.findAll();
      return res.status(200).json({ success: true, data: list });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getBlogById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const blog = await blogRepository.findById(id);
      if (!blog) {
        return res.status(404).json({ success: false, error: 'Blog post not found' });
      }
      return res.status(200).json({ success: true, data: blog });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async saveBlog(req: Request, res: Response) {
    try {
      const { id, title, category, summary, content, imageUrl, author, publishedDate, authorEmail, authorRole, userId } = req.body;
      if (!title || !content) {
        return res.status(400).json({ success: false, error: 'Title and content are required.' });
      }

      const blog: BlogItem = {
        id: id || req.params.id || ('blog_' + Date.now()),
        title,
        category: category || 'Industry Tips',
        summary: summary || '',
        content,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800&auto=format&fit=crop',
        author: author || 'Anonymous Author',
        publishedDate: publishedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        authorEmail: authorEmail || undefined,
        authorRole: authorRole || undefined,
        userId: userId || undefined
      };

      const saved = await blogRepository.save(blog);
      return res.status(200).json({ success: true, data: saved });
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
}

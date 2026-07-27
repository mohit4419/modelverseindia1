/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured, withTimeout } from '../config/supabase';

export interface BlogItem {
  id: string;
  title: string;
  slug?: string;
  category: string;
  categoryId?: string;
  summary: string;
  content: string;
  excerpt?: string;
  imageUrl: string;
  featuredImage?: string;
  author: string;
  authorName?: string;
  authorId?: string;
  publishedDate: string;
  publishedAt?: string;
  authorEmail?: string;
  authorRole?: 'admin' | 'client' | 'model' | 'contributor' | string;
  userId?: string;
  status?: 'draft' | 'pending' | 'published' | 'rejected';
  isFeatured?: boolean;
  readTime?: number;
  views?: number;
  likesCount?: number;
  commentsCount?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface BlogCategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt?: string;
}

const LOCAL_BLOGS_FILE = path.join(process.cwd(), 'local_blogs.json');

const DEFAULT_CATEGORIES: BlogCategoryItem[] = [
  { id: 'cat-1', name: 'Fashion', slug: 'fashion', description: 'High fashion couture & runway trends', icon: 'Sparkles', isActive: true },
  { id: 'cat-2', name: 'Modeling Tips', slug: 'modeling-tips', description: 'Posing, portfolios, and casting advice', icon: 'BookOpen', isActive: true },
  { id: 'cat-3', name: 'Beauty', slug: 'beauty', description: 'Skincare, makeup, and hair tips for camera', icon: 'Sun', isActive: true },
  { id: 'cat-4', name: 'Lifestyle', slug: 'lifestyle', description: 'Fitness, travel, and personal branding', icon: 'Heart', isActive: true },
  { id: 'cat-5', name: 'Industry News', slug: 'industry-news', description: 'Latest agency trends and casting calls in India', icon: 'Newspaper', isActive: true },
  { id: 'cat-6', name: 'Success Stories', slug: 'success-stories', description: 'Inspirational journeys of ModelVerse talent', icon: 'Award', isActive: true },
  { id: 'cat-7', name: 'Industry Tips', slug: 'industry-tips', description: 'General industry recommendations', icon: 'Lightbulb', isActive: true },
  { id: 'cat-8', name: 'Behind the Scenes', slug: 'behind-the-scenes', description: 'Exclusive shoot & back-stage looks', icon: 'Camera', isActive: true }
];

const INITIAL_BLOGS: BlogItem[] = [
  {
    id: 'b1',
    title: 'How to Build a High-Converting Modeling Portfolio in India',
    slug: 'how-to-build-a-high-converting-modeling-portfolio-in-india',
    category: 'Modeling Tips',
    categoryId: 'cat-2',
    summary: 'Essential guidelines for Indian modeling talent to draft a visual portfolio that grabs the immediate attention of major casting agencies and couture directors.',
    content: `Building a modeling portfolio is your first calling card. In the Indian fashion industry—ranging from high-fashion couture in Delhi or Mumbai to heavy commercial and catalog work—agencies look for versatility and canvas quality.\n\n### 1. The Power of "Polaroids"\nFirst thing first, casting directors want to see your natural face. These are called casting digitals or polaroids. Avoid thick makeup, wear basic, close-fitting clothing (like a black tank top and blue jeans), and shoot in crisp, natural window daylight. Include:\n- A headshot (front)\n- Profile headshots (left and right)\n- Full-length body shot\n- Three-quarter length body shot\n\n### 2. Diversify Your Looks\nYour portfolio shouldn't just contain one aesthetic. Showcase:\n- **Traditional Indian Wear:** Highly demanded for Indian weddings and festive seasons.\n- **Western Casuals:** Perfect for e-commerce catalog auditions.\n- **High Fashion/Avant-Garde:** Demonstrates your editorial expression of lines and shadows.\n\n### 3. Work with Professional Photographers\nWhile beginner models do "TFP" (Time for Print) tests, investing in a reputable fashion photographer who understands agency standards makes a dramatic difference. Ensure your photos tell a story and stay updated with your latest hairstyle and body measurements!`,
    excerpt: 'Essential guidelines for Indian modeling talent to draft a visual portfolio that grabs agency attention.',
    imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800&auto=format&fit=crop',
    featuredImage: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800&auto=format&fit=crop',
    author: 'Karan Mehra (Inega Director)',
    authorName: 'Karan Mehra',
    authorRole: 'admin',
    publishedDate: 'Jun 14, 2026',
    publishedAt: '2026-06-14T10:00:00Z',
    status: 'published',
    isFeatured: true,
    readTime: 4,
    views: 1240,
    likesCount: 89,
    commentsCount: 12,
    seoTitle: 'How to Build a High-Converting Modeling Portfolio in India | ModelVerse',
    seoDescription: 'Guide for Indian models to create an agency-ready portfolio in Mumbai and Delhi.',
    seoKeywords: 'modeling portfolio, Indian models, casting digitals, polaroids, Inega'
  },
  {
    id: 'b2',
    title: 'The Rise of UGC Creators and Influencers in Commercial Modeling',
    slug: 'the-rise-of-ugc-creators-and-influencers-in-commercial-modeling',
    category: 'Industry News',
    categoryId: 'cat-5',
    summary: 'Why modern lifestyle brands across Bangalore, Mumbai, and Gurgaon are shifting budget shares towards authentic, self-managed user-generated content creators.',
    content: `The marketing landscape in 2026 has witnessed a massive decentralization of media. Traditional models are expanding their skillset into speaking, script-building, and self-publishing, while authentic UGC creators are gaining runway recognition.\n\n### Why Brands Prefer UGC\nUnlike high-glamour billboard models who are silent ambassadors, UGC creators speak directly to the smartphone camera, making product benefits feel like a recommendation from a reliable close friend. This authentic presentation triggers a 4x higher purchase conversion rate for social media campaigns.\n\n### Key Skills for Modern UGC Models:\n- **Flawless lighting setup:** Mastering small ring lights, softboxes, and natural ambient lighting in a background.\n- **Dynamic copywriting:** Writing a 15-second TikTok/Reel hook that retains the consumer in the first 2 seconds.\n- **Clean voice-overs:** Clear, energetic pronunciation of brand names in multiple languages (English, Hindi, regional).\n\nBrand campaigns now seek creators who can deliver both beautiful visuals and rich performance. ModelVerse India bridges this gap by labeling creators clearly for high-intent agencies!`,
    excerpt: 'Why modern lifestyle brands are shifting budget shares towards authentic UGC creators.',
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop',
    featuredImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop',
    author: 'Nisha Sundaram (E-com Casting Lead)',
    authorName: 'Nisha Sundaram',
    authorRole: 'client',
    publishedDate: 'Jun 18, 2026',
    publishedAt: '2026-06-18T10:00:00Z',
    status: 'published',
    isFeatured: false,
    readTime: 3,
    views: 875,
    likesCount: 54,
    commentsCount: 6,
    seoTitle: 'The Rise of UGC Creators in Commercial Modeling | ModelVerse India',
    seoDescription: 'Insights into how UGC creators are reshaping commercial brand campaigns.',
    seoKeywords: 'UGC creator, commercial modeling, brand campaign, e-commerce'
  }
];

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || `blog-${Date.now()}`;
}

export function calculateReadTime(content: string): number {
  if (!content) return 1;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

function getLocalBlogs(): BlogItem[] {
  try {
    if (fs.existsSync(LOCAL_BLOGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_BLOGS_FILE, 'utf8'));
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.error('Error reading local blogs file:', e);
  }
  return INITIAL_BLOGS;
}

function saveLocalBlogs(blogs: BlogItem[]) {
  try {
    fs.writeFileSync(LOCAL_BLOGS_FILE, JSON.stringify(blogs, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local blogs file:', e);
  }
}

function mapSupabaseRowToBlog(row: any): BlogItem {
  const content = row.content || '';
  const title = row.title || 'Untitled Article';
  const resolvedImage = row.featured_image || row.image_url || row.image || row.imageUrl || 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800&auto=format&fit=crop';
  return {
    id: row.id,
    title,
    slug: row.slug || generateSlug(title),
    category: row.category || 'Industry Tips',
    categoryId: row.category_id || row.categoryId,
    summary: row.brief_summary || row.summary || row.excerpt || '',
    content,
    excerpt: row.excerpt || row.brief_summary || row.summary || '',
    imageUrl: resolvedImage,
    featuredImage: resolvedImage,
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
    readTime: row.read_time || calculateReadTime(content),
    views: row.views || 0,
    likesCount: row.likes_count || row.likesCount || 0,
    commentsCount: row.comments_count || row.commentsCount || 0,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    seoKeywords: row.seo_keywords,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at || null
  };
}

export class BlogRepository {
  async findAll(filters?: { status?: string; role?: string; userEmail?: string; category?: string; search?: string }): Promise<BlogItem[]> {
    let dbBlogs: BlogItem[] = [];

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let query = supabaseAdmin.from('blogs').select('*').is('deleted_at', null).order('created_at', { ascending: false });

        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        if (filters?.category) {
          query = query.eq('category', filters.category);
        }

        const { data, error } = await withTimeout(query, 3000);
        if (!error && data && data.length > 0) {
          dbBlogs = data.map(mapSupabaseRowToBlog);
        }
      } catch (e) {
        console.error('Supabase blogs query failed, using local fallback:', e);
      }
    }

    const localBlogs = getLocalBlogs().filter(b => !b.deletedAt);
    const mergedMap = new Map<string, BlogItem>();
    
    localBlogs.forEach((b) => mergedMap.set(b.id, b));
    dbBlogs.forEach((b) => mergedMap.set(b.id, b));

    let results = Array.from(mergedMap.values());

    // Apply filter logic (status, search, category, role visibility)
    if (filters?.status) {
      results = results.filter(b => b.status === filters.status);
    }
    if (filters?.category) {
      results = results.filter(b => b.category.toLowerCase() === filters.category?.toLowerCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(b => 
        b.title.toLowerCase().includes(q) || 
        b.summary.toLowerCase().includes(q) || 
        b.content.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
      );
    }

    return results;
  }

  async findByIdOrSlug(idOrSlug: string): Promise<BlogItem | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const isUuid = idOrSlug.includes('-');
        let query = supabaseAdmin.from('blogs').select('*').is('deleted_at', null);
        if (isUuid && idOrSlug.length >= 30) {
          query = query.or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`);
        } else {
          query = query.or(`slug.eq.${idOrSlug},id.eq.${idOrSlug}`);
        }

        const { data, error } = await withTimeout(query.maybeSingle(), 2500);
        if (!error && data) {
          return mapSupabaseRowToBlog(data);
        }
      } catch (e) {
        console.error(`Supabase query for blog ${idOrSlug} failed:`, e);
      }
    }

    const localBlogs = getLocalBlogs();
    return localBlogs.find((b) => (b.id === idOrSlug || b.slug === idOrSlug) && !b.deletedAt) || null;
  }

  async save(blog: BlogItem): Promise<BlogItem> {
    const slug = blog.slug || generateSlug(blog.title);
    const readTime = blog.readTime || calculateReadTime(blog.content);
    const status = blog.status || 'published';

    const normalizedBlog: BlogItem = {
      ...blog,
      slug,
      readTime,
      status,
      excerpt: blog.excerpt || blog.summary,
      authorName: blog.authorName || blog.author.split('(')[0].trim(),
      updatedAt: new Date().toISOString()
    };

    const localBlogs = getLocalBlogs();
    const idx = localBlogs.findIndex((b) => b.id === normalizedBlog.id);
    if (idx >= 0) {
      localBlogs[idx] = normalizedBlog;
    } else {
      localBlogs.unshift(normalizedBlog);
    }
    saveLocalBlogs(localBlogs);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const row = {
          id: String(normalizedBlog.id),
          title: normalizedBlog.title,
          slug: normalizedBlog.slug,
          category: normalizedBlog.category,
          category_id: normalizedBlog.categoryId ? String(normalizedBlog.categoryId) : null,
          brief_summary: normalizedBlog.summary,
          summary: normalizedBlog.summary,
          content: normalizedBlog.content,
          excerpt: normalizedBlog.excerpt,
          featured_image: normalizedBlog.imageUrl,
          image_url: normalizedBlog.imageUrl,
          image: normalizedBlog.imageUrl,
          author_name: normalizedBlog.authorName || normalizedBlog.author,
          author: normalizedBlog.author,
          author_role: normalizedBlog.authorRole || 'contributor',
          author_email: normalizedBlog.authorEmail || null,
          author_id: (normalizedBlog.authorId || normalizedBlog.userId) ? String(normalizedBlog.authorId || normalizedBlog.userId) : null,
          user_id: (normalizedBlog.userId || normalizedBlog.authorId) ? String(normalizedBlog.userId || normalizedBlog.authorId) : null,
          status: normalizedBlog.status,
          is_featured: normalizedBlog.isFeatured || false,
          read_time: normalizedBlog.readTime,
          views: normalizedBlog.views || 0,
          likes_count: normalizedBlog.likesCount || 0,
          comments_count: normalizedBlog.commentsCount || 0,
          seo_title: normalizedBlog.seoTitle || normalizedBlog.title,
          seo_description: normalizedBlog.seoDescription || normalizedBlog.summary,
          seo_keywords: normalizedBlog.seoKeywords || normalizedBlog.category,
          published_at: normalizedBlog.publishedAt || new Date().toISOString(),
          published_date: normalizedBlog.publishedDate,
          updated_at: normalizedBlog.updatedAt
        };

        const { error } = await withTimeout(
          supabaseAdmin.from('blogs').upsert(row),
          4000
        );
        if (error) {
          console.error(`[BlogRepository] Supabase upsert error for blog ${normalizedBlog.id}:`, error.message || error);
        } else {
          console.log(`[BlogRepository] Successfully synced blog "${normalizedBlog.title}" (${normalizedBlog.id}) to Supabase database.`);
        }
      } catch (e: any) {
        console.error(`[BlogRepository] Supabase upsert failed for blog ${normalizedBlog.id}:`, e.message || e);
      }
    }

    return normalizedBlog;
  }

  async updateStatus(id: string, status: 'published' | 'rejected' | 'pending' | 'draft', isFeatured?: boolean): Promise<BlogItem | null> {
    const blog = await this.findByIdOrSlug(id);
    if (!blog) return null;

    blog.status = status;
    if (typeof isFeatured === 'boolean') {
      blog.isFeatured = isFeatured;
    }
    blog.updatedAt = new Date().toISOString();

    return this.save(blog);
  }

  async delete(id: string): Promise<boolean> {
    const localBlogs = getLocalBlogs();
    const idx = localBlogs.findIndex((b) => b.id === id);
    if (idx >= 0) {
      localBlogs[idx].deletedAt = new Date().toISOString();
      saveLocalBlogs(localBlogs);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await withTimeout(
          supabaseAdmin.from('blogs').update({ deleted_at: new Date().toISOString() }).eq('id', id),
          2500
        );
        if (error) {
          console.warn(`Supabase soft delete warning for blog ${id}:`, error.message || error);
        }
      } catch (e) {
        console.error(`Supabase soft delete failed for blog ${id}:`, e);
      }
    }

    return idx >= 0;
  }

  async getCategories(): Promise<BlogCategoryItem[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('blog_categories').select('*').eq('is_active', true),
          2500
        );
        if (!error && data && data.length > 0) {
          return data.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            icon: c.icon,
            isActive: c.is_active,
            createdAt: c.created_at
          }));
        }
      } catch (e) {
        console.warn('Supabase blog categories query failed, using defaults:', e);
      }
    }
    return DEFAULT_CATEGORIES;
  }
}

export const blogRepository = new BlogRepository();

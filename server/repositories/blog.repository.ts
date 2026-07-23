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
  category: string;
  summary: string;
  content: string;
  imageUrl: string;
  author: string;
  publishedDate: string;
  authorEmail?: string;
  authorRole?: string;
  userId?: string;
}

const LOCAL_BLOGS_FILE = path.join(process.cwd(), 'local_blogs.json');

const INITIAL_BLOGS: BlogItem[] = [
  {
    id: 'b1',
    title: 'How to Build a High-Converting Modeling Portfolio in India',
    category: 'Industry Tips',
    summary: 'Essential guidelines for Indian modeling talent to draft a visual portfolio that grabs the immediate attention of major casting agencies and couture directors.',
    content: `Building a modeling portfolio is your first calling card. In the Indian fashion industry—ranging from high-fashion couture in Delhi or Mumbai to heavy commercial and catalog work—agencies look for versatility and canvas quality.\n\n### 1. The Power of "Polaroids"\nFirst thing first, casting directors want to see your natural face. These are called casting digitals or polaroids. Avoid thick makeup, wear basic, close-fitting clothing (like a black tank top and blue jeans), and shoot in crisp, natural window daylight. Include:\n- A headshot (front)\n- Profile headshots (left and right)\n- Full-length body shot\n- Three-quarter length body shot\n\n### 2. Diversify Your Looks\nYour portfolio shouldn't just contain one aesthetic. Showcase:\n- **Traditional Indian Wear:** Highly demanded for Indian weddings and festive seasons.\n- **Western Casuals:** Perfect for e-commerce catalog auditions.\n- **High Fashion/Avant-Garde:** Demonstrates your editorial expression of lines and shadows.\n\n### 3. Work with Professional Photographers\nWhile beginner models do "TFP" (Time for Print) tests, investing in a reputable fashion photographer who understands agency standards makes a dramatic difference. Ensure your photos tell a story and stay updated with your latest hairstyle and body measurements!`,
    imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800&auto=format&fit=crop',
    author: 'Karan Mehra (Inega Director)',
    publishedDate: 'Jun 14, 2026'
  },
  {
    id: 'b2',
    title: 'The Rise of UGC Creators and Influencers in Commercial Modeling',
    category: 'Casting Guides',
    summary: 'Why modern lifestyle brands across Bangalore, Mumbai, and Gurgaon are shifting budget shares towards authentic, self-managed user-generated content creators.',
    content: `The marketing landscape in 2026 has witnessed a massive decentralization of media. Traditional models are expanding their skillset into speaking, script-building, and self-publishing, while authentic UGC creators are gaining runway recognition.\n\n### Why Brands Prefer UGC\nUnlike high-glamour billboard models who are silent ambassadors, UGC creators speak directly to the smartphone camera, making product benefits feel like a recommendation from a reliable close friend. This authentic presentation triggers a 4x higher purchase conversion rate for social media campaigns.\n\n### Key Skills for Modern UGC Models:\n- **Flawless lighting setup:** Mastering small ring lights, softboxes, and natural ambient lighting in a background.\n- **Dynamic copywriting:** Writing a 15-second TikTok/Reel hook that retains the consumer in the first 2 seconds.\n- **Clean voice-overs:** Clear, energetic pronunciation of brand names in multiple languages (English, Hindi, regional).\n\nBrand campaigns now seek creators who can deliver both beautiful visuals and rich performance. ModelVerse India bridges this gap by labeling creators clearly for high-intent agencies!`,
    imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop',
    author: 'Nisha Sundaram (E-com Casting lead)',
    publishedDate: 'Jun 18, 2026'
  }
];

function getLocalBlogs(): BlogItem[] {
  try {
    if (fs.existsSync(LOCAL_BLOGS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_BLOGS_FILE, 'utf8'));
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

export class BlogRepository {
  async findAll(): Promise<BlogItem[]> {
    let dbBlogs: BlogItem[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('blogs').select('*').order('created_at', { ascending: false }),
          2500
        );
        if (!error && data && data.length > 0) {
          dbBlogs = data.map((b: any) => ({
            id: b.id,
            title: b.title,
            category: b.category,
            summary: b.summary,
            content: b.content,
            imageUrl: b.image_url || b.imageUrl,
            author: b.author,
            publishedDate: b.published_date || b.publishedDate,
            authorEmail: b.author_email || b.authorEmail,
            authorRole: b.author_role || b.authorRole,
            userId: b.user_id || b.userId
          }));
        }
      } catch (e) {
        console.error('Supabase blogs query failed, using local fallback:', e);
      }
    }

    const localBlogs = getLocalBlogs();
    const mergedMap = new Map<string, BlogItem>();
    localBlogs.forEach((b) => mergedMap.set(b.id, b));
    dbBlogs.forEach((b) => mergedMap.set(b.id, b));

    return Array.from(mergedMap.values());
  }

  async findById(id: string): Promise<BlogItem | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('blogs').select('*').eq('id', id).maybeSingle(),
          2500
        );
        if (!error && data) {
          return {
            id: data.id,
            title: data.title,
            category: data.category,
            summary: data.summary,
            content: data.content,
            imageUrl: data.image_url || data.imageUrl,
            author: data.author,
            publishedDate: data.published_date || data.publishedDate,
            authorEmail: data.author_email || data.authorEmail,
            authorRole: data.author_role || data.authorRole,
            userId: data.user_id || data.userId
          };
        }
      } catch (e) {
        console.error(`Supabase query for blog ${id} failed:`, e);
      }
    }

    const localBlogs = getLocalBlogs();
    return localBlogs.find((b) => b.id === id) || null;
  }

  async save(blog: BlogItem): Promise<BlogItem> {
    const localBlogs = getLocalBlogs();
    const idx = localBlogs.findIndex((b) => b.id === blog.id);
    if (idx >= 0) {
      localBlogs[idx] = blog;
    } else {
      localBlogs.unshift(blog);
    }
    saveLocalBlogs(localBlogs);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const row = {
          id: blog.id,
          title: blog.title,
          category: blog.category,
          summary: blog.summary,
          content: blog.content,
          image_url: blog.imageUrl,
          author: blog.author,
          published_date: blog.publishedDate,
          author_email: blog.authorEmail || null,
          author_role: blog.authorRole || null,
          user_id: blog.userId || null,
          updated_at: new Date().toISOString()
        };
        const { error } = await withTimeout(
          supabaseAdmin.from('blogs').upsert(row),
          2500
        );
        if (error) console.warn(`Supabase upsert warning for blog ${blog.id}:`, error.message || error);
      } catch (e: any) {
        console.warn(`Supabase upsert failed for blog ${blog.id}:`, e.message || e);
      }
    }

    return blog;
  }

  async delete(id: string): Promise<boolean> {
    const localBlogs = getLocalBlogs();
    const filtered = localBlogs.filter((b) => b.id !== id);
    if (filtered.length !== localBlogs.length) {
      saveLocalBlogs(filtered);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await withTimeout(
          supabaseAdmin.from('blogs').delete().eq('id', id),
          2500
        );
        if (error) console.warn(`Supabase delete warning for blog ${id}:`, error.message || error);
      } catch (e) {
        console.error(`Supabase delete failed for blog ${id}:`, e);
      }
    }

    return filtered.length !== localBlogs.length;
  }
}

export const blogRepository = new BlogRepository();

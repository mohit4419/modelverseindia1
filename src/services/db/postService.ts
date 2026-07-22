/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../../supabaseClient';
import { Post } from '../../types';
import { isSupabaseAvailable, ensureModelExistsInDb, sanitizeValue } from './helpers';
import { SEED_POSTS, SEED_MODELS } from './seedData';

export const postService = {
  async getPosts(): Promise<Post[]> {
    let dbPosts: Post[] = [];
    if (isSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase.from('posts').select('*');
        if (!error && data) {
          dbPosts = data.map((p: any) => ({
            id: p.id,
            modelId: p.model_id || p.modelId,
            modelName: p.model_name || p.modelName,
            modelAvatar: p.model_avatar || p.modelAvatar,
            imageUrl: p.image_url || p.imageUrl,
            caption: p.caption,
            likesCount: p.likes_count || p.likesCount || 0,
            commentsCount: p.comments_count || p.commentsCount || 0,
            createdAt: p.created_at || p.createdAt,
            likedByMe: p.likedByMe || false
          }));
        }
      } catch (e) {
        console.error('Supabase posts fetch failed, using fallback', e);
      }
    }
    const local = localStorage.getItem('mvi_posts');
    const localPosts: Post[] = local ? JSON.parse(local) : SEED_POSTS;
    
    const mergedMap = new Map<string, Post>();
    localPosts.forEach(p => mergedMap.set(p.id, p));
    dbPosts.forEach(p => mergedMap.set(p.id, p));
    
    const sortedPosts = Array.from(mergedMap.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sanitizeValue(sortedPosts);
  },

  async savePost(post: Post): Promise<void> {
    try {
      const posts = await this.getPosts();
      const idx = posts.findIndex(p => p.id === post.id);
      if (idx >= 0) {
        posts[idx] = post;
      } else {
        posts.unshift(post);
      }
      localStorage.setItem('mvi_posts', JSON.stringify(posts));
    } catch (localErr) {
      console.error('Local storage savePost failed:', localErr);
    }

    if (isSupabaseAvailable && supabase) {
      try {
        if (post.modelId) {
          await ensureModelExistsInDb(post.modelId, SEED_MODELS);
        }
        const { error } = await supabase
          .from('posts')
          .upsert({
            id: post.id,
            model_id: post.modelId,
            model_name: post.modelName,
            model_avatar: post.modelAvatar,
            image_url: post.imageUrl,
            caption: post.caption,
            likes_count: post.likesCount,
            comments_count: post.commentsCount,
            created_at: post.createdAt
          });
        if (error) console.error('Supabase savePost failed', error);
      } catch (e) {
        console.error('Supabase savePost error', e);
      }
    }
  },

  async toggleLikePost(postId: string): Promise<void> {
    try {
      const posts = await this.getPosts();
      const idx = posts.findIndex(p => p.id === postId);
      if (idx >= 0) {
        const post = posts[idx];
        const liked = !post.likedByMe;
        post.likedByMe = liked;
        post.likesCount = liked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);
        posts[idx] = post;
        localStorage.setItem('mvi_posts', JSON.stringify(posts));
        
        if (isSupabaseAvailable && supabase) {
          await supabase
            .from('posts')
            .update({
              likes_count: post.likesCount
            })
            .eq('id', postId);
        }
      }
    } catch (e) {
      console.error('Failed to toggle like on post', e);
    }
  }
};

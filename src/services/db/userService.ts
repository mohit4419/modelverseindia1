/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../../supabaseClient';
import { User } from '../../types';
import { isSupabaseAvailable, isUUID, removeUndefined, sanitizeValue } from './helpers';
import { SEED_USERS } from './seedData';

export async function getUsers(): Promise<User[]> {
  let dbUsers: User[] = [];
  if (isSupabaseAvailable && supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) {
        dbUsers = data as User[];
      }
    } catch (e) {
      console.error('Supabase users fetch failed', e);
    }
  }
  const local = localStorage.getItem('mvi_users');
  const localUsers: User[] = local ? JSON.parse(local) : SEED_USERS;

  const mergedMap = new Map<string, User>();
  SEED_USERS.forEach(u => mergedMap.set(u.id, u));
  localUsers.forEach(u => mergedMap.set(u.id, u));
  dbUsers.forEach(u => mergedMap.set(u.id, u));

  return sanitizeValue(Array.from(mergedMap.values()));
}

export async function saveUser(user: User): Promise<void> {
  try {
    const users = await getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem('mvi_users', JSON.stringify(users));
  } catch (localErr) {
    console.error('Local storage saveUser failed:', localErr);
  }

  if (isSupabaseAvailable && supabase) {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(removeUndefined(user));
      if (error) throw error;
      console.log(`Successfully saved user profile for ${user.id} in Supabase`);
    } catch (e: any) {
      console.warn('Supabase user save failed, falling back to local storage:', e);
    }
  }
}

export async function getUser(userId: string): Promise<User | null> {
  if (isSupabaseAvailable && supabase) {
    try {
      if (isUUID(userId)) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (!error && data) {
          return sanitizeValue(data as User);
        }
      } else if (userId.includes('@')) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userId.trim().toLowerCase())
          .maybeSingle();
        if (!error && data) {
          return sanitizeValue(data as User);
        }
      }
    } catch (e: any) {
      console.warn(`Failed to fetch user ${userId} directly from Supabase, falling back to compiled memory:`, e);
    }
  }
  const users = await getUsers();
  const found = users.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase()) || null;
  return found ? sanitizeValue(found) : null;
}

export async function getUserFavorites(userId: string): Promise<string[] | null> {
  if (isSupabaseAvailable && supabase) {
    try {
      if (isUUID(userId) || userId.includes('@')) {
        const query = supabase.from('profiles').select('favorites');
        const { data, error } = isUUID(userId)
          ? await query.eq('id', userId).maybeSingle()
          : await query.eq('email', userId.trim().toLowerCase()).maybeSingle();
        if (!error && data) {
          return data.favorites || [];
        }
      }
    } catch (e) {
      console.error('Supabase fetch favorites failed:', e);
    }
  }
  return null;
}

export async function saveUserFavorites(userId: string, favorites: string[]): Promise<void> {
  if (isSupabaseAvailable && supabase) {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          favorites,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
    } catch (e) {
      console.error('Supabase save favorites failed:', e);
    }
  }
}


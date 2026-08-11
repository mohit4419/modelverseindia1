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
  let modelEmails = new Set<string>();
  let modelUserIds = new Set<string>();

  if (isSupabaseAvailable && supabase) {
    // 1. Fetch from profiles table
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) {
        dbUsers = data as User[];
      }
    } catch (e) {
      console.error('Supabase profiles fetch failed', e);
    }

    // 2. Fetch from public.users table as well
    try {
      const { data: usersData, error: usersErr } = await supabase.from('users').select('*');
      if (!usersErr && usersData && Array.isArray(usersData)) {
        usersData.forEach((u: any) => {
          const existingIdx = dbUsers.findIndex(existing => existing.id === u.id || (existing.email && u.email && existing.email.toLowerCase() === u.email.toLowerCase()));
          const userObj: User = {
            id: u.id,
            name: u.full_name || u.name || (u.email ? u.email.split('@')[0] : 'User'),
            email: u.email || '',
            phone: u.phone || u.phone_number || '',
            role: u.role || 'client',
            status: u.status || 'active',
            createdAt: u.created_at || new Date().toISOString()
          };
          if (existingIdx >= 0) {
            // Keep role if users table defines a specific role
            if (u.role && u.role !== 'client') {
              dbUsers[existingIdx].role = u.role;
            }
          } else {
            dbUsers.push(userObj);
          }
        });
      }
    } catch (e) {
      console.warn('Supabase public.users query note:', e);
    }

    // 3. Fetch registered models to detect model roles accurately
    try {
      const { data: modelsData, error: modelsErr } = await supabase.from('models').select('id, userId, user_id, email, phone');
      if (!modelsErr && modelsData && Array.isArray(modelsData)) {
        modelsData.forEach((m: any) => {
          if (m.email) modelEmails.add(m.email.toLowerCase());
          if (m.userId) modelUserIds.add(m.userId);
          if (m.user_id) modelUserIds.add(m.user_id);
          if (m.id) modelUserIds.add(m.id);
        });
      }
    } catch (e) {
      console.warn('Supabase models scan note:', e);
    }
  }

  // Local models check
  try {
    const localModels = localStorage.getItem('mvi_models');
    if (localModels) {
      const parsed = JSON.parse(localModels);
      if (Array.isArray(parsed)) {
        parsed.forEach((m: any) => {
          if (m.email) modelEmails.add(m.email.toLowerCase());
          if (m.userId) modelUserIds.add(m.userId);
          if (m.id) modelUserIds.add(m.id);
        });
      }
    }
  } catch (e) {}

  const local = localStorage.getItem('mvi_users');
  const localUsers: User[] = local ? JSON.parse(local) : SEED_USERS;

  const mergedMap = new Map<string, User>();
  SEED_USERS.forEach(u => mergedMap.set(u.id, u));
  localUsers.forEach(u => mergedMap.set(u.id, u));
  dbUsers.forEach(u => mergedMap.set(u.id, u));

  const allList = Array.from(mergedMap.values()).map(u => {
    // If user's email or userId exists in models table, their true role is 'model'
    if (
      (u.email && modelEmails.has(u.email.toLowerCase())) ||
      (u.id && modelUserIds.has(u.id))
    ) {
      return { ...u, role: 'model' as const };
    }
    return u;
  });

  return sanitizeValue(allList);
}

export async function saveUser(user: User): Promise<void> {
  try {
    const users = await getUsers();
    const idx = users.findIndex(u => u.id === user.id || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()));
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem('mvi_users', JSON.stringify(users));
  } catch (localErr) {
    console.error('Local storage saveUser failed:', localErr);
  }

  if (isSupabaseAvailable && supabase && isUUID(user.id)) {
    try {
      const userRow = {
        ...user,
        created_at: (user as any).createdAt || (user as any).created_at
      };
      delete (userRow as any).createdAt;

      // Upsert into profiles table
      await supabase
        .from('profiles')
        .upsert(removeUndefined(userRow));

      // Also upsert into public.users table for complete schema alignment
      await supabase
        .from('users')
        .upsert(removeUndefined({
          id: user.id,
          full_name: user.name,
          email: user.email?.toLowerCase(),
          phone: user.phone,
          role: user.role || 'client',
          status: user.status || 'active',
          updated_at: new Date().toISOString()
        }));

      console.log(`Successfully synchronized user profile & public.users for ${user.id} (${user.role}) in Supabase`);
    } catch (e: any) {
      console.warn('Supabase user save note:', e?.message || e);
    }
  }
}

export async function getUser(userId: string): Promise<User | null> {
  const cleanId = userId.trim().toLowerCase();
  if (isSupabaseAvailable && supabase) {
    try {
      if (isUUID(userId)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (profile) return sanitizeValue(profile as User);

        const { data: uData } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (uData) {
          return sanitizeValue({
            id: uData.id,
            name: uData.full_name || uData.name,
            email: uData.email,
            phone: uData.phone || uData.phone_number,
            role: uData.role,
            status: uData.status,
            createdAt: uData.created_at
          } as User);
        }
      } else if (cleanId.includes('@')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanId)
          .maybeSingle();
        if (profile) return sanitizeValue(profile as User);

        const { data: uData } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanId)
          .maybeSingle();
        if (uData) {
          return sanitizeValue({
            id: uData.id,
            name: uData.full_name || uData.name,
            email: uData.email,
            phone: uData.phone || uData.phone_number,
            role: uData.role,
            status: uData.status,
            createdAt: uData.created_at
          } as User);
        }
      }
    } catch (e: any) {
      console.warn(`Failed to fetch user ${userId} directly from Supabase:`, e);
    }
  }
  const users = await getUsers();
  const found = users.find(u => u.id === userId || (u.email && u.email.toLowerCase() === cleanId)) || null;
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

export async function deleteUser(userId: string): Promise<void> {
  // 1. Delete from LocalStorage
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const local = localStorage.getItem('mvi_users');
      if (local) {
        const users: User[] = JSON.parse(local);
        const filtered = users.filter(u => u.id !== userId && u.email?.toLowerCase() !== userId.toLowerCase());
        localStorage.setItem('mvi_users', JSON.stringify(filtered));
      }
    }
  } catch (e) {
    console.warn('LocalStorage deleteUser error:', e);
  }

  // 2. Delete from Supabase Database
  if (isSupabaseAvailable && supabase) {
    try {
      if (isUUID(userId)) {
        await supabase.from('profiles').delete().eq('id', userId);
      }
      await supabase.from('profiles').delete().eq('email', userId.trim().toLowerCase());
    } catch (e) {
      console.warn('Supabase deleteUser error:', e);
    }
  }
}


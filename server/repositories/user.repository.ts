/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured, withTimeout } from '../config/supabase';
import { User, Profile } from '../types';

const LOCAL_USERS_FILE = path.join(process.cwd(), 'local_hashed_users.json');
const LOCAL_PROFILES_FILE = path.join(process.cwd(), 'local_profiles.json');

function getLocalUsers(): User[] {
  try {
    if (fs.existsSync(LOCAL_USERS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_USERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local users file:', e);
  }
  return [];
}

function saveLocalUsers(users: User[]) {
  try {
    fs.writeFileSync(LOCAL_USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local users file:', e);
  }
}

function getLocalProfiles(): Profile[] {
  try {
    if (fs.existsSync(LOCAL_PROFILES_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_PROFILES_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local profiles file:', e);
  }
  return [];
}

function saveLocalProfiles(profiles: Profile[]) {
  try {
    fs.writeFileSync(LOCAL_PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local profiles file:', e);
  }
}

export class UserRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    const cleanEmail = email.trim().toLowerCase();
    
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('users').select('*').eq('email', cleanEmail).maybeSingle(),
          2500
        );
        if (!error && data) {
          return {
            id: data.id,
            email: data.email,
            passwordHash: data.password_hash,
            salt: data.salt,
            phoneNumber: data.phone_number,
            createdAt: data.created_at,
          } as User;
        }
      } catch (e) {
        console.error('Supabase query user by email failed:', e);
      }
    }

    const localUsers = getLocalUsers();
    return localUsers.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  }

  async findProfileById(id: string): Promise<Profile | null> {
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('profiles').select('*').eq('id', id).maybeSingle(),
          2500
        );
        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            phone: data.phone,
            status: data.status,
            avatarUrl: data.avatarUrl,
            favorites: data.favorites,
            createdAt: data.createdAt,
            updatedAt: data.updated_at,
          } as Profile;
        }
      } catch (e) {
        console.error('Supabase query profile by id failed:', e);
      }
    }

    const localProfiles = getLocalProfiles();
    return localProfiles.find((p) => p.id === id) || null;
  }

  async createUser(user: User): Promise<User> {
    const localUsers = getLocalUsers();
    localUsers.push(user);
    saveLocalUsers(localUsers);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await withTimeout(
          supabaseAdmin.from('users').insert({
            id: user.id,
            email: user.email.toLowerCase(),
            password_hash: user.passwordHash,
            salt: user.salt,
            phone_number: user.phoneNumber || null,
            created_at: user.createdAt || new Date().toISOString(),
          }),
          2500
        );
        if (error) throw error;
      } catch (e) {
        console.error('Supabase create user failed:', e);
      }
    }

    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<boolean> {
    const localUsers = getLocalUsers();
    const idx = localUsers.findIndex((u) => u.id === id);
    if (idx >= 0) {
      localUsers[idx] = { ...localUsers[idx], ...updates };
      saveLocalUsers(localUsers);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const mappedUpdates: any = {};
        if (updates.email) mappedUpdates.email = updates.email.toLowerCase();
        if (updates.passwordHash) mappedUpdates.password_hash = updates.passwordHash;
        if (updates.salt) mappedUpdates.salt = updates.salt;
        if (updates.phoneNumber !== undefined) mappedUpdates.phone_number = updates.phoneNumber;

        const { error } = await withTimeout(
          supabaseAdmin.from('users').update(mappedUpdates).eq('id', id),
          2500
        );
        if (error) throw error;
      } catch (e) {
        console.error(`Supabase update user ${id} failed:`, e);
      }
    }
    return true;
  }

  async deleteUser(id: string): Promise<boolean> {
    const localUsers = getLocalUsers();
    const filteredUsers = localUsers.filter((u) => u.id !== id);
    saveLocalUsers(filteredUsers);

    const localProfiles = getLocalProfiles();
    const filteredProfiles = localProfiles.filter((p) => p.id !== id);
    saveLocalProfiles(filteredProfiles);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        await withTimeout(
          supabaseAdmin.from('profiles').delete().eq('id', id),
          2500
        );
        await withTimeout(
          supabaseAdmin.from('users').delete().eq('id', id),
          2500
        );
      } catch (e) {
        console.error(`Supabase delete user ${id} failed:`, e);
      }
    }
    return true;
  }

  async saveProfile(profile: Profile): Promise<Profile> {
    const localProfiles = getLocalProfiles();
    const idx = localProfiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      localProfiles[idx] = profile;
    } else {
      localProfiles.push(profile);
    }
    saveLocalProfiles(localProfiles);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await withTimeout(
          supabaseAdmin.from('profiles').upsert({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            phone: profile.phone,
            status: profile.status,
            avatarUrl: profile.avatarUrl,
            favorites: profile.favorites,
            updated_at: new Date().toISOString(),
          }),
          2500
        );
        if (error) throw error;
      } catch (e) {
        console.error('Supabase save profile failed:', e);
      }
    }

    return profile;
  }

  async findAllProfiles(): Promise<Profile[]> {
    let dbProfiles: Profile[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('profiles').select('*'),
          2500
        );
        if (!error && data) {
          dbProfiles = data as Profile[];
        }
      } catch (e) {
        console.error('Supabase profiles query failed, using local fallback:', e);
      }
    }

    const localProfiles = getLocalProfiles();
    const mergedMap = new Map<string, Profile>();
    localProfiles.forEach((p) => mergedMap.set(p.id, p));
    dbProfiles.forEach((p) => mergedMap.set(p.id, p));

    return Array.from(mergedMap.values());
  }

  async findAllUsers(): Promise<User[]> {
    let dbUsers: User[] = [];
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('users').select('*'),
          2500
        );
        if (!error && data) {
          dbUsers = data.map((d: any) => ({
            id: d.id,
            email: d.email,
            passwordHash: d.password_hash,
            salt: d.salt,
            phoneNumber: d.phone_number,
            createdAt: d.created_at,
          })) as User[];
        }
      } catch (e) {
        console.error('Supabase users query failed, using local fallback:', e);
      }
    }

    const localUsers = getLocalUsers();
    const mergedMap = new Map<string, User>();
    localUsers.forEach((u) => mergedMap.set(u.id, u));
    dbUsers.forEach((u) => mergedMap.set(u.id, u));

    return Array.from(mergedMap.values());
  }
}

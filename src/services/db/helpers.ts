/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../../supabaseClient';
import { User, Model } from '../../types';

export let isSupabaseAvailable = isSupabaseConfigured;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface DatabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  let errorMessage = '';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error && typeof error === 'object') {
    errorMessage = (error as any).message || (error as any).details || JSON.stringify(error);
  } else {
    errorMessage = String(error);
  }

  const errInfo: DatabaseErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: null,
      email: null
    },
    operationType,
    path
  };
  console.error('Database Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function removeUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item)) as any;
  }
  
  const cleanObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleanObj[key] = removeUndefined(val);
      }
    }
  }
  return cleanObj;
}

export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// Self-healing database helpers to ensure referential integrity before saves
export async function getValidUserIdForModel(providedUserId?: string): Promise<string> {
  if (!isSupabaseAvailable || !supabase) return providedUserId || 'u_default';
  
  if (isUUID(providedUserId)) {
    const { data } = await supabase.from('users').select('id').eq('id', providedUserId).maybeSingle();
    if (data?.id) return data.id;
  }
  
  const { data: firstUser } = await supabase.from('users').select('id').limit(1).maybeSingle();
  if (firstUser?.id) return firstUser.id;
  
  return providedUserId || 'u_default';
}

export async function ensureUserExistsInDb(
  userId: string,
  name?: string,
  email?: string,
  seedUsers: User[] = []
): Promise<void> {
  if (!isSupabaseAvailable || !supabase) return;
  try {
    let localUsers: User[] = seedUsers;
    if (typeof window !== 'undefined' && window.localStorage) {
      const local = localStorage.getItem('mvi_users');
      if (local) localUsers = JSON.parse(local);
    }
    const existing = localUsers.find(u => u.id === userId) || seedUsers.find(u => u.id === userId);
    const userToInsert: Record<string, any> = existing ? { ...existing, created_at: (existing as any).createdAt || (existing as any).created_at } : {
      id: userId,
      role: 'model',
      name: name || 'Demo Model User',
      email: email || 'model@modelverse.in',
      phone: '+91 98765 43210',
      status: 'active',
      created_at: new Date().toISOString()
    };
    delete (userToInsert as any).createdAt;

    // Only upsert to Supabase profiles table if userId is a valid UUID
    if (isUUID(userId)) {
      const { error: pErr } = await supabase.from('profiles').upsert(removeUndefined(userToInsert));
      if (pErr) console.warn('Supabase profiles table upsert note:', pErr.message);
    }
  } catch (err) {
    console.warn(`[Self-healing] Failed to ensure user ${userId} exists in Supabase:`, err);
  }
}

export async function ensureModelExistsInDb(
  modelId: string,
  seedModels: Model[] = []
): Promise<void> {
  if (!isSupabaseAvailable || !supabase) return;
  try {
    const { data, error } = await supabase.from('models').select('id').eq('id', modelId).maybeSingle();
    if (!error && data) {
      return;
    }
    const local = localStorage.getItem('mvi_models');
    const localModels: Model[] = local ? JSON.parse(local) : seedModels;
    const existing = localModels.find(m => m.id === modelId) || seedModels.find(m => m.id === modelId);
    if (existing) {
      await supabase.from('models').upsert(removeUndefined(existing));
    }
  } catch (err) {
    console.warn(`[Self-healing] Failed to ensure model ${modelId} exists in Supabase:`, err);
  }
}

export async function testSupabaseConnection(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseAvailable || !supabase) {
    return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
  }
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      const isMissingTable = error.code === 'PGRST116' || 
                             error.message?.includes('relation "public.profiles" does not exist') || 
                             error.message?.includes('does not exist');
      if (isMissingTable) {
        return { success: true, error: 'CONNECTED_NO_TABLES' };
      }
      throw error;
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Supabase connection test failed:', err);
    const msg = err?.message || String(err);
    if (msg.includes('relation "public.profiles" does not exist') || msg.includes('does not exist')) {
      return { success: true, error: 'CONNECTED_NO_TABLES' };
    }
    return { success: false, error: msg };
  }
}

export function isUploadUrl(url: any): boolean {
  if (typeof url !== 'string') return false;
  return url.includes('/_/upload/') || url.includes('/file/6ea31f5f') || url.includes('/file/346c80dd') || url.includes('/file/85890f64');
}

export function fromSupabaseModelRow(row: any): Model {
  if (!row) return row;
  const extra = row.measurements || {};
  return {
    id: extra.originalId || row.id,
    userId: extra.originalUserId || row.userId || row.user_id || row.userid,
    name: row.name || 'Anonymous Model',
    gender: row.gender || 'female',
    age: typeof row.age === 'number' ? row.age : (parseInt(String(row.age), 10) || 24),
    height: extra.heightOriginal || (row.height ? `${row.height} cm` : "5'9\""),
    city: row.city || 'Mumbai',
    state: row.state || 'Maharashtra',
    languages: Array.isArray(row.languages) ? row.languages : (typeof row.languages === 'string' ? row.languages.split(',').map((s: string) => s.trim()) : ['English', 'Hindi']),
    experience: row.experience || '2-5 years',
    category: extra.category || row.category || 'Fashion Models',
    portfolio: Array.isArray(extra.portfolio) ? extra.portfolio : (Array.isArray(row.portfolio) ? row.portfolio : []),
    videoUrl: row.videoUrl || row.video_url,
    availabilityStatus: row.availabilityStatus || row.availability_status || 'Available',
    selfieVerified: extra.selfieVerified !== undefined ? extra.selfieVerified : (row.selfieVerified !== undefined ? row.selfieVerified : true),
    selfieUrl: extra.selfieUrl || row.selfieUrl,
    approved: extra.approved !== undefined ? extra.approved : (row.approved !== undefined ? row.approved : true),
    rejected: extra.rejected !== undefined ? extra.rejected : (row.rejected !== undefined ? row.rejected : false),
    startingPrice: row.starting_price || row.startingPrice || 15000,
    rating: row.rating !== undefined ? Number(row.rating) : 5.0,
    reviewsCount: row.reviews_count !== undefined ? Number(row.reviews_count) : 0,
    biography: row.biography || '',
    phone: row.phone,
    email: row.email,
    govIdUrl: extra.govIdUrl || row.govIdUrl,
    pdfUrl: extra.pdfUrl || row.pdfUrl,
    pdfName: extra.pdfName || row.pdfName,
    socialLinks: extra.socialLinks || row.socialLinks,
    measurements: extra,
    agencyInfo: extra.agencyInfo || row.agencyInfo,
    additionalDetails: extra.additionalDetails || row.additionalDetails
  };
}

export function sanitizeValue(value: any, keyName?: string): any {
  return value;
}




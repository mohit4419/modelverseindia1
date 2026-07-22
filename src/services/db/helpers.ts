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

// Self-healing database helpers to ensure referential integrity before saves
export async function ensureUserExistsInDb(
  userId: string,
  name?: string,
  email?: string,
  seedUsers: User[] = []
): Promise<void> {
  if (!isSupabaseAvailable || !supabase) return;
  try {
    const { data, error } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
    if (!error && data) {
      return;
    }
    const local = localStorage.getItem('mvi_users');
    const localUsers: User[] = local ? JSON.parse(local) : seedUsers;
    const existing = localUsers.find(u => u.id === userId) || seedUsers.find(u => u.id === userId);
    const userToInsert: User = existing || {
      id: userId,
      role: 'client',
      name: name || 'Demo Client',
      email: email || 'client@modelverse.in',
      phone: '+91 98765 43210',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    await supabase.from('profiles').upsert(removeUndefined(userToInsert));
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

export function sanitizeValue(value: any, keyName?: string): any {
  if (isUploadUrl(value)) {
    if (keyName?.toLowerCase().includes('pdf') || value.toLowerCase().endsWith('.pdf')) {
      return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    }
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop';
  }
  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, keyName));
  }
  if (value !== null && typeof value === 'object') {
    const copy = { ...value };
    for (const key of Object.keys(copy)) {
      copy[key] = sanitizeValue(copy[key], key);
    }
    return copy;
  }
  return value;
}




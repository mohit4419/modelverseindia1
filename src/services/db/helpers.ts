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
      const validUserId = await getValidUserIdForModel(existing.userId);
      const portfolioArr = Array.isArray(existing.portfolio) ? existing.portfolio.filter(Boolean) : [];
      const baseRow = removeUndefined({
        id: isUUID(existing.id) ? existing.id : `10000000-1000-4000-8000-${Date.now().toString(16).padStart(12, '0').slice(-12)}`,
        userId: validUserId,
        name: existing.name || 'Model',
        gender: existing.gender || 'female',
        age: Number(existing.age) || 23,
        height: typeof existing.height === 'number' ? existing.height : 173,
        city: existing.city || 'Mumbai',
        state: existing.state || 'Maharashtra',
        category: existing.category || 'Fashion Models',
        portfolio: portfolioArr,
        measurements: {
          ...(typeof existing.measurements === 'object' ? existing.measurements : {}),
          portfolio: portfolioArr,
          portfolioCaptions: Array.isArray(existing.portfolioCaptions) ? existing.portfolioCaptions : [],
          portfolioCategories: Array.isArray(existing.portfolioCategories) ? existing.portfolioCategories : [],
          originalId: existing.id,
          originalUserId: existing.userId
        },
        updated_at: new Date().toISOString()
      });
      let { error: uErr } = await supabase.from('models').upsert(baseRow);
      if (uErr && (uErr.message?.includes('user_id') || uErr.message?.includes('userId') || uErr.message?.includes('schema cache'))) {
        const altBaseRow = { ...baseRow, user_id: baseRow.userId };
        delete altBaseRow.userId;
        await supabase.from('models').upsert(altBaseRow);
      }
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

export function extractPortfolioFromRow(row: any): string[] {
  if (!row) return [];
  const extra = typeof row.measurements === 'object' && row.measurements ? row.measurements : {};
  const addDetails = typeof row.additionalDetails === 'object' && row.additionalDetails ? row.additionalDetails : {};
  
  const primaryCandidates: any[] = [
    row.portfolio,
    extra.portfolio,
    row.portfolio_urls,
    row.portfolioUrls,
    row.portfolio_images,
    row.portfolioImages,
    [addDetails.portfolioLink1, addDetails.portfolioLink2, addDetails.portfolioLink3],
    [extra.portfolioLink1, extra.portfolioLink2, extra.portfolioLink3],
    [row.portfolioLink1, row.portfolioLink2, row.portfolioLink3],
  ];

  const fallbackCandidates: any[] = [
    row.image_url,
    row.imageUrl,
    row.selfieUrl,
    row.selfie_url,
    extra.selfieUrl,
    row.avatarUrl,
    row.avatar_url,
    row.photo,
    row.photos
  ];

  const result: string[] = [];

  const processItem = (item: any) => {
    if (!item) return;

    if (Array.isArray(item)) {
      item.forEach(sub => processItem(sub));
      return;
    }

    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (!trimmed) return;

      // 1. Direct Data URL (e.g. data:image/jpeg;base64,...)
      if (trimmed.startsWith('data:image/')) {
        if (!result.includes(trimmed)) result.push(trimmed);
        return;
      }

      // 2. Direct HTTP/HTTPS or absolute path URL
      if ((trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) && !trimmed.includes('{') && !trimmed.includes('[')) {
        if (!result.includes(trimmed)) result.push(trimmed);
        return;
      }

      // 3. JSON Array string: '["url1", "url2"]'
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            parsed.forEach(sub => processItem(sub));
            return;
          }
        } catch {}
      }

      // 4. Postgres Array format string: '{"url1", "url2"}' or '{url1, url2}'
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const inner = trimmed.slice(1, -1).trim();
        if (!inner) return;

        // Try extracting quoted strings first: "data:image/..." or "https://..."
        const quotedMatches = inner.match(/"((?:[^"\\]|\\.)*)"/g);
        if (quotedMatches && quotedMatches.length > 0) {
          quotedMatches.forEach(q => {
            const unquoted = q.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim();
            processItem(unquoted);
          });
          return;
        }

        // Unquoted Postgres array items: split on comma ONLY before a new URL/data protocol
        const items = inner.split(/,(?=(?:data:image|https?:\/\/|\/))/g);
        if (items.length > 1) {
          items.forEach(sub => processItem(sub.replace(/^"|"$/g, '').trim()));
          return;
        }

        // Fallback for simple comma list inside braces
        const simpleItems = inner.split(',');
        simpleItems.forEach(s => {
          const cleaned = s.replace(/^"|"$/g, '').trim();
          if (cleaned.startsWith('data:image/') || cleaned.startsWith('http') || cleaned.startsWith('/')) {
            processItem(cleaned);
          }
        });
        return;
      }

      // 5. Plain comma-separated list of non-data URLs
      if (trimmed.includes(',') && !trimmed.startsWith('data:image/')) {
        trimmed.split(',').forEach(s => processItem(s));
        return;
      }

      // Single fallback item
      if (trimmed.length > 5 && !result.includes(trimmed)) {
        result.push(trimmed);
      }
    }
  };

  primaryCandidates.forEach(c => processItem(c));

  // Only if no primary portfolio items were found, check fallbacks
  if (result.length === 0) {
    fallbackCandidates.forEach(c => processItem(c));
  }

  return result.filter(url => typeof url === 'string' && url.length > 10);
}

export function fromSupabaseModelRow(row: any): Model {
  if (!row) return row;
  const extra = typeof row.measurements === 'object' && row.measurements ? row.measurements : {};
  const extractedPortfolio = extractPortfolioFromRow(row);

  const realId = row.id || extra.originalId || extra.id;
  const realUserId = row.userId || row.user_id || row.userid || extra.originalUserId || extra.userId || realId;

  const isApproved = row.approved !== undefined && row.approved !== null 
    ? Boolean(row.approved) 
    : (extra.approved !== undefined ? Boolean(extra.approved) : true);

  const isRejected = row.rejected !== undefined && row.rejected !== null 
    ? Boolean(row.rejected) 
    : (extra.rejected !== undefined ? Boolean(extra.rejected) : false);

  const isArchived = row.archived !== undefined && row.archived !== null
    ? Boolean(row.archived)
    : (extra.archived !== undefined ? Boolean(extra.archived) : false);

  return {
    id: String(realId),
    userId: String(realUserId),
    name: row.name || extra.name || 'Anonymous Model',
    gender: row.gender || extra.gender || 'female',
    age: typeof row.age === 'number' ? row.age : (parseInt(String(row.age), 10) || 24),
    height: extra.heightOriginal || (row.height ? (typeof row.height === 'number' ? `${row.height} cm` : String(row.height)) : "5'9\""),
    city: row.city || extra.city || 'Mumbai',
    state: row.state || extra.state || 'Maharashtra',
    languages: Array.isArray(row.languages) ? row.languages : (typeof row.languages === 'string' ? row.languages.split(',').map((s: string) => s.trim()) : ['English', 'Hindi']),
    experience: row.experience || extra.experience || '2-5 years',
    category: row.category || extra.category || 'Fashion Models',
    portfolio: extractedPortfolio,
    videoUrl: row.videoUrl || row.video_url || extra.videoUrl,
    availabilityStatus: row.availabilityStatus || row.availability_status || extra.availabilityStatus || 'Available',
    selfieVerified: row.selfie_verified !== undefined ? Boolean(row.selfie_verified) : (extra.selfieVerified !== undefined ? Boolean(extra.selfieVerified) : true),
    selfieUrl: extra.selfieUrl || row.selfieUrl || row.selfie_url,
    approved: isApproved,
    rejected: isRejected,
    archived: isArchived,
    startingPrice: Number(row.starting_price || row.startingPrice || extra.startingPrice) || 15000,
    rating: row.rating !== undefined ? Number(row.rating) : 5.0,
    reviewsCount: row.reviews_count !== undefined ? Number(row.reviews_count) : 0,
    biography: row.biography || extra.biography || '',
    phone: row.phone || extra.phone || '',
    email: row.email || extra.email || '',
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

export function isDummyModel(model: any): boolean {
  if (!model) return true;
  if (!model.id && !model.name) return true;
  return false;
}




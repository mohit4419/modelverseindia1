import { createClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';
import { ENV } from './env';

const supabaseUrl = ENV.SUPABASE_URL;
// On the server, we prefer the Secret/Service Key for admin/secure tasks, but can fallback to the Publishable/Anon key
const supabaseKey = ENV.SUPABASE_SECRET_KEY || ENV.SUPABASE_ANON_KEY;

export let supabaseAdmin: any = null;
export let isSupabaseConfigured = false;

if (supabaseUrl && supabaseKey) {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    isSupabaseConfigured = true;
    console.log('[Supabase Server] Successfully initialized Supabase admin client from config.');
  } catch (err) {
    console.error('[Supabase Server] Failed to initialize Supabase admin client:', err);
  }
} else {
  console.warn('[Supabase Server] Missing SUPABASE_URL or keys. Server-side Supabase is disabled or in fallback mode.');
}

/**
 * Executes a Promise with a timeout. If the promise does not resolve within the specified timeout,
 * it rejects with a timeout error.
 */
export function withTimeout<T = any>(promise: any, timeoutMs: number = 2500): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Operation timed out (fail-fast safeguard)'));
    }, timeoutMs);
  });
  return Promise.race([
    Promise.resolve(promise).then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise
  ]) as Promise<T>;
}

// Extend Express Request interface to hold user data
export interface AuthenticatedRequest extends Request {
  user?: any;
  supabaseToken?: string;
}

/**
 * Express middleware to verify Supabase Auth token from Authorization header.
 */
export async function requireSupabaseAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Token not provided' });
  }

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return res.status(401).json({ error: 'Unauthorized: Supabase server authentication is not configured' });
  }

  try {
    const { data: { user }, error } = await withTimeout(supabaseAdmin.auth.getUser(token), 3000);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Supabase token', details: error?.message });
    }

    req.user = user;
    req.supabaseToken = token;
    next();
  } catch (err: any) {
    console.error('[Supabase Server] Auth verification error:', err);
    return res.status(500).json({ error: 'Internal Server Error during auth verification', details: err.message });
  }
}

/**
 * Optional middleware that parses the user but doesn't block unauthorized requests.
 */
export async function optionalSupabaseAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token && isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: { user } } = await withTimeout(supabaseAdmin.auth.getUser(token), 2000);
        if (user) {
          req.user = user;
          req.supabaseToken = token;
        }
      } catch (err) {
        console.warn('[Supabase Server] Optional auth verification failed:', err);
      }
    }
  }
  next();
}

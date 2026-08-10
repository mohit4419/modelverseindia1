/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Server-side repository for job_requirements.
 * Supabase (via admin/service-role key) is the central persistent store.
 * A local JSON file acts as a write-ahead log and offline fallback only.
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured, withTimeout } from '../config/supabase';

export interface JobRequirementRow {
  id: string;
  client_id: string;
  company_name: string;
  category: string;
  requirements: string;
  location: string;
  shoot_date: string;
  budget: string;
  contact_email: string;
  status: string;
  created_at: string;
}

const LOCAL_JOBS_FILE = path.join(process.cwd(), 'local_jobs.json');

const SEED_JOBS: JobRequirementRow[] = [
  {
    id: 'job_seed_1',
    client_id: 'c_test',
    company_name: 'Lakme Fashion Week Couture',
    category: 'Fashion Models',
    requirements: 'Seeking 5 experienced runway female models for high-fashion designer showcase in Mumbai. Height requirement: 5\'8"+.',
    location: 'Mumbai, Maharashtra',
    shoot_date: '15th Aug 2026',
    budget: '₹65,000 / Day',
    contact_email: 'casting@lakmefashion.in',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'job_seed_2',
    client_id: 'c_test',
    company_name: 'FabIndia Ethnic Summer Campaign',
    category: 'Commercial Models',
    requirements: 'Looking for male & female models for traditional ethnic wear print shoot and social media video reels.',
    location: 'New Delhi',
    shoot_date: '22nd Aug 2026',
    budget: '₹45,000 / Day',
    contact_email: 'shoot@fabindia.com',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'job_seed_3',
    client_id: 'c_test',
    company_name: 'Nykaa Beauty Product Launch',
    category: 'UGC Creators',
    requirements: 'Required UGC skincare creators for unboxing, voiceover review, and Instagram reel content.',
    location: 'Remote / All India',
    shoot_date: 'Immediate',
    budget: '₹25,000 / Reel',
    contact_email: 'creators@nykaa.com',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

// ─── Local JSON file helpers (offline write-ahead log) ──────────────────────
function getLocalJobs(): JobRequirementRow[] {
  try {
    if (fs.existsSync(LOCAL_JOBS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_JOBS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[JobRequirementRepo] Error reading local jobs file:', e);
  }
  return [];
}

function saveLocalJobs(jobs: JobRequirementRow[]) {
  try {
    fs.writeFileSync(LOCAL_JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf8');
  } catch (e) {
    console.error('[JobRequirementRepo] Error writing local jobs file:', e);
  }
}

// ─── Normalise any incoming row (camelCase or snake_case) to snake_case ─────
function normalizeRow(raw: Record<string, any>): JobRequirementRow {
  return {
    id:            raw.id || `job_${Date.now()}`,
    client_id:     raw.client_id    || raw.clientId     || 'c_unknown',
    company_name:  raw.company_name || raw.companyName  || 'Unknown Brand',
    category:      raw.category     || 'Fashion Models',
    requirements:  raw.requirements || '',
    location:      raw.location     || 'Mumbai',
    shoot_date:    raw.shoot_date   || raw.shootDate    || 'As Agreed',
    budget:        raw.budget       || '₹30,000 / Day',
    contact_email: raw.contact_email|| raw.contactEmail || '',
    status:        raw.status       || 'active',
    created_at:    raw.created_at   || raw.createdAt    || new Date().toISOString()
  };
}

// ─── Auto-create table if missing (service-role key bypasses RLS) ───────────
let tableEnsured = false;

async function ensureTable(): Promise<void> {
  if (tableEnsured || !isSupabaseConfigured || !supabaseAdmin) return;

  try {
    // Quick probe: try to read 1 row. If the table doesn't exist the error
    // code will be 42P01 ("undefined_table").
    const { error } = await withTimeout(
      supabaseAdmin.from('job_requirements').select('id').limit(1),
      3000
    );

    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      // Table doesn't exist – create it via raw SQL through the RPC endpoint
      console.log('[JobRequirementRepo] job_requirements table not found, creating via SQL...');
      const { error: sqlErr } = await withTimeout(
        supabaseAdmin.rpc('exec_sql', {
          query: `
            CREATE TABLE IF NOT EXISTS public.job_requirements (
              id            TEXT PRIMARY KEY,
              client_id     TEXT,
              company_name  TEXT NOT NULL,
              category      TEXT DEFAULT 'Fashion Models',
              requirements  TEXT NOT NULL,
              location      TEXT DEFAULT 'Mumbai',
              shoot_date    TEXT DEFAULT 'As Agreed',
              budget        TEXT NOT NULL,
              contact_email TEXT,
              status        TEXT DEFAULT 'active',
              created_at    TIMESTAMPTZ DEFAULT now()
            );
            ALTER TABLE public.job_requirements ENABLE ROW LEVEL SECURITY;
            CREATE POLICY IF NOT EXISTS "service_role_all" ON public.job_requirements FOR ALL USING (true);
          `
        }),
        5000
      );

      if (sqlErr) {
        console.warn('[JobRequirementRepo] Could not auto-create table via RPC:', sqlErr.message);
        // Fall back gracefully – the local file will still serve data.
      } else {
        console.log('[JobRequirementRepo] job_requirements table created successfully.');
      }
    }

    tableEnsured = true;
  } catch (e: any) {
    // Non-fatal: if the probe itself times out we just carry on with local data.
    console.warn('[JobRequirementRepo] ensureTable probe failed:', e.message || e);
  }
}

// ─── Flush any locally-saved jobs that aren't yet in Supabase ───────────────
async function flushLocalToSupabase(): Promise<void> {
  if (!isSupabaseConfigured || !supabaseAdmin) return;

  const localJobs = getLocalJobs();
  if (localJobs.length === 0) return;

  try {
    const rows = localJobs.map(normalizeRow);
    await withTimeout(
      supabaseAdmin.from('job_requirements').upsert(rows, { onConflict: 'id' }),
      5000
    );
    console.log(`[JobRequirementRepo] Flushed ${rows.length} local job(s) to Supabase.`);
  } catch (e: any) {
    // Non-fatal – they'll be retried on the next flush
    console.warn('[JobRequirementRepo] Flush to Supabase warning:', e.message || e);
  }
}

// ─── Repository class ───────────────────────────────────────────────────────
export class JobRequirementRepository {

  /**
   * Return all active job requirements.
   * Priority: Supabase DB > local file > seed data.
   */
  async findAll(): Promise<JobRequirementRow[]> {
    await ensureTable();

    let dbJobs: JobRequirementRow[] = [];

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin
            .from('job_requirements')
            .select('*')
            .order('created_at', { ascending: false }),
          4000
        );

        if (!error && data && Array.isArray(data)) {
          dbJobs = data.map(normalizeRow);
        } else if (error) {
          console.warn('[JobRequirementRepo] Supabase fetch warning:', error.message);
        }
      } catch (e: any) {
        console.warn('[JobRequirementRepo] Supabase fetch exception:', e.message || e);
      }

      // Opportunistically flush any locally-queued jobs
      if (dbJobs.length > 0) {
        flushLocalToSupabase().catch(() => {});
      }
    }

    // Merge: seeds → local file → database (DB wins on conflicts)
    const localJobs = getLocalJobs().map(normalizeRow);
    const mergedMap = new Map<string, JobRequirementRow>();

    SEED_JOBS.forEach(j  => mergedMap.set(j.id, j));
    localJobs.forEach(j  => mergedMap.set(j.id, j));
    dbJobs.forEach(j     => mergedMap.set(j.id, j));

    return Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Persist a new job requirement to Supabase AND the local write-ahead log.
   * The Supabase write uses the service-role admin key so RLS is bypassed.
   */
  async save(rawJob: Record<string, any>): Promise<JobRequirementRow> {
    await ensureTable();

    const job = normalizeRow(rawJob);

    // 1. Write to local file immediately (guarantees instant visibility even if DB is slow)
    const localJobs = getLocalJobs();
    const idx = localJobs.findIndex(j => j.id === job.id);
    if (idx >= 0) {
      localJobs[idx] = job;
    } else {
      localJobs.unshift(job);
    }
    saveLocalJobs(localJobs);

    // 2. Write to Supabase (central persistent store)
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { error } = await withTimeout(
          supabaseAdmin.from('job_requirements').upsert(job, { onConflict: 'id' }),
          4000
        );

        if (error) {
          console.warn('[JobRequirementRepo] Supabase upsert warning:', error.message);
        } else {
          console.log(`[JobRequirementRepo] Job "${job.company_name}" (${job.id}) saved to Supabase.`);
        }
      } catch (e: any) {
        console.warn('[JobRequirementRepo] Supabase upsert exception:', e.message || e);
        // The local file still has the data – it'll be flushed on the next findAll()
      }
    }

    return job;
  }
}

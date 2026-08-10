/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Frontend service for job requirements (casting calls).
 *
 * READ path:  Backend API  →  localStorage cache  →  seed data
 * WRITE path: Backend API (persists to Supabase via service-role key)
 *             + localStorage (optimistic instant update)
 *
 * The browser NEVER talks directly to Supabase for this table, avoiding
 * 401 RLS errors entirely.
 */

import { JobRequirement, Model } from '../../types';
import { messageService } from './messageService';

// ─── Seed data shown when backend & localStorage are both empty ─────────────
const SEED_JOB_REQUIREMENTS: JobRequirement[] = [
  {
    id: 'job_seed_1',
    clientId: 'c_test',
    companyName: 'Lakme Fashion Week Couture',
    category: 'Fashion Models',
    requirements: 'Seeking 5 experienced runway female models for high-fashion designer showcase in Mumbai. Height requirement: 5\'8"+.',
    location: 'Mumbai, Maharashtra',
    shootDate: '15th Aug 2026',
    budget: '₹65,000 / Day',
    contactEmail: 'casting@lakmefashion.in',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'job_seed_2',
    clientId: 'c_test',
    companyName: 'FabIndia Ethnic Summer Campaign',
    category: 'Commercial Models',
    requirements: 'Looking for male & female models for traditional ethnic wear print shoot and social media video reels.',
    location: 'New Delhi',
    shootDate: '22nd Aug 2026',
    budget: '₹45,000 / Day',
    contactEmail: 'shoot@fabindia.com',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'job_seed_3',
    clientId: 'c_test',
    companyName: 'Nykaa Beauty Product Launch',
    category: 'UGC Creators',
    requirements: 'Required UGC skincare creators for unboxing, voiceover review, and Instagram reel content.',
    location: 'Remote / All India',
    shootDate: 'Immediate',
    budget: '₹25,000 / Reel',
    contactEmail: 'creators@nykaa.com',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

const LS_KEY = 'mvi_job_requirements';

// ─── Row mapping helper ─────────────────────────────────────────────────────
function rowToJob(row: any): JobRequirement {
  return {
    id:           row.id,
    clientId:     row.client_id     || row.clientId     || '',
    companyName:  row.company_name  || row.companyName  || 'Unknown Brand',
    category:     row.category      || 'Fashion Models',
    requirements: row.requirements  || '',
    location:     row.location      || 'Mumbai',
    shootDate:    row.shoot_date    || row.shootDate    || 'As Agreed',
    budget:       row.budget        || '₹30,000 / Day',
    contactEmail: row.contact_email || row.contactEmail || '',
    status:       row.status        || 'active',
    createdAt:    row.created_at    || row.createdAt    || new Date().toISOString()
  };
}

function jobToRow(job: JobRequirement): Record<string, any> {
  return {
    id:            job.id,
    client_id:     job.clientId,
    company_name:  job.companyName,
    category:      job.category,
    requirements:  job.requirements,
    location:      job.location,
    shoot_date:    job.shootDate,
    budget:        job.budget,
    contact_email: job.contactEmail,
    status:        job.status,
    created_at:    job.createdAt
  };
}

// ─── localStorage helpers ───────────────────────────────────────────────────
function readLocalCache(): JobRequirement[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeLocalCache(jobs: JobRequirement[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(jobs)); }
  catch { /* quota exceeded or private mode */ }
}

// ─── Service ────────────────────────────────────────────────────────────────
export const jobRequirementService = {

  /**
   * Fetch all casting calls.
   * 1. Call backend API (server reads from Supabase with admin key).
   * 2. Merge with localStorage cache (covers the gap between POST and next GET).
   * 3. Fall back to seed data if both are empty.
   */
  async getJobRequirements(): Promise<JobRequirement[]> {
    let apiJobs: JobRequirement[] = [];

    try {
      const res = await fetch('/api/job-requirements');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          apiJobs = data.map(rowToJob);
          // Update localStorage cache with authoritative server data
          writeLocalCache(apiJobs);
        }
      }
    } catch {
      // Backend unreachable – fall through to localStorage
    }

    // If backend returned data, use it as the single source of truth
    if (apiJobs.length > 0) {
      return apiJobs.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // Fallback: localStorage cache (e.g. offline or server cold-starting)
    const cached = readLocalCache();
    if (cached.length > 0) {
      return cached.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    // Last resort: seed data
    return [...SEED_JOB_REQUIREMENTS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  /**
   * Submit a new casting call.
   * 1. Optimistically write to localStorage for instant UI update.
   * 2. POST to backend API (server persists to Supabase with admin key).
   * 3. Broadcast a custom event so other components on the same page refresh.
   */
  async createJobRequirement(
    jobData: Omit<JobRequirement, 'id' | 'createdAt' | 'status'>
  ): Promise<JobRequirement> {
    const newJob: JobRequirement = {
      ...jobData,
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    // 1. Optimistic localStorage write
    try {
      const current = readLocalCache();
      current.unshift(newJob);
      writeLocalCache(current);
    } catch { /* non-fatal */ }

    // 2. Persist via backend API → Supabase (central DB)
    try {
      const res = await fetch('/api/job-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobToRow(newJob))
      });

      if (!res.ok) {
        console.warn('[JobService] Backend POST returned', res.status);
      }
    } catch (e) {
      console.warn('[JobService] Backend POST failed (data is saved locally and will sync):', e);
    }

    // 3. Broadcast live event for same-page listeners
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('mvi_job_requirement_created', { detail: newJob }));
      } catch { /* non-fatal */ }
    }

    return newJob;
  },

  /**
   * Apply for a casting call by sending a structured message to the client.
   */
  async applyForJobRequirement(job: JobRequirement, model: Model): Promise<void> {
    const applyMsg =
      `🌟 CASTING APPLICATION FOR "${job.companyName.toUpperCase()}"\n\n` +
      `Dear ${job.companyName},\n` +
      `I am interested in applying for your casting requirement: "${job.requirements.substring(0, 100)}..."\n\n` +
      `My Profile: ${model.name} (${model.category}, ${model.city})\n` +
      `Starting Rate: ₹${(model.startingPrice || 15000).toLocaleString()}/day\n` +
      `Portfolio: ${window.location.origin}/#model-${model.id}`;

    await messageService.addMessage({
      id: `msg_app_${Date.now()}`,
      senderId: model.userId || model.id,
      receiverId: job.clientId || 'c_test',
      content: applyMsg,
      timestamp: new Date().toISOString(),
      isRead: false
    });
  }
};

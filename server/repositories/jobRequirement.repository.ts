/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured, withTimeout } from '../config/supabase';

export interface JobRequirementRow {
  id: string;
  clientId?: string;
  client_id?: string;
  companyName?: string;
  company_name?: string;
  category?: string;
  requirements: string;
  location?: string;
  shootDate?: string;
  shoot_date?: string;
  budget: string;
  contactEmail?: string;
  contact_email?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
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

function getLocalJobs(): JobRequirementRow[] {
  try {
    if (fs.existsSync(LOCAL_JOBS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_JOBS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local jobs file:', e);
  }
  return [];
}

function saveLocalJobs(jobs: JobRequirementRow[]) {
  try {
    fs.writeFileSync(LOCAL_JOBS_FILE, JSON.stringify(jobs, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local jobs file:', e);
  }
}

export class JobRequirementRepository {
  async findAll(): Promise<JobRequirementRow[]> {
    let dbJobs: JobRequirementRow[] = [];

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await withTimeout(
          supabaseAdmin.from('job_requirements').select('*').order('created_at', { ascending: false }),
          3000
        );

        if (!error && data && Array.isArray(data)) {
          dbJobs = data;
        }
      } catch (e) {
        console.warn('Supabase job_requirements fetch warning:', e);
      }
    }

    const localJobs = getLocalJobs();
    const mergedMap = new Map<string, JobRequirementRow>();

    SEED_JOBS.forEach(j => mergedMap.set(j.id, j));
    localJobs.forEach(j => mergedMap.set(j.id, j));
    dbJobs.forEach(j => mergedMap.set(j.id, j));

    return Array.from(mergedMap.values()).sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }

  async save(job: JobRequirementRow): Promise<JobRequirementRow> {
    const localJobs = getLocalJobs();
    const existingIdx = localJobs.findIndex(j => j.id === job.id);
    if (existingIdx >= 0) {
      localJobs[existingIdx] = { ...localJobs[existingIdx], ...job };
    } else {
      localJobs.unshift(job);
    }
    saveLocalJobs(localJobs);

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const row = {
          id: job.id,
          client_id: job.client_id || job.clientId,
          company_name: job.company_name || job.companyName,
          category: job.category || 'Fashion Models',
          requirements: job.requirements,
          location: job.location || 'Mumbai',
          shoot_date: job.shoot_date || job.shootDate || 'As Agreed',
          budget: job.budget,
          contact_email: job.contact_email || job.contactEmail,
          status: job.status || 'active',
          created_at: job.created_at || job.createdAt || new Date().toISOString()
        };

        await withTimeout(
          supabaseAdmin.from('job_requirements').upsert(row),
          3000
        );
      } catch (e: any) {
        console.warn('Supabase save job_requirement warning:', e.message || e);
      }
    }

    return job;
  }
}

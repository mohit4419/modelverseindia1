/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../../supabaseClient';
import { JobRequirement, Model } from '../../types';
import { isSupabaseAvailable } from './helpers';
import { messageService } from './messageService';

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

export const jobRequirementService = {
  async getJobRequirements(): Promise<JobRequirement[]> {
    let apiJobs: JobRequirement[] = [];

    // 1. Fetch from backend API server first (bypasses browser 401 RLS issues via server-side admin key)
    try {
      const res = await fetch('/api/job-requirements');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          apiJobs = data.map((row: any) => ({
            id: row.id,
            clientId: row.client_id || row.clientId,
            companyName: row.company_name || row.companyName,
            category: row.category || 'Fashion Models',
            requirements: row.requirements || '',
            location: row.location || 'Mumbai',
            shootDate: row.shoot_date || row.shootDate || 'As Agreed',
            budget: row.budget || '₹30,000 / Day',
            contactEmail: row.contact_email || row.contactEmail,
            status: row.status || 'active',
            createdAt: row.created_at || row.createdAt || new Date().toISOString()
          }));
        }
      }
    } catch (e) {
      // Backend API not reachable or offline
    }

    // 2. Direct Supabase query (with quiet 401 safeguard)
    let dbJobs: JobRequirement[] = [];
    if (isSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase
          .from('job_requirements')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && Array.isArray(data)) {
          dbJobs = data.map((row: any) => ({
            id: row.id,
            clientId: row.client_id || row.clientId,
            companyName: row.company_name || row.companyName,
            category: row.category || 'Fashion Models',
            requirements: row.requirements || '',
            location: row.location || 'Mumbai',
            shootDate: row.shoot_date || row.shootDate || 'As Agreed',
            budget: row.budget || '₹30,000 / Day',
            contactEmail: row.contact_email || row.contactEmail,
            status: row.status || 'active',
            createdAt: row.created_at || row.createdAt || new Date().toISOString()
          }));
        }
      } catch (e) {
        // Quietly swallow Supabase 401 network/RLS issues
      }
    }

    // 3. LocalStorage fallback
    let localJobs: JobRequirement[] = [];
    try {
      const stored = localStorage.getItem('mvi_job_requirements');
      if (stored) {
        localJobs = JSON.parse(stored);
      }
    } catch (e) {
      // LocalStorage read note
    }

    const mergedMap = new Map<string, JobRequirement>();
    SEED_JOB_REQUIREMENTS.forEach(j => mergedMap.set(j.id, j));
    localJobs.forEach(j => mergedMap.set(j.id, j));
    dbJobs.forEach(j => mergedMap.set(j.id, j));
    apiJobs.forEach(j => mergedMap.set(j.id, j));

    return Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async createJobRequirement(jobData: Omit<JobRequirement, 'id' | 'createdAt' | 'status'>): Promise<JobRequirement> {
    const newJob: JobRequirement = {
      ...jobData,
      id: `job_${Date.now()}`,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    // 1. Save to LocalStorage
    try {
      const existing = await this.getJobRequirements();
      existing.unshift(newJob);
      localStorage.setItem('mvi_job_requirements', JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save job requirement to LocalStorage:', e);
    }

    // 2. Save via Backend API Server (Server uses Supabase Admin)
    try {
      await fetch('/api/job-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newJob.id,
          client_id: newJob.clientId,
          company_name: newJob.companyName,
          category: newJob.category,
          requirements: newJob.requirements,
          location: newJob.location,
          shoot_date: newJob.shootDate,
          budget: newJob.budget,
          contact_email: newJob.contactEmail,
          status: newJob.status,
          created_at: newJob.createdAt
        })
      });
    } catch (e) {
      // Backend save note
    }

    // 3. Save to Supabase direct (with quiet safeguard)
    if (isSupabaseAvailable && supabase) {
      try {
        const row = {
          id: newJob.id,
          client_id: newJob.clientId,
          company_name: newJob.companyName,
          category: newJob.category,
          requirements: newJob.requirements,
          location: newJob.location,
          shoot_date: newJob.shootDate,
          budget: newJob.budget,
          contact_email: newJob.contactEmail,
          status: newJob.status,
          created_at: newJob.createdAt
        };
        await supabase.from('job_requirements').upsert(row);
      } catch (e) {
        // Quietly swallow Supabase 401 network/RLS issues
      }
    }

    return newJob;
  },

  async applyForJobRequirement(job: JobRequirement, model: Model): Promise<void> {
    const applyMsg = `🌟 CASTING APPLICATION FOR "${job.companyName.toUpperCase()}"\n\nDear ${job.companyName},\nI am interested in applying for your casting requirement: "${job.requirements.substring(0, 100)}..."\n\nMy Profile: ${model.name} (${model.category}, ${model.city})\nStarting Rate: ₹${(model.startingPrice || 15000).toLocaleString()}/day\nPortfolio: ${window.location.origin}/#model-${model.id}`;

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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { JobRequirementRepository } from '../repositories/jobRequirement.repository';

const router = Router();
const repository = new JobRequirementRepository();

// GET /api/job-requirements
router.get('/job-requirements', async (_req: Request, res: Response) => {
  try {
    const jobs = await repository.findAll();
    res.json(jobs);
  } catch (error: any) {
    console.error('Failed to fetch job requirements:', error);
    res.status(500).json({ error: 'Failed to fetch job requirements' });
  }
});

// POST /api/job-requirements
router.post('/job-requirements', async (req: Request, res: Response) => {
  try {
    const jobData = req.body;
    if (!jobData || !jobData.requirements) {
      return res.status(400).json({ error: 'Job requirements description is required' });
    }
    const saved = await repository.save(jobData);
    res.status(201).json(saved);
  } catch (error: any) {
    console.error('Failed to create job requirement:', error);
    res.status(500).json({ error: 'Failed to create job requirement' });
  }
});

export default router;

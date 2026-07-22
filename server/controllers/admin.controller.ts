/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { ModelService } from '../services/model.service';
import { BookingService } from '../services/booking.service';
import fs from 'fs';
import path from 'path';

const modelService = new ModelService();
const bookingService = new BookingService();

const LOCAL_VERIFICATION_FILE = path.join(process.cwd(), 'local_verification_requests.json');

function getLocalVerificationRequests(): any[] {
  try {
    if (fs.existsSync(LOCAL_VERIFICATION_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_VERIFICATION_FILE, 'utf8'));
    } else {
      // Seed initial dummy requests for evaluation
      const initial = [
        { id: 'vr_1', modelId: 'm1', modelName: 'Aishwarya Sen', documentType: 'Aadhaar Card', documentUrl: '/uploads/aadhaar.pdf', status: 'pending', createdAt: new Date().toISOString() },
        { id: 'vr_2', modelId: 'm2', modelName: 'Rohan Sharma', documentType: 'Passport', documentUrl: '/uploads/passport.pdf', status: 'pending', createdAt: new Date().toISOString() }
      ];
      fs.writeFileSync(LOCAL_VERIFICATION_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
  } catch (e) {
    return [];
  }
}

function saveLocalVerificationRequests(reqs: any[]) {
  try {
    fs.writeFileSync(LOCAL_VERIFICATION_FILE, JSON.stringify(reqs, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local verifications:', e);
  }
}

export class AdminController {
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const models = await modelService.getAllModels(false);
      const bookings = await bookingService.getAllBookings();

      const totalModels = models.length;
      const approvedModels = models.filter((m) => m.approved).length;
      const pendingModels = totalModels - approvedModels;

      const totalBookings = bookings.length;
      const totalEscrowAmount = bookings.reduce((sum, b) => sum + (b.priceAmount || 0), 0);

      return res.status(200).json({
        success: true,
        stats: {
          totalModels,
          approvedModels,
          pendingModels,
          totalBookings,
          totalEscrowAmount,
        },
      });
    } catch (err: any) {
      console.error('Admin stats failed:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getDashboard(req: Request, res: Response) {
    return AdminController.getDashboardStats(req, res);
  }

  static async getPendingModels(req: Request, res: Response) {
    try {
      const models = await modelService.getAllModels(false);
      const pending = models.filter((m) => !m.approved);
      return res.status(200).json({ success: true, data: pending });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async approveModel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const approved = await modelService.approveModel(id);
      if (!approved) {
        return res.status(404).json({ success: false, error: 'Model not found for approval.' });
      }
      return res.status(200).json({ success: true, message: 'Model listing approved successfully by Administrator.', data: approved });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getVerificationRequests(req: Request, res: Response) {
    try {
      const requests = getLocalVerificationRequests();
      return res.status(200).json({ success: true, data: requests });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async approveVerificationRequest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const requests = getLocalVerificationRequests();
      const idx = requests.findIndex((r) => r.id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Verification request not found.' });
      }

      requests[idx].status = 'approved';
      saveLocalVerificationRequests(requests);

      // Mark model as verified!
      const modelId = requests[idx].modelId;
      await modelService.updateModel(modelId, { verified: true });

      return res.status(200).json({
        success: true,
        message: 'Verification request approved successfully. Model is now verified.',
        data: requests[idx]
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

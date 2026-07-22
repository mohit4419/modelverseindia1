/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const LOCAL_DISPUTES_FILE = path.join(process.cwd(), 'local_disputes.json');
const LOCAL_PAYOUT_REQUESTS_FILE = path.join(process.cwd(), 'local_payout_requests.json');

function getLocalDisputes(): any[] {
  try {
    if (fs.existsSync(LOCAL_DISPUTES_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_DISPUTES_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function saveLocalDisputes(disputes: any[]) {
  try {
    fs.writeFileSync(LOCAL_DISPUTES_FILE, JSON.stringify(disputes, null, 2), 'utf8');
  } catch (e) {}
}

function getLocalPayoutRequests(): any[] {
  try {
    if (fs.existsSync(LOCAL_PAYOUT_REQUESTS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_PAYOUT_REQUESTS_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function saveLocalPayoutRequests(requests: any[]) {
  try {
    fs.writeFileSync(LOCAL_PAYOUT_REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf8');
  } catch (e) {}
}

export class ReportController {
  static async raiseDispute(req: Request, res: Response) {
    try {
      const { bookingId, userId, reason, comments } = req.body;
      if (!bookingId || !userId || !reason) {
        return res.status(400).json({ success: false, error: 'bookingId, userId, and reason are required to raise a dispute.' });
      }

      const disputes = getLocalDisputes();
      const newDispute = {
        id: `dispute_${Math.random().toString(36).substring(2, 11)}`,
        bookingId,
        userId,
        reason,
        comments: comments || '',
        status: 'open',
        createdAt: new Date().toISOString()
      };

      disputes.push(newDispute);
      saveLocalDisputes(disputes);

      return res.status(201).json({
        success: true,
        message: 'Dispute raised successfully. Our support team will investigate right away.',
        data: newDispute
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async requestPayout(req: Request, res: Response) {
    try {
      const { userId, amount, bankDetails } = req.body;
      if (!userId || !amount || !bankDetails) {
        return res.status(400).json({ success: false, error: 'userId, amount, and bankDetails are required.' });
      }

      const requests = getLocalPayoutRequests();
      const newRequest = {
        id: `payout_${Math.random().toString(36).substring(2, 11)}`,
        userId,
        amount: Number(amount),
        bankDetails,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      requests.push(newRequest);
      saveLocalPayoutRequests(requests);

      return res.status(201).json({
        success: true,
        message: 'Payout request received and queued for transfer.',
        data: newRequest
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getPayoutsByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const requests = getLocalPayoutRequests();
      const filtered = requests.filter((r) => r.userId === userId);
      return res.status(200).json({ success: true, data: filtered });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

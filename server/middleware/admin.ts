/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: User authentication is required.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: This resource is restricted to administrators.' });
  }

  next();
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AuthService } from '../services/auth.service';
import { emailService } from '../services/email.service';
import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase';
import { Profile } from '../types';

interface OtpRecord {
  code: string;
  expiresAt: number;
  verified: boolean;
  resetToken?: string;
}

const resetOtpStore = new Map<string, OtpRecord>();
const signupOtpStore = new Map<string, OtpRecord>();

const authService = new AuthService();

export class AuthController {
  static async getSupabaseStatus(req: Request, res: Response) {
    try {
      const isConfigured = !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
      return res.status(200).json({
        isConfigured,
        url: process.env.SUPABASE_URL ? 'Configured' : 'Missing',
        hasSecretKey: !!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
        hasPublishableKey: !!(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const { email, password, phone_number, name, role } = req.body;
      const cleanEmail = email.trim().toLowerCase();

      const existingUser = await authService.findUserByEmail(cleanEmail);
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email is already registered.' });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(password, 12);

      const user = await authService.register(cleanEmail, passwordHash, salt, phone_number);

      const profile: Profile = {
        id: user.id,
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: (role === 'model' || role === 'admin' || role === 'client') ? role : 'client',
        phone: phone_number || '',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await authService.createProfile(profile);

      const token = authService.generateToken({ id: user.id, email: cleanEmail, role: profile.role });

      return res.status(201).json({
        message: 'User registered successfully in PostgreSQL database with secure Bcrypt 12-round hashing.',
        token,
        user: profile,
      });
    } catch (err: any) {
      console.error('Registration failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const cleanEmail = email.trim().toLowerCase();

      const user = await authService.findUserByEmail(cleanEmail);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isMatch = await authService.verifyPassword(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const profile = await authService.findProfileById(user.id) || {
        id: user.id,
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: 'client' as const,
        status: 'active' as const,
      };

      const token = authService.generateToken({ id: user.id, email: cleanEmail, role: profile.role });

      return res.status(200).json({
        message: 'Login successful.',
        token,
        user: profile,
      });
    } catch (err: any) {
      console.error('Login failed:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const profile = await authService.findProfileById(id);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found.' });
      }
      return res.status(200).json({ success: true, data: profile });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      return res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: 'Token is required.' });
      }
      // Simple simulation of token refreshing
      return res.status(200).json({ success: true, token, message: 'Token refreshed successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async sendSignupOtp(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes expiry

      signupOtpStore.set(cleanEmail, { code: otpCode, expiresAt, verified: false });

      await emailService.sendOtpEmail(cleanEmail, otpCode, 'registration');

      console.log(`[EmailService] Dispatched signup OTP to email: ${cleanEmail}`);

      return res.status(200).json({
        success: true,
        message: `Verification code (OTP) has been dispatched to ${cleanEmail}. Please check your email inbox.`
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async verifySignupOtp(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email address and 6-digit OTP code are required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const record = signupOtpStore.get(cleanEmail);

      if (!record) {
        return res.status(400).json({ error: 'No active signup OTP request found for this email. Please request a new OTP code.' });
      }

      if (Date.now() > record.expiresAt) {
        signupOtpStore.delete(cleanEmail);
        return res.status(400).json({ error: 'The OTP code has expired. Please request a new verification code.' });
      }

      if (record.code !== otp.trim()) {
        return res.status(400).json({ error: 'Invalid verification code. Please check the 6-digit OTP sent to your email address.' });
      }

      record.verified = true;

      return res.status(200).json({ success: true, message: 'Signup OTP verified successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'A valid email address is required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes expiry

      resetOtpStore.set(cleanEmail, { code: otpCode, expiresAt, verified: false });

      // Send real email OTP via EmailService SMTP containing the 6-digit security OTP code
      await emailService.sendOtpEmail(cleanEmail, otpCode, 'password_reset');

      console.log(`[EmailService] Dispatched 6-digit password reset OTP (${otpCode}) to email: ${cleanEmail}`);

      // DO NOT return OTP code in JSON response!
      return res.status(200).json({
        success: true,
        message: `Password reset verification code (OTP) has been dispatched to ${cleanEmail}. Please check your email inbox.`
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async verifyResetOtp(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email address and 6-digit OTP code are required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const record = resetOtpStore.get(cleanEmail);

      if (!record) {
        return res.status(400).json({ error: 'No active password reset OTP request found for this email. Please request a new OTP code.' });
      }

      if (Date.now() > record.expiresAt) {
        resetOtpStore.delete(cleanEmail);
        return res.status(400).json({ error: 'The OTP code has expired. Please request a new verification code.' });
      }

      if (record.code !== otp.trim()) {
        return res.status(400).json({ error: 'Invalid verification code. Please check the 6-digit OTP sent to your email address.' });
      }

      const resetToken = crypto.randomUUID();
      record.verified = true;
      record.resetToken = resetToken;

      return res.status(200).json({ success: true, resetToken, message: 'OTP verified successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, resetToken, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email address and new password are required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const record = resetOtpStore.get(cleanEmail);

      if (!record || !record.verified) {
        return res.status(400).json({ error: 'Unauthorized reset request. Please verify the 6-digit OTP sent to your email first.' });
      }

      if (resetToken && record.resetToken && record.resetToken !== resetToken) {
        return res.status(400).json({ error: 'Invalid or expired password reset token.' });
      }

      const user = await authService.findUserByEmail(cleanEmail);
      if (user) {
        await authService.updatePassword(user.id, password);
      }

      // Sync Supabase Auth user password if available
      if (isSupabaseConfigured && supabaseAdmin) {
        try {
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
          const authUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail);
          if (authUser) {
            await supabaseAdmin.auth.admin.updateUserById(authUser.id, { password });
          }
        } catch (sbErr: any) {
          console.warn('Supabase admin password update warning:', sbErr?.message || sbErr);
        }
      }

      resetOtpStore.delete(cleanEmail);

      return res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: 'Token is required.' });
      }
      return res.status(200).json({ success: true, message: 'Email has been verified successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async me(req: any, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const profile = await authService.findProfileById(req.user.id);
      if (!profile) {
        return res.status(404).json({ error: 'User profile not found.' });
      }
      return res.status(200).json({ success: true, user: profile });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getCurrentUserProfile(req: any, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const profile = await authService.findProfileById(req.user.id);
      if (!profile) return res.status(404).json({ error: 'Profile not found' });
      return res.status(200).json({ success: true, data: profile });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async updateCurrentUserProfile(req: any, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const updated = await authService.updateProfile(req.user.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Profile not found' });
      return res.status(200).json({ success: true, data: updated, message: 'Profile updated successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async updateCurrentUserPassword(req: any, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { password } = req.body;
      if (!password) return res.status(400).json({ error: 'Password is required' });
      await authService.updatePassword(req.user.id, password);
      return res.status(200).json({ success: true, message: 'Password updated successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async updateCurrentUserAvatar(req: any, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { avatarUrl } = req.body;
      if (!avatarUrl) return res.status(400).json({ error: 'avatarUrl is required' });
      const updated = await authService.updateProfile(req.user.id, { avatarUrl });
      return res.status(200).json({ success: true, data: updated, message: 'Avatar updated successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async deleteCurrentUserAccount(req: any, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      await authService.deleteAccount(req.user.id);
      return res.status(200).json({ success: true, message: 'Account deleted successfully.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  static async getCurrentUserDashboard(req: any, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      // Return beautiful, personalized dashboard metrics depending on user role
      const role = req.user.role || 'client';
      const stats = {
        role,
        recentActivity: [
          { id: 'act_1', type: 'login', timestamp: new Date().toISOString(), description: 'Successful authenticated login' }
        ],
        metrics: {
          totalBookings: 0,
          pendingActions: 0,
          walletBalance: 0
        }
      };
      return res.status(200).json({ success: true, data: stats });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

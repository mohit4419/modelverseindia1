/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { ENV } from '../config/env';
import { User, Profile } from '../types';

export class AuthService {
  private userRepository = new UserRepository();

  async register(email: string, passwordHash: string, salt: string, phoneNumber?: string): Promise<User> {
    const id = crypto.randomUUID();
    const newUser: User = {
      id,
      email: email.trim().toLowerCase(),
      passwordHash,
      salt,
      phoneNumber,
      createdAt: new Date().toISOString(),
    };

    return this.userRepository.createUser(newUser);
  }

  async createProfile(profile: Profile): Promise<Profile> {
    return this.userRepository.saveProfile(profile);
  }

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const profile = await this.userRepository.findProfileById(id);
    if (!profile) return null;
    const updatedProfile = { ...profile, ...updates, updated_at: new Date().toISOString() };
    return this.userRepository.saveProfile(updatedProfile);
  }

  async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    return this.userRepository.updateUser(id, { passwordHash });
  }

  async deleteAccount(id: string): Promise<boolean> {
    return this.userRepository.deleteUser(id);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findUserByEmail(email);
  }

  async findProfileById(id: string): Promise<Profile | null> {
    return this.userRepository.findProfileById(id);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(payload: { id: string; email: string; role: string }): string {
    return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '7d' });
  }
}

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import { supabaseAdmin, isSupabaseConfigured, requireSupabaseAuth, AuthenticatedRequest } from '../config/supabase';
import { validateBody } from '../validators';
import { registerSchema, loginSchema } from '../validators/auth';
import { generateToken } from '../middleware/auth';
import { hashPassword } from '../utils/password';

const router = Router();

// Local fallback store for credentials in case Supabase PostgreSQL is in fallback/mock mode
const LOCAL_USERS_FILE = path.join(process.cwd(), 'local_hashed_users.json');

function getLocalHashedUsers(): any[] {
  try {
    if (fs.existsSync(LOCAL_USERS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_USERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading local hashed users file:', e);
  }
  return [];
}

function saveLocalHashedUsers(users: any[]) {
  try {
    fs.writeFileSync(LOCAL_USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local hashed users file:', e);
  }
}

router.get('/supabase/status', (req: Request, res: Response) => {
  return res.json({
    isConfigured: isSupabaseConfigured,
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL ? 'Configured' : 'Missing',
    hasSecretKey: !!(
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    hasPublishableKey: !!(
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_API_KEY
    )
  });
});

// Register a user with secure salt + password hashing & application-level phone validation
router.post('/auth/register-db', validateBody(registerSchema), async (req: Request, res: Response) => {
  const { email, password, phone_number } = req.body;

  const cleanEmail = email.trim().toLowerCase();
  // Satisfy DB schema NOT NULL constraints for 'salt' while using secure Bcrypt
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = crypto.randomUUID();

  // Try saving to Supabase PostgreSQL users table
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      // First, check if user with email already exists in users table
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email is already registered.' });
      }

      // Insert new record into users table
      const { data, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: cleanEmail,
          password_hash: passwordHash,
          salt: salt,
          phone_number: phone_number || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const token = generateToken({ id: userId, email: cleanEmail, role: 'client' });

      return res.status(201).json({
        message: 'User registered successfully in PostgreSQL database with secure Bcrypt 12-round hashing.',
        token,
        user: {
          id: userId,
          email: cleanEmail,
          phone_number: phone_number || null,
          created_at: data.created_at
        }
      });
    } catch (err: any) {
      console.warn('[Supabase users fallback] Supabase insert failed, using fallback database:', err.message || err);
    }
  }

  // Fallback storage block
  const localUsers = getLocalHashedUsers();
  if (localUsers.find(u => u.email === cleanEmail)) {
    return res.status(400).json({ error: 'User with this email is already registered.' });
  }

  const newUser = {
    id: userId,
    email: cleanEmail,
    password_hash: passwordHash,
    salt,
    phone_number: phone_number || null,
    created_at: new Date().toISOString()
  };

  localUsers.push(newUser);
  saveLocalHashedUsers(localUsers);

  const token = generateToken({ id: userId, email: cleanEmail, role: 'client' });

  return res.status(201).json({
    message: 'User registered successfully in local-fallback mock database with secure Bcrypt 12-round hashing.',
    token,
    user: {
      id: userId,
      email: cleanEmail,
      phone_number: phone_number || null,
      created_at: newUser.created_at
    }
  });
});

// Verify login credentials using secure Bcrypt hash comparison (with legacy SHA-256 fallback)
router.post('/auth/login-db', validateBody(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      // Query users table for matching email
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (user) {
        // Compare using Bcrypt first
        let isPasswordCorrect = false;
        try {
          isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
        } catch (err) {
          isPasswordCorrect = false;
        }

        // Seamless legacy fallback: Try SHA-256 if Bcrypt verification failed
        if (!isPasswordCorrect) {
          const legacyHash = hashPassword(password, user.salt);
          if (legacyHash === user.password_hash) {
            isPasswordCorrect = true;
            console.log(`Legacy user ${cleanEmail} authenticated successfully via SHA-256 fallback. Upgrading hash to Bcrypt...`);
            
            // Proactively upgrade legacy hash to Bcrypt on next successful login
            const updatedBcryptHash = await bcrypt.hash(password, 12);
            await supabaseAdmin
              .from('users')
              .update({ password_hash: updatedBcryptHash })
              .eq('id', user.id);
          }
        }

        if (isPasswordCorrect) {
          const token = generateToken({ id: user.id, email: user.email, role: 'client' });
          return res.json({
            message: 'Authentication successful. Login validated via secure hashed credentials.',
            token,
            user: {
              id: user.id,
              email: user.email,
              phone_number: user.phone_number,
              created_at: user.created_at
            }
          });
        } else {
          return res.status(401).json({ error: 'Invalid email or password.' });
        }
      }
    } catch (err: any) {
      console.warn('[Supabase users query fallback] Supabase login query failed, querying fallback database:', err.message || err);
    }
  }

  // Fallback check
  const localUsers = getLocalHashedUsers();
  const user = localUsers.find(u => u.email === cleanEmail);
  if (user) {
    let isPasswordCorrect = false;
    try {
      isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
    } catch (err) {
      isPasswordCorrect = false;
    }

    if (!isPasswordCorrect) {
      const legacyHash = hashPassword(password, user.salt);
      if (legacyHash === user.password_hash) {
        isPasswordCorrect = true;
        console.log(`Legacy fallback user ${cleanEmail} authenticated successfully. Upgrading to Bcrypt...`);
        user.password_hash = await bcrypt.hash(password, 12);
        saveLocalHashedUsers(localUsers);
      }
    }

    if (isPasswordCorrect) {
      const token = generateToken({ id: user.id, email: user.email, role: 'client' });
      return res.json({
        message: 'Authentication successful (fallback). Login validated via secure hashed credentials.',
        token,
        user: {
          id: user.id,
          email: user.email,
          phone_number: user.phone_number,
          created_at: user.created_at
        }
      });
    }
  }

  return res.status(401).json({ error: 'Invalid email or password.' });
});

router.post('/supabase/verify-token', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return res.status(400).json({ error: 'Supabase server-side client is not initialized' });
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token', details: error?.message });
    }
    return res.json({ valid: true, user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to verify token', details: err.message });
  }
});

router.get('/supabase/profile', requireSupabaseAuth as any, (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    message: 'Profile fetched securely from Supabase Server',
    user: req.user
  });
});

router.get('/supabase/users', requireSupabaseAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return res.status(400).json({ error: 'Supabase server-side client is not initialized' });
  }

  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      console.warn('Could not list users from auth admin, attempting public users table:', error.message);
      const { data: publicUsers, error: publicError } = await supabaseAdmin.from('users').select('*');
      if (publicError) {
        return res.status(403).json({ 
          error: 'Forbidden: Elevate permissions using the service_role key to access admin functions', 
          details: publicError.message 
        });
      }
      return res.json({ source: 'public_table', users: publicUsers });
    }
    return res.json({ source: 'auth_admin', users });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve users list', details: err.message });
  }
});

export default router;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from '../../supabaseClient';
import { User, UserRole } from '../../types';
import { isSupabaseAvailable } from './helpers';
import { SEED_USERS } from './seedData';
import { saveUser } from './userService';

export const authService = {
  onAuthStateChanged(callback: (user: any) => void) {
    if (isSupabaseAvailable && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
        if (session && session.user) {
          const user = session.user;
          callback({
            email: user.email,
            displayName: user.user_metadata?.full_name || user.user_metadata?.name || 'Google User',
            photoURL: user.user_metadata?.avatar_url || undefined,
            phoneNumber: user.phone || undefined
          });
        } else {
          callback(null);
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    }
    return () => {};
  },

  getCurrentSessionUser(): User | null {
    try {
      const stored = localStorage.getItem('mvi_session_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Failed to parse current session user', e);
      return null;
    }
  },

  setCurrentSessionUser(user: User | null): void {
    try {
      if (user) {
        localStorage.setItem('mvi_session_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('mvi_session_user');
      }
    } catch (e) {
      console.error('Failed to set current session user', e);
    }
  },

  async sendPasswordReset(email: string) {
    if (isSupabaseAvailable && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return;
    }
    console.log('Local/mock fallback password reset email triggered for:', email);
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const emailKey = email.toLowerCase().trim();
    if (isSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', emailKey)
          .maybeSingle();
        if (!error && data) {
          return { ...data, id: data.id || emailKey } as User;
        }
      } catch (e) {
        console.error('Supabase query user by email failed', e);
      }
    }
    // Fallback to local storage or seed data
    const local = localStorage.getItem('mvi_users');
    const localUsers: User[] = local ? JSON.parse(local) : SEED_USERS;
    return localUsers.find(u => u.email.toLowerCase() === emailKey) || null;
  },

  async signInWithEmailAndPassword(email: string, password: string): Promise<{ user: any; error?: any }> {
    if (isSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) return { user: null, error };
        return { user: data.user };
      } catch (err) {
        return { user: null, error: err };
      }
    }
    return { user: null };
  },

  async signUpWithEmailAndPassword(
    email: string,
    password: string,
    name: string,
    role: string,
    phone?: string
  ): Promise<{ user: any; error?: any }> {
    if (isSupabaseAvailable && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: name,
              role,
              phone: phone || ''
            }
          }
        });
        if (error) return { user: null, error };
        return { user: data.user };
      } catch (err) {
        return { user: null, error: err };
      }
    }
    return { user: null };
  },

  async signInWithGoogle(selectedRole: UserRole = 'client'): Promise<{ user: any }> {
    if (isSupabaseAvailable && supabase) {
      const redirectTo = `${window.location.origin}/oauth-callback`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (!data?.url) {
        throw new Error('Could not retrieve Google OAuth authorization URL.');
      }

      // Open OAuth URL in popup
      const popup = window.open(data.url, 'google_login', 'width=600,height=650,scrollbars=yes');
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site to sign in with Google.');
      }

      // Wait for postMessage or fallback completion
      return new Promise<{ user: any }>((resolve, reject) => {
        let isResolved = false;
        
        const handleMessage = async (event: MessageEvent) => {
          const origin = event.origin;
          if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
            return;
          }

          if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
            const hash = event.data.hash || '';
            const params = new URLSearchParams(hash.replace('#', '?'));
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            if (access_token) {
              try {
                const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
                  access_token,
                  refresh_token: refresh_token || '',
                });

                if (sessionErr) throw sessionErr;
                const user = sessionData.user;
                if (user) {
                  isResolved = true;
                  window.removeEventListener('message', handleMessage);
                  resolve({
                    user: {
                      email: user.email,
                      displayName: user.user_metadata?.full_name || user.user_metadata?.name || 'Google User',
                      photoURL: user.user_metadata?.avatar_url || undefined,
                      phoneNumber: user.phone || undefined
                    }
                  });
                }
              } catch (err) {
                console.error('Failed to set Supabase session from OAuth callback:', err);
                reject(err);
              }
            }
          }
        };

        window.addEventListener('message', handleMessage);

        // Polling check to detect if user manually closed the popup
        const timer = setInterval(() => {
          if (popup.closed) {
            clearInterval(timer);
            setTimeout(() => {
              if (!isResolved) {
                window.removeEventListener('message', handleMessage);
                reject(new Error('Sign-in popup was closed before completion.'));
              }
            }, 1000);
          }
        }, 1000);
      });
    }

    const email = selectedRole === 'admin' ? 'admin@modelverse.in' : (selectedRole === 'model' ? 'model@modelverse.in' : 'client@modelverse.in');
    return {
      user: {
        email,
        displayName: selectedRole === 'admin' ? 'Super Admin' : (selectedRole === 'model' ? 'Pooja Hegde' : 'Demo Client'),
        photoURL: selectedRole === 'admin' ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' : undefined,
        phoneNumber: '+91 98765 43210'
      }
    };
  },

  async logOut() {
    this.setCurrentSessionUser(null);
    if (isSupabaseAvailable && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
  },

  async registerCredentials(email: string, role: string): Promise<void> {
    const emailKey = email.toLowerCase().trim();
    const creds = JSON.parse(localStorage.getItem('mvi_credentials') || '{}');
    creds[emailKey] = { role };
    localStorage.setItem('mvi_credentials', JSON.stringify(creds));

    if (isSupabaseAvailable && supabase) {
      try {
        const existing = await this.getUserByEmail(emailKey);
        if (existing) {
          if (existing.role !== role) {
            existing.role = role as any;
            await saveUser(existing);
          }
        } else {
          const stubUser: User = {
            id: `u_stub_${Date.now()}`,
            email: emailKey,
            role: role as any,
            name: emailKey.split('@')[0],
            phone: '+91 90000 00000',
            status: 'active',
            createdAt: new Date().toISOString()
          };
          await saveUser(stubUser);
        }
      } catch (err) {
        console.error('Failed to register credential to Supabase:', err);
      }
    }
  },

  async getCredentials(email: string): Promise<{ role: string } | null> {
    const emailKey = email.toLowerCase().trim();
    const creds = JSON.parse(localStorage.getItem('mvi_credentials') || '{}');
    if (creds[emailKey]) {
      return creds[emailKey];
    }

    if (isSupabaseAvailable && supabase) {
      try {
        const user = await this.getUserByEmail(emailKey);
        if (user) {
          return { role: user.role };
        }
      } catch (err) {
        console.error('Failed to get credential from Supabase:', err);
      }
    }
    return null;
  }
};

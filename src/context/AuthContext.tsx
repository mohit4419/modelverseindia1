/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '../types';
import { dbService } from '../services/db';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

interface AuthContextType {
  isAuthenticated: boolean;
  isGuestMode: boolean;
  userEmail: string;
  clientId: string;
  currentUserName: string;
  currentRole: UserRole;
  isEmailUnverified: boolean;
  authRoleHint: UserRole;
  authTabHint: 'login' | 'signup' | 'forgot';
  authEmailHint: string;
  setIsEmailUnverified: (val: boolean) => void;
  setAuthRoleHint: (val: UserRole) => void;
  setAuthTabHint: (val: 'login' | 'signup' | 'forgot') => void;
  setAuthEmailHint: (val: string) => void;
  handleSetGuestMode: (val: boolean) => void;
  setAuthenticated: (val: boolean) => Promise<void>;
  handleAuthSuccess: (user: any, role: UserRole) => void;
  handleChangePasswordClick: () => Promise<void>;
  handleResendVerificationEmail: (triggerToast: (title: string, message: string, type?: 'success' | 'warning' | 'info' | 'error') => void) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuthenticatedState] = useState<boolean>(false);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem('mvi_guest_mode') === 'true';
  });
  const [userEmail, setUserEmail] = useState<string>('mk5663670@gmail.com');
  const [clientId, setClientId] = useState<string>('c_test');
  const [currentUserName, setCurrentUserName] = useState<string>('Demo Client');
  const [authRoleHint, setAuthRoleHint] = useState<UserRole>('client');
  const [authTabHint, setAuthTabHint] = useState<'login' | 'signup' | 'forgot'>('login');
  const [authEmailHint, setAuthEmailHint] = useState<string>('');
  const [isEmailUnverified, setIsEmailUnverified] = useState<boolean>(false);

  const handleSetGuestMode = (val: boolean) => {
    setIsGuestMode(val);
    if (val) {
      localStorage.setItem('mvi_guest_mode', 'true');
    } else {
      localStorage.removeItem('mvi_guest_mode');
    }
  };

  useEffect(() => {
    // Initial check for cached user session
    const cachedUser = dbService.getCurrentSessionUser();
    if (cachedUser) {
      setAuthenticatedState(true);
      setUserEmail(cachedUser.email);
      setCurrentUserName(cachedUser.name);
      setClientId(cachedUser.id);
      setCurrentRole(cachedUser.role);
      handleSetGuestMode(false);
    }

    // Check Supabase session specifically for unverified email address
    const checkSupabaseSession = async () => {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          setIsEmailUnverified(!session.user.email_confirmed_at);
        } else {
          setIsEmailUnverified(false);
        }
      } catch (err) {
        console.warn('Error checking supabase session:', err);
      }
    };
    checkSupabaseSession();

    let subscription: any = null;
    if (isSupabaseConfigured && supabase) {
      const res = supabase.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
          setIsEmailUnverified(!session.user.email_confirmed_at);
        } else {
          setIsEmailUnverified(false);
        }
      });
      subscription = res?.data?.subscription;
    }

    let unsubscribeFirebase: (() => void) | undefined;
    if (dbService.auth) {
      unsubscribeFirebase = dbService.auth.onAuthStateChanged(async (user: any) => {
        if (user) {
          const email = user.email || 'mk5663670@gmail.com';
          const allUsers = await dbService.getUsers();
          let existingUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
          
          if (!existingUser) {
            const credInfo = await dbService.getCredentials(email);
            const resolvedRole = credInfo ? (credInfo.role as UserRole) : 'client';
            
            existingUser = {
              id: email,
              role: resolvedRole,
              name: user.displayName || 'Google User',
              email: email,
              phone: user.phoneNumber || '+91 90000 00000',
              status: 'active',
              avatarUrl: user.photoURL || undefined,
              createdAt: new Date().toISOString()
            };
            await dbService.saveUser(existingUser);
          }
          
          dbService.setCurrentSessionUser(existingUser);
          setAuthenticatedState(true);
          setUserEmail(existingUser.email);
          setCurrentUserName(existingUser.name);
          setClientId(existingUser.id);
          setCurrentRole(existingUser.role);
        } else {
          const sessionUser = dbService.getCurrentSessionUser();
          if (sessionUser) {
            setAuthenticatedState(true);
            setUserEmail(sessionUser.email);
            setCurrentUserName(sessionUser.name);
            setClientId(sessionUser.id);
            setCurrentRole(sessionUser.role);
          } else {
            setAuthenticatedState(false);
            setUserEmail('guest@modelverse.in');
            setCurrentUserName('Guest');
            setClientId('c_test');
          }
        }
      });
    }

    return () => {
      if (unsubscribeFirebase) unsubscribeFirebase();
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const [currentRole, setCurrentRole] = useState<UserRole>('client');

  const setAuthenticated = async (val: boolean) => {
    if (val) {
      setAuthTabHint('signup');
    } else {
      try {
        await dbService.logOut();
      } catch (err) {
        console.error('Logout error', err);
      }
      setAuthenticatedState(false);
      handleSetGuestMode(false);
      setUserEmail('guest@modelverse.in');
      setCurrentUserName('Guest');
      setClientId('c_test');
      setCurrentRole('client');
    }
  };

  const handleAuthSuccess = (user: any, role: UserRole) => {
    setAuthenticatedState(true);
    handleSetGuestMode(false);
    setUserEmail(user.email);
    setCurrentUserName(user.name);
    setClientId(user.id);
    setCurrentRole(role);
  };

  const handleChangePasswordClick = async () => {
    setAuthTabHint('forgot');
    setAuthEmailHint(userEmail);
    await setAuthenticated(false);
  };

  const handleResendVerificationEmail = async (triggerToast: any) => {
    if (!userEmail) return;
    if (!isSupabaseConfigured || !supabase) {
      triggerToast('Local Mode', 'Email verification is skipped in offline fallback mode.', 'info');
      return;
    }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) {
        triggerToast('Failed to Send', error.message, 'error');
      } else {
        triggerToast('Verification Sent', 'A verification link has been sent to your email address.', 'success');
      }
    } catch (err: any) {
      triggerToast('Error', err.message || 'Failed to resend verification email', 'error');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isGuestMode,
        userEmail,
        clientId,
        currentUserName,
        currentRole,
        isEmailUnverified,
        authRoleHint,
        authTabHint,
        authEmailHint,
        setIsEmailUnverified,
        setAuthRoleHint,
        setAuthTabHint,
        setAuthEmailHint,
        handleSetGuestMode,
        setAuthenticated,
        handleAuthSuccess,
        handleChangePasswordClick,
        handleResendVerificationEmail
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

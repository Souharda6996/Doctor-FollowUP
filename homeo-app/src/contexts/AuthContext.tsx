'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  signIn, 
  firebaseSignOut, 
  onAuthChange,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from '@/lib/firebase';
import type { UserProfile, UserRole, Language } from '@/lib/types';
import type { User } from 'firebase/auth';

export type { UserRole };

const TOKEN_KEY = 'medifollowup_token';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  login: (phone?: string, role?: UserRole, lang?: Language) => Promise<void>;
  sendOtp: (phoneNumber: string, containerId: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  /** @deprecated use signOut */
  logout: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  login: async () => {},
  sendOtp: async () => {},
  verifyOtp: async () => false,
  signOut: async () => {},
  logout: async () => {},
  token: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  /**
   * Syncs Firebase user with our backend to get the enriched UserProfile (with role).
   */
  const syncUserProfile = async (firebaseToken: string, role?: UserRole) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${baseUrl}/api/auth/sync-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(role ? { role } : undefined),
      });
      
      if (res.ok) {
        const responseData = await res.json();
        setUserProfile(responseData.data || responseData);
      }
    } catch (err) {
      console.error('[Auth] Failed to sync user profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        const idToken = await user.getIdToken();
        setToken(idToken);
        localStorage.setItem(TOKEN_KEY, idToken);
        await syncUserProfile(idToken);
      } else {
        setUserProfile(null);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
      }
      
      setLoading(false);
    });

    // Refresh token every 50 minutes (Firebase tokens expire in 1 hour)
    const refreshInterval = setInterval(async () => {
      if (auth.currentUser) {
        const refreshedToken = await auth.currentUser.getIdToken(true);
        setToken(refreshedToken);
        localStorage.setItem(TOKEN_KEY, refreshedToken);
      }
    }, 50 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const handleSignIn = async (phone?: string, role?: UserRole, lang?: Language) => {
    try {
      if (!phone) {
        await signIn(); // Google Sign-In fallback
      }
      // For phone OTP flow: sync happens after verifyOtp succeeds
      // We pass the role through handleLogin in the login page
    } catch (error) {
      console.error('[Auth] Sign in failed:', error);
      throw error;
    }
  };

  const sendOtp = async (phoneNumber: string, containerId: string) => {
    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
      });
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
    } catch (error) {
      console.error('[Auth] Failed to send OTP:', error);
      throw error;
    }
  };

  const verifyOtp = async (code: string) => {
    if (!confirmationResult) {
      console.error('[Auth] No confirmation result — OTP was not sent');
      return false;
    }
    try {
      await confirmationResult.confirm(code);
      return true;
    } catch (error) {
      console.error('[Auth] OTP verification failed:', error);
      return false;
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut();
    } catch (error) {
      console.error('[Auth] Sign out failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user: userProfile, 
      firebaseUser,
      loading, 
      login: handleSignIn, 
      sendOtp,
      verifyOtp,
      signOut: handleSignOut,
      logout: handleSignOut, // alias for backward compat
      token 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }

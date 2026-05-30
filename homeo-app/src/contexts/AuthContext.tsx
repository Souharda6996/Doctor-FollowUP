'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  signIn, 
  firebaseSignOut, 
  onAuthChange,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithCustomToken,
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

// Create a cookie-setting helper so middleware can read the role
function setRoleCookie(role: string) {
  document.cookie = `medifollowup_role=${role}; path=/; max-age=31536000; SameSite=Lax`;
}

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
    setLoading(true);
    // Demo token fallback
    if (firebaseToken.startsWith('demo-token-')) {
      console.log('[Auth] Mocking user profile for demo token');
      const mockRole = role || (firebaseToken.includes('doctor') ? 'doctor' : firebaseToken.includes('caregiver') ? 'caregiver' : 'patient');
      const mockProfile: UserProfile = {
        id: `mock-${firebaseToken}`,
        firebase_uid: `uid-${firebaseToken}`,
        phone: '+919876543210',
        role: mockRole as UserRole,
        display_name: `Demo ${mockRole.charAt(0).toUpperCase() + mockRole.slice(1)}`,
        language_preference: 'en',
        created_at: new Date().toISOString()
      };
      setUserProfile(mockProfile);
      setLoading(false);
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL === 'http://localhost:8000' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
      const res = await fetch(`${baseUrl}/api/auth/sync-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json',
        },
        body: role ? JSON.stringify({ role }) : null,
      });
      
      if (res.ok) {
        const responseData = await res.json();
        setUserProfile(responseData.data || responseData);
      } else {
        throw new Error('Backend sync failed');
      }
    } catch (err) {
      console.error('[Auth] Failed to sync user profile, using local fallback:', err);
      // Optional: Fallback to a basic profile if backend is totally down
      if (role) {
         setUserProfile({
           id: 'local-fallback',
           firebase_uid: 'local-uid',
           role: role,
           display_name: 'Local User',
           language_preference: 'en',
           created_at: new Date().toISOString()
         } as UserProfile);
      }
    } finally {
      setLoading(false);
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

  const handleSignIn = async (phone?: string, role?: UserRole, _lang?: Language) => {
    setLoading(true);
    try {
      if (!phone) {
        await signIn(); // Google Sign-In fallback
      } else if (token) {
        // For phone OTP flow: ensure the role is synced after selection
        if (role) setRoleCookie(role);
        await syncUserProfile(token, role);
      }
    } catch (error) {
      console.error('[Auth] Sign in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const DEMO_NUMBERS: Record<string, string> = {
    '+919876543210': 'demo-token-patient',
    '+918765432109': 'demo-token-doctor',
    '+919123456789': 'demo-token-caregiver',
  };

  const [demoPhone, setDemoPhone] = useState<string | null>(null);

  const sendOtp = async (phoneNumber: string, containerId: string) => {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    try {
      // 1. Always call our backend to generate/send the OTP via API route
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setDemoPhone(phoneNumber); // Track the phone number for verification

      // Optional: If production mode uses Twilio, we don't need Firebase reCAPTCHA here.
      // But if we fallback to Firebase Auth in production, we would initialize it.
      // For this architecture, we use our own API which wraps Twilio/Supabase.
      
    } catch (error) {
      console.error('[Auth] Failed to send OTP:', error);
      throw error;
    }
  };

  const verifyOtp = async (code: string) => {
    if (!demoPhone) {
      console.error('[Auth] No phone number to verify');
      return false;
    }

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: demoPhone, otp: code })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      // We receive a Firebase Custom Token from the backend
      if (data.customToken) {
        // Sign in to Firebase with this custom token
        const userCredential = await signInWithCustomToken(auth, data.customToken);
        const idToken = await userCredential.user.getIdToken();
        
        setToken(idToken);
        localStorage.setItem(TOKEN_KEY, idToken);
        return true;
      }
      
      return false;
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

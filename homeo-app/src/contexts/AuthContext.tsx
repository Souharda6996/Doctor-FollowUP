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

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  login: (phone?: string, role?: UserRole, lang?: Language) => Promise<void>;
  sendOtp: (phoneNumber: string, containerId: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<boolean>;
  signOut: () => Promise<void>;
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
  token: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Sync user profile with our backend
  const syncUserProfile = async (firebaseToken: string) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${baseUrl}/api/auth/sync-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const responseData = await res.json();
        setUserProfile(responseData.data || responseData);
      }
    } catch (err) {
      console.error("Failed to sync user profile", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        const idToken = await user.getIdToken();
        setToken(idToken);
        localStorage.setItem("homeo_token", idToken);
        
        // Call backend to sync or create user
        await syncUserProfile(idToken);
      } else {
        setUserProfile(null);
        setToken(null);
        localStorage.removeItem("homeo_token");
      }
      
      setLoading(false);
    });

    // Token refresh interval (every 50 minutes)
    const refreshInterval = setInterval(async () => {
      if (auth.currentUser) {
        const refreshedToken = await auth.currentUser.getIdToken(true);
        setToken(refreshedToken);
        localStorage.setItem("homeo_token", refreshedToken);
        console.log("Auth token refreshed");
      }
    }, 50 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const handleSignIn = async (phone?: string, role?: UserRole, lang?: Language) => {
    try {
      if (phone) {
        // If we have a phone, we're likely using the OTP flow
        // The redirection happens in LoginPage AFTER verifyOtp succeeds
        console.log("Login requested for phone:", phone);
      } else {
        await signIn(); // Fallback to Google
      }
    } catch (error) {
      console.error("Sign in failed", error);
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
      console.error("Failed to send OTP", error);
      throw error;
    }
  };

  const verifyOtp = async (code: string) => {
    if (!confirmationResult) {
      console.error("No confirmation result found");
      return false;
    }
    try {
      await confirmationResult.confirm(code);
      return true;
    } catch (error) {
      console.error("OTP verification failed", error);
      return false;
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut();
    } catch (error) {
      console.error("Sign out failed", error);
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
      token 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }

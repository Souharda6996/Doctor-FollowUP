'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import PatientBottomNav from '@/components/patient/PatientBottomNav';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== 'patient') {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || user?.role !== 'patient') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-sm overflow-hidden flex flex-col relative">
        {children}
      </main>
      <PatientBottomNav />
    </div>
  );
}

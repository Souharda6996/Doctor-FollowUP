'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DoctorSidebar from '@/components/doctor/DoctorSidebar';
import DoctorMobileNav from '@/components/doctor/DoctorMobileNav';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== 'doctor') {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || user?.role !== 'doctor') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex space-x-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Desktop Sidebar */}
      <DoctorSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">{children}</main>
      </div>

      {/* Mobile Bottom Nav */}
      <DoctorMobileNav />
    </div>
  );
}

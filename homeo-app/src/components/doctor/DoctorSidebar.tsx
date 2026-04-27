'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Calendar, MessageSquare, Settings,
  LogOut, Bell, Leaf, TrendingUp
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/doctor/dashboard' },
  { icon: Users, label: 'Patients', href: '/doctor/patients' },
  { icon: Calendar, label: 'Follow-ups', href: '/doctor/followups' },
  { icon: TrendingUp, label: 'Analytics', href: '/doctor/analytics' },
  { icon: MessageSquare, label: 'AI Assistant', href: '/doctor/ai-assistant' },
  { icon: Settings, label: 'Settings', href: '/doctor/settings' },
];

export default function DoctorSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-600/30">
            <Leaf className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">HomeoDoc</h1>
            <p className="text-xs text-slate-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Doctor Info */}
      <div className="px-4 py-4 mx-3 mt-3 mb-1 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.charAt(0) ?? 'D'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-blue-600">Homeopathic Physician</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <motion.div key={item.href} whileHover={{ x: 2 }} transition={{ duration: 0.15 }}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                {item.label}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Alerts & Logout */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <Link
          href="/doctor/alerts"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all"
        >
          <Bell className="w-4 h-4" />
          Alerts
          <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">3</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </aside>
  );
}

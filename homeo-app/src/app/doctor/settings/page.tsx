'use client';

import { motion } from 'framer-motion';
import { 
  Settings, User, Bell, Shield, 
  Brain, Languages, LogOut,
  ChevronRight, Sparkles, Smartphone
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user, logout } = useAuth();

  const sections = [
    {
      title: 'Practice Profile',
      items: [
        { icon: User, label: 'Profile Information', sub: 'Name, credentials, and clinic details', color: 'bg-blue-50 text-blue-600' },
        { icon: Smartphone, label: 'Mobile App Settings', sub: 'Configure patient portal features', color: 'bg-green-50 text-green-600' },
      ]
    },
    {
      title: 'AI Configuration',
      items: [
        { icon: Brain, label: 'AI Behavior', sub: 'Set strictness and sensitivity for remedies', color: 'bg-purple-50 text-purple-600' },
        { icon: Sparkles, label: 'Auto-Summarization', sub: 'Enable/disable case history AI summary', color: 'bg-amber-50 text-amber-600' },
      ]
    },
    {
      title: 'System & Security',
      items: [
        { icon: Bell, label: 'Alert Thresholds', sub: 'Configure when to trigger "No improvement"', color: 'bg-red-50 text-red-600' },
        { icon: Shield, label: 'Data & Privacy', sub: 'Manage backup and patient data access', color: 'bg-slate-100 text-slate-600' },
        { icon: Languages, label: 'Multilingual Support', sub: 'Manage Hindi and Bengali translations', color: 'bg-indigo-50 text-indigo-600' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-5 py-4">
        <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-600" />
          Settings
        </h1>
      </header>

      <div className="p-5 space-y-8 pb-24">
        {/* Doctor Header card */}
        <div className="card p-5 bg-gradient-to-br from-blue-600 to-blue-700 border-none">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0) || 'D'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{user?.name}</h2>
              <p className="text-blue-100 text-xs">Aesthetics & Constitutional Specialist</p>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 border border-white/20 text-[10px] text-white font-medium">
                Sole Admin Mode
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable sections */}
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <motion.div 
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-3"
            >
              <h3 className="px-1 text-xs font-bold text-slate-400 uppercase tracking-widest">{section.title}</h3>
              <div className="card divide-y divide-slate-100">
                {section.items.map((item) => (
                  <button key={item.label} className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left group">
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0 transition-transform group-active:scale-95`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.sub}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sign out */}
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          className="w-full card p-4 flex items-center justify-center gap-2 text-red-600 font-semibold hover:bg-red-50 hover:border-red-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log Out from Administration
        </motion.button>
      </div>
    </div>
  );
}

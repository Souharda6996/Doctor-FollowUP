'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, XCircle, Clock, Bell, CheckCheck } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';

const ICONS = {
  'no-improvement': AlertTriangle,
  worsening: XCircle,
  'missed-followup': Clock,
  'due-followup': Bell,
  silence: AlertTriangle,
  'red-report': AlertTriangle,
};

export default function AlertsPage() {
  const { token } = useAuth();
  
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const res = await fetch('/api/doctor/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        setAlerts(json.alerts || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const unread = alerts.filter((a) => !a.read_at);
  const read = alerts.filter((a) => a.read_at);

  if (loading) return <div className="p-5 space-y-4"><SkeletonCard lines={2} /><SkeletonCard lines={2} /></div>;
  if (error) return <div className="p-5"><ErrorState message={error} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Alerts & Notifications
            </h1>
            <p className="text-xs text-red-600 font-medium mt-0.5">{unread.length} unread alerts</p>
          </div>
          <button className="flex items-center gap-1.5 text-blue-600 text-sm font-semibold">
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        </div>
      </header>

      <div className="p-5 space-y-5">
        {unread.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Unread</h2>
            <div className="space-y-2">
              {unread.map((alert, i) => {
                const Icon = ICONS[alert.type];
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link href={`/doctor/patients/${alert.patient_id}`}>
                      <div className={`card p-4 cursor-pointer hover:shadow-md transition-all border-l-4 ${
                        alert.severity === 'high' ? 'border-l-red-500' :
                        alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            alert.severity === 'high' ? 'bg-red-100' :
                            alert.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                          }`}>
                            <Icon className={`w-4 h-4 ${
                              alert.severity === 'high' ? 'text-red-600' :
                              alert.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">{alert.patient?.users?.display_name || 'Patient'}</p>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                alert.severity === 'high' ? 'bg-red-100 text-red-600' :
                                alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'
                              }`}>{alert.severity}</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">{alert.message}</p>
                            <p className="text-[11px] text-slate-400 mt-1.5">{formatRelativeTime(alert.created_at)}</p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {read.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Read</h2>
            <div className="space-y-2 opacity-60">
              {read.map((alert) => {
                const Icon = ICONS[alert.type];
                return (
                  <div key={alert.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{alert.patient?.users?.display_name || 'Patient'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

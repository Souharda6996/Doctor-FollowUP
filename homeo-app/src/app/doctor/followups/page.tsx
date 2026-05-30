'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Plus, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';

type FilterType = 'all' | 'scheduled' | 'completed' | 'missed';

const FILTERS: { label: string; value: FilterType; color: string }[] = [
  { label: 'All', value: 'all', color: 'blue' },
  { label: 'Scheduled', value: 'scheduled', color: 'blue' },
  { label: 'Completed', value: 'completed', color: 'green' },
  { label: 'Missed', value: 'missed', color: 'red' },
];

export default function FollowUpsPage() {
  const { token } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');

  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const res = await fetch('/api/doctor/followups', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        setFollowUps(json.followUps || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const filtered = followUps.filter((f) => filter === 'all' || f.status === filter);

  if (loading) return <div className="p-5 space-y-4"><SkeletonCard lines={2} /><SkeletonCard lines={2} /></div>;
  if (error) return <div className="p-5"><ErrorState message={error} /></div>;

  const statusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'missed') return <XCircle className="w-4 h-4 text-red-500" />;
    if (status === 'scheduled') return <Clock className="w-4 h-4 text-blue-500" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Follow-up Schedule
            </h1>
            <p className="text-xs text-slate-500">{followUps.filter(f => f.status === 'scheduled').length} upcoming</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn-primary flex items-center gap-1.5 !px-4 !py-2.5 text-sm"
          >
            <Plus className="w-4 h-4" />
            Schedule
          </motion.button>
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                filter === f.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-5 space-y-3">
        {filtered.map((fu: any, i) => {
          const patientName = fu.patient?.users?.display_name || 'Patient';
          return (
            <motion.div
              key={fu.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/doctor/patients/${fu.patient_id}`}>
                <motion.div
                  whileHover={{ y: -1 }}
                  className={`card p-4 cursor-pointer hover:shadow-md transition-all ${
                    fu.status === 'missed' ? 'border-red-200 bg-red-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold flex-shrink-0">
                      {patientName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900 text-sm">{patientName}</p>
                        <div className="flex items-center gap-1.5">
                          {statusIcon(fu.status)}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{fu.patient?.chief_complaint || 'No complaint'}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(fu.scheduled_at).toLocaleDateString()}
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          fu.type === 'urgent' ? 'bg-red-50 text-red-600 border-red-200' :
                          fu.type === 'follow-up' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                          'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>{fu.status}</span>
                        <span className={`text-[10px] font-semibold capitalize ml-auto ${
                          fu.status === 'completed' ? 'text-green-600' :
                          fu.status === 'missed' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>{fu.status}</span>
                      </div>
                      {fu.doctorNotes && (
                        <p className="text-xs text-slate-500 bg-slate-100 rounded-lg px-3 py-1.5 mt-2">{fu.doctorNotes}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

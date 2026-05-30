'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Search, Plus, ChevronRight, Users } from 'lucide-react';
import { getStatusColor, getStatusDot } from '@/lib/utils';
import { PatientStatus } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';

const STATUS_FILTERS: { label: string; value: PatientStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Improving', value: 'improving' },
  { label: 'Stable', value: 'stable' },
];

export default function PatientsPage() {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'all'>('all');
  
  const [patients, setPatients] = useState<any[]>([]);
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
        setPatients(json.patients || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const filtered = patients.filter((p) => {
    const name = p.users?.display_name || '';
    const phone = p.users?.phone || '';
    const complaint = p.chief_complaint || '';
    
    const matchSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      complaint.toLowerCase().includes(search.toLowerCase()) ||
      phone.includes(search);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="p-5 space-y-4"><SkeletonCard lines={3} /><SkeletonCard lines={3} /></div>;
  if (error) return <div className="p-5"><ErrorState message={error} /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Patient Management
            </h1>
            <p className="text-xs text-slate-500">{patients.length} total patients</p>
          </div>
          <Link href="/doctor/patients/new">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="btn-primary flex items-center gap-1.5 !px-4 !py-2.5 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Patient
            </motion.button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input-field pl-10"
            placeholder="Search patients, complaints, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                statusFilter === f.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-5 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No patients found</p>
          </div>
        )}
        {filtered.map((patient: any, i) => {
          const name = patient.users?.display_name || 'Patient';
          const phone = patient.users?.phone || '';
          return (
          <motion.div
            key={patient.user_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link href={`/doctor/patients/${patient.user_id}`}>
              <motion.div
                whileHover={{ y: -1 }}
                className="card p-4 cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-lg font-bold">
                      {name.charAt(0)}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${getStatusDot(patient.status)}`} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{name}</p>
                        <p className="text-xs text-slate-500">{phone}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                    </div>

                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-1">{patient.chief_complaint || 'No complaints recorded'}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full border ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                      <span className={`text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full border ${
                        patient.case_type === 'chronic'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {patient.case_type}
                      </span>
                      {patient.next_follow_up && (
                        <span className="text-[10px] text-slate-400 ml-auto">
                          Next: {new Date(patient.next_follow_up).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        )})}
      </div>
    </div>
  );
}

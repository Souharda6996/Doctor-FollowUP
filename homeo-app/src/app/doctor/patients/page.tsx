'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Search, Plus, Filter, ChevronRight, Users } from 'lucide-react';
import { MOCK_PATIENTS } from '@/lib/mockData';
import { getStatusColor, getStatusDot } from '@/lib/utils';
import { Patient, PatientStatus } from '@/lib/types';

const STATUS_FILTERS: { label: string; value: PatientStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Critical', value: 'critical' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Improving', value: 'improving' },
  { label: 'Stable', value: 'stable' },
];

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'all'>('all');

  const filtered = MOCK_PATIENTS.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.chiefComplaint.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

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
            <p className="text-xs text-slate-500">{MOCK_PATIENTS.length} total patients</p>
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
        {filtered.map((patient, i) => (
          <motion.div
            key={patient.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link href={`/doctor/patients/${patient.id}`}>
              <motion.div
                whileHover={{ y: -1 }}
                className="card p-4 cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-lg font-bold">
                      {patient.name.charAt(0)}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${getStatusDot(patient.status)}`} />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{patient.name}</p>
                        <p className="text-xs text-slate-500">{patient.age}y · {patient.gender} · {patient.phone}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                    </div>

                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-1">{patient.chiefComplaint}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full border ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                      <span className={`text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full border ${
                        patient.caseType === 'chronic'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {patient.caseType}
                      </span>
                      {patient.nextFollowUp && (
                        <span className="text-[10px] text-slate-400 ml-auto">
                          Next: {new Date(patient.nextFollowUp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

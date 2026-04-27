'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, ChevronRight, Check, AlertTriangle, MapPin, MessageSquare, FileText } from 'lucide-react';
import { MOCK_APPOINTMENTS } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AppointmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const patientId = user?.patientId ?? 'p001';

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [showReschedule, setShowReschedule] = useState<string | null>(null);

  const all = MOCK_APPOINTMENTS.filter((a) => a.patientId === patientId);
  const upcoming = all.filter((a) => a.status !== 'completed').sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const past     = all.filter((a) => a.status === 'completed');
  const list = activeTab === 'upcoming' ? upcoming : past;

  const handleConfirm = (id: string) => {
    setConfirmedIds((prev) => new Set([...prev, id]));
    setConfirmingId(null);
  };

  const statusColor = (status: string, type: string) => {
    if (type === 'urgent') return 'bg-[#FFF0F1] border-[#FF4757]/40';
    if (status === 'confirmed') return 'bg-[#E6FBF4] border-[#00C48C]/40';
    if (status === 'completed') return 'bg-slate-50 border-slate-200';
    return 'bg-white border-slate-200';
  };

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  const daysUntil = (d: string) => {
    const diff = Math.ceil((new Date(d + 'T00:00:00').getTime() - Date.now()) / 86400000);
    if (diff < 0) return 'Past';
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F7F9FC]">
      <div className="gradient-header px-5 pt-10 pb-6 rounded-b-3xl">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white/70 text-sm mb-4 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white text-2xl font-bold font-heading flex items-center gap-2">
          <Calendar className="w-6 h-6" /> Appointments
        </h1>
        <p className="text-blue-100 text-xs mt-1">{upcoming.length} upcoming · {past.length} completed</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-4">
        {(['upcoming', 'past'] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
              activeTab === t ? 'bg-[#1A6BFF] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
            }`}>
            {t === 'upcoming' ? 'Upcoming' : 'Past'}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-3 pb-6">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {list.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No {activeTab} appointments</p>
              </div>
            )}
            {list.map((appt, i) => {
              const isConfirmed = confirmedIds.has(appt.id) || appt.status === 'confirmed';
              const isUrgent    = appt.type === 'urgent';

              return (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`card overflow-hidden border ${statusColor(appt.status, appt.type)}`}
                >
                  {/* Top strip */}
                  <div className={`px-4 py-2 flex items-center justify-between text-xs font-bold ${
                    isUrgent ? 'bg-[#FF4757] text-white' :
                    isConfirmed ? 'bg-[#00C48C] text-white' :
                    appt.status === 'completed' ? 'bg-slate-200 text-slate-600' :
                    'bg-[#1A6BFF] text-white'
                  }`}>
                    <span>{isUrgent ? '⚡ URGENT' : isConfirmed ? '✓ Confirmed' : appt.status.toUpperCase()}</span>
                    <span>{appt.type.toUpperCase()}</span>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{formatDate(appt.scheduledDate)}</p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {appt.scheduledTime ?? 'Time TBD'}
                          {activeTab === 'upcoming' && (
                            <span className={`ml-2 font-semibold ${
                              daysUntil(appt.scheduledDate) === 'Today' ? 'text-[#FF4757]' :
                              daysUntil(appt.scheduledDate) === 'Tomorrow' ? 'text-[#FFB800]' : 'text-slate-500'
                            }`}>
                              · {daysUntil(appt.scheduledDate)}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#1A6BFF] bg-blue-50 px-2 py-1 rounded-full">
                        <span>Dr. Sharma</span>
                      </div>
                    </div>

                    {/* Contextual reason */}
                    {appt.reason && (
                      <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                        isUrgent ? 'bg-[#FFF0F1] text-red-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        <span className="font-semibold">💡 Why this visit: </span>{appt.reason}
                      </div>
                    )}

                    {appt.doctorNotes && (
                      <div className="p-3 rounded-xl text-xs bg-slate-50 text-slate-600 leading-relaxed">
                        <span className="font-semibold text-slate-700">Doctor's notes: </span>{appt.doctorNotes}
                      </div>
                    )}

                    {/* Actions */}
                    {activeTab === 'upcoming' && appt.status !== 'completed' && (
                      <div className="flex gap-2">
                        {!isConfirmed && (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleConfirm(appt.id)}
                            className="flex-1 py-2 rounded-xl bg-[#00C48C] text-white text-xs font-semibold flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Confirm
                          </motion.button>
                        )}
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setShowReschedule(appt.id)}
                          className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                        >
                          Reschedule
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          className="px-3 py-2 rounded-xl bg-orange-50 text-orange-600 text-xs font-semibold flex items-center gap-1 border border-orange-200"
                        >
                          <MapPin className="w-3 h-3" /> Help
                        </motion.button>
                      </div>
                    )}

                    {/* Pre-visit brief link */}
                    {activeTab === 'upcoming' && (
                      <Link href={`/patient/appointments/${appt.id}/brief`}>
                        <div className="flex items-center gap-2 text-xs text-[#1A6BFF] font-semibold mt-1">
                          <FileText className="w-3.5 h-3.5" />
                          View Pre-Visit Smart Brief <ChevronRight className="w-3 h-3 ml-auto" />
                        </div>
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Reschedule sheet */}
      <AnimatePresence>
        {showReschedule && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bottom-sheet-backdrop" onClick={() => setShowReschedule(null)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bottom-sheet"
            >
              <div className="bottom-sheet-handle" />
              <h3 className="font-bold text-slate-900 font-heading mb-1">Request Reschedule</h3>
              <p className="text-sm text-slate-500 mb-4">Your doctor's office will confirm a new time</p>
              <textarea placeholder="Optional: reason for rescheduling" rows={3} className="input-field mb-3 resize-none text-sm" />
              <button
                onClick={() => { alert('Reschedule request sent! Doctor\'s office will call you.'); setShowReschedule(null); }}
                className="btn-primary w-full"
              >
                Send Request
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

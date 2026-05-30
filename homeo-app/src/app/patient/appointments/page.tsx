'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, ChevronRight, Check, MapPin, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { supabase } from '@/lib/supabase';

export default function AppointmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const patientId = user?.patientId ?? 'p001';

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [showReschedule, setShowReschedule] = useState<string | null>(null);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem('medifollowup_token');
      const res = await fetch('/api/patient/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json.appointments);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    const channel = supabase.channel('patient-appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const upcoming = data.filter((a: any) => a.status !== 'completed').sort((a: any, b: any) => new Date(`${a.scheduled_date}T${a.scheduled_time || '00:00:00'}`).getTime() - new Date(`${b.scheduled_date}T${b.scheduled_time || '00:00:00'}`).getTime());
  const past     = data.filter((a: any) => a.status === 'completed');
  const list = activeTab === 'upcoming' ? upcoming : past;

  if (loading) return <div className="p-5 space-y-4 min-h-screen bg-[#F7F9FC]"><SkeletonCard lines={3} /><SkeletonCard lines={4} /><SkeletonCard lines={4} /></div>;
  if (error) return <div className="p-5"><ErrorState message={error} /></div>;

  const handleConfirm = async (id: string) => {
    try {
      const token = localStorage.getItem('medifollowup_token');
      await fetch('/api/patient/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ appointment_id: id, status: 'confirmed' })
      });
      setConfirmedIds((prev) => new Set(Array.from(prev).concat(id)));
    } catch (e) {
      console.error(e);
    }
  };

  const statusColor = (status: string, type: string) => {
    if (type === 'urgent') return 'bg-[#FFF0F1] border-[#FF4757]/40';
    if (status === 'confirmed') return 'bg-[#E6FBF4] border-[#00C48C]/40';
    if (status === 'completed') return 'bg-slate-50 border-slate-200';
    return 'bg-white border-slate-200';
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  const daysUntil = (d: string) => {
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
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
                        <p className="font-bold text-slate-900">{formatDate(appt.scheduled_date)}</p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {appt.scheduled_time ? new Date(`1970-01-01T${appt.scheduled_time}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                          {activeTab === 'upcoming' && (
                            <span className={`ml-2 font-semibold ${
                              daysUntil(appt.scheduled_date) === 'Today' ? 'text-[#FF4757]' :
                              daysUntil(appt.scheduled_date) === 'Tomorrow' ? 'text-[#FFB800]' : 'text-slate-500'
                            }`}>
                              · {daysUntil(appt.scheduled_date)}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#1A6BFF] bg-blue-50 px-2 py-1 rounded-full">
                        <span>Dr. {appt.doctor?.display_name || 'Doctor'}</span>
                      </div>
                    </div>

                    {/* Contextual reason */}
                    {appt.description && (
                      <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                        isUrgent ? 'bg-[#FFF0F1] text-red-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                      <span className="font-semibold">💡 Why this visit: </span>{appt.description}
                      </div>
                    )}

                    {appt.doctorNotes && (
                      <div className="p-3 rounded-xl text-xs bg-slate-50 text-slate-600 leading-relaxed">
                        <span className="font-semibold text-slate-700">Doctor&apos;s notes: </span>{appt.doctorNotes}
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
              <p className="text-sm text-slate-500 mb-4">Your doctor&apos;s office will confirm a new time</p>
              <textarea placeholder="Optional: reason for rescheduling" rows={3} className="input-field mb-3 resize-none text-sm" />
              <button
                onClick={() => { alert("Reschedule request sent! Doctor's office will call you."); setShowReschedule(null); }}
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

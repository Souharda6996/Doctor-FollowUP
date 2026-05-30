'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Pill, Sun, Sunset, Moon, Check, X, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MOCK_ADHERENCE } from '@/lib/mockData';
import type { MealTime } from '@/lib/types';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';

const MISS_REASONS = [
  { key: 'forgot',        emoji: '🤔', label: 'Forgot'          },
  { key: 'side_effects',  emoji: '😣', label: 'Side Effects'    },
  { key: 'cost',          emoji: '💸', label: 'Too Expensive'   },
  { key: 'feeling_better',emoji: '😊', label: 'Feeling Better'  },
] as const;

type MissReason = typeof MISS_REASONS[number]['key'];

interface MedState {
  medicineId: string;
  status: 'pending' | 'taken' | 'missed';
  missReason?: MissReason;
}

function AdherenceRing({ percent }: { percent: number }) {
  const radius = 44;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (percent / 100) * circ;
  const color  = percent >= 80 ? '#00C48C' : percent >= 60 ? '#FFB800' : '#FF4757';

  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="10" />
      <motion.circle
        cx="60" cy="60" r={radius}
        fill="none" stroke={color} strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
      />
    </svg>
  );
}

export default function MedicinePage() {
  const router = useRouter();
  const { user } = useAuth();
  const patientId = user?.patientId ?? 'p001';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      try {
        const token = localStorage.getItem('medifollowup_token');
        const res = await fetch('/api/patient/medicines', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const [medStates, setMedStates] = useState<MedState[]>([]);
  const [flyingPill, setFlyingPill] = useState<string | null>(null);
  const [showMissSheet, setShowMissSheet] = useState<string | null>(null); // medicineId
  const [expandedMed, setExpandedMed] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'weekly'>('today');

  useEffect(() => {
    if (data) {
      const today = new Date().toISOString().split('T')[0];
      const initial: MedState[] = data.meds.map((m: any) => {
        const log = data.savedLogs.find((l: any) => l.medicine_id === m.id && l.log_date === today);
        return { medicineId: m.id, status: log ? (log.taken ? 'taken' : 'missed') : 'pending', missReason: log?.missed_reason as MissReason | undefined };
      });
      setMedStates(initial);
    }
  }, [data]);

  if (loading) return <div className="p-5 space-y-4 min-h-screen bg-[#F7F9FC]"><SkeletonCard lines={3} /><SkeletonCard lines={4} /><SkeletonCard lines={4} /></div>;
  if (error) return <div className="p-5"><ErrorState message={error} /></div>;
  if (!data) return null;

  const { meds, adherence } = data;
  const today = new Date().toISOString().split('T')[0];


  const getMedState = (id: string) => medStates.find((s) => s.medicineId === id)!;

  const markTaken = async (medId: string) => {
    setFlyingPill(medId);
    try {
      const token = localStorage.getItem('medifollowup_token');
      await fetch('/api/medicines/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ patient_id: user?.id, medicine_id: medId, taken: true })
      });
      setTimeout(() => {
        setFlyingPill(null);
        setMedStates((prev) => prev.map((s) => s.medicineId === medId ? { ...s, status: 'taken' } : s));
      }, 480);
    } catch (e) {
      console.error(e);
    }
  };

  const markMissed = async (medId: string, reason: MissReason) => {
    setShowMissSheet(null);
    try {
      const token = localStorage.getItem('medifollowup_token');
      await fetch('/api/medicines/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ patient_id: user?.id, medicine_id: medId, taken: false, missed_reason: reason })
      });
      setMedStates((prev) => prev.map((s) => s.medicineId === medId ? { ...s, status: 'missed', missReason: reason } : s));
    } catch (e) {
      console.error(e);
    }
  };

  const timeGroups: { time: MealTime; label: string; icon: typeof Sun }[] = [
    { time: 'morning',   label: 'Morning',   icon: Sun    },
    { time: 'afternoon', label: 'Afternoon', icon: Sunset },
    { time: 'night',     label: 'Night',     icon: Moon   },
  ];

  const takenCount  = medStates.filter((s) => s.status === 'taken').length;
  const totalCount  = medStates.length;

  return (
    <div className="flex-1 flex flex-col bg-[#F7F9FC]">
      {/* Header */}
      <div className="gradient-header px-5 pt-10 pb-6 rounded-b-3xl">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white/70 text-sm mb-4 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white text-2xl font-bold font-heading flex items-center gap-2">
          <Pill className="w-6 h-6" /> Medicine Manager
        </h1>
        <p className="text-blue-100 text-xs mt-1">
          {today} · {takenCount} of {totalCount} taken today
        </p>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(takenCount / Math.max(totalCount, 1)) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-white rounded-full"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-4">
        {(['today', 'weekly'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === t ? 'bg-[#1A6BFF] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {t === 'today' ? "Today's Log" : 'Weekly Report'}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-4 pb-6">
        {activeTab === 'today' && (
          <>
            {timeGroups.map(({ time, label, icon: Icon }) => {
              const medsForTime = meds.filter((m: any) => m.times?.includes(time) || m.frequency?.toLowerCase().includes(time));
              if (!medsForTime.length) return null;
              return (
                <div key={time}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</h3>
                  </div>
                  <div className="space-y-2">
                    {medsForTime.map((med: any) => {
                      const state = getMedState(med.id);
                      if (!state) return null;
                      const isTaken  = state.status === 'taken';
                      const isMissed = state.status === 'missed';
                      const isExpanded = expandedMed === med.id;

                      return (
                        <div key={med.id}>
                          <motion.div
                            layout
                            className={`card overflow-hidden transition-all ${
                              isTaken  ? 'border-[#00C48C]/30 bg-[#E6FBF4]' :
                              isMissed ? 'border-[#FF4757]/30 bg-[#FFF0F1]' :
                              'bg-white'
                            }`}
                          >
                            <div className="p-4 flex items-center gap-3">
                              {/* Pill icon / status */}
                              <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isTaken ? 'bg-[#00C48C]/15' : isMissed ? 'bg-[#FF4757]/10' : 'bg-slate-100'
                              } ${flyingPill === med.id ? 'pill-fly' : ''}`}>
                                {isTaken  ? <Check className="w-6 h-6 text-[#00C48C]" /> :
                                 isMissed ? <X className="w-6 h-6 text-[#FF4757]" /> :
                                 <span className="text-2xl">💊</span>}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-sm">{med.medicine_name}</p>
                                <p className="text-xs text-slate-500">{med.dosage} · {med.frequency ?? label}</p>
                                {isMissed && state.missReason && (
                                  <span className="text-[10px] font-semibold text-[#FF4757]">
                                    Missed: {MISS_REASONS.find((r) => r.key === state.missReason)?.label}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setExpandedMed(isExpanded ? null : med.id)}
                                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"
                                >
                                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                {!isTaken && !isMissed && (
                                  <>
                                    <motion.button
                                      whileTap={{ scale: 0.85 }}
                                      onClick={() => markTaken(med.id)}
                                      className="w-10 h-10 rounded-xl bg-[#00C48C] flex items-center justify-center text-white shadow-md"
                                      style={{ boxShadow: 'var(--shadow-glow-green)' }}
                                    >
                                      <Check className="w-4 h-4" />
                                    </motion.button>
                                    <motion.button
                                      whileTap={{ scale: 0.85 }}
                                      onClick={() => setShowMissSheet(med.id)}
                                      className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"
                                    >
                                      <X className="w-4 h-4 text-slate-500" />
                                    </motion.button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Expanded details */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-slate-100 px-4 py-3 bg-slate-50/50"
                                >
                                  {med.notes && (
                                    <p className="text-xs text-slate-600 mb-2">📌 {med.notes}</p>
                                  )}
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white rounded-lg p-2"><p className="text-slate-400 font-semibold text-[10px] uppercase">Dosage</p><p className="text-slate-800 font-medium mt-0.5">{med.dosage}</p></div>
                                    <div className="bg-white rounded-lg p-2"><p className="text-slate-400 font-semibold text-[10px] uppercase">Started</p><p className="text-slate-800 font-medium mt-0.5">{new Date(med.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p></div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {activeTab === 'weekly' && (
          <div className="space-y-4">
            {/* Adherence ring */}
            <div className="card p-6 flex flex-col items-center">
              <h3 className="font-bold text-slate-900 mb-4 text-sm">Weekly Adherence</h3>
              <div className="relative">
                <AdherenceRing percent={adherence?.weekPercent ?? 88} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900">{adherence?.weekPercent ?? 88}%</span>
                  <span className="text-[11px] text-slate-500">This week</span>
                </div>
              </div>
              <p className={`mt-3 text-sm font-semibold ${(adherence?.weekPercent ?? 88) >= 80 ? 'text-[#00C48C]' : 'text-[#FFB800]'}`}>
                {(adherence?.weekPercent ?? 88) >= 80 ? '🎉 Excellent adherence!' : '⚠️ Room to improve'}
              </p>
            </div>

            {/* Missed reason breakdown */}
            {adherence && (
              <div className="card p-4">
                <h3 className="font-bold text-slate-900 text-sm mb-3">Why Doses Were Missed</h3>
                <div className="space-y-2">
                  {MISS_REASONS.map((r) => {
                    const count = adherence.missedReasonBreakdown[r.key] ?? 0;
                    const total = Object.values(adherence.missedReasonBreakdown).reduce((a: any, b: any) => a + b, 0) as number;
                    const pct   = total ? (count / total) * 100 : 0;
                    return (
                      <div key={r.key} className="flex items-center gap-3">
                        <span className="text-lg flex-shrink-0">{r.emoji}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-slate-700">{r.label}</span>
                            <span className="text-slate-500">{count} dose{count !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                              className="h-full bg-[#1A6BFF] rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MISSED REASON BOTTOM SHEET ── */}
      <AnimatePresence>
        {showMissSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bottom-sheet-backdrop" onClick={() => setShowMissSheet(null)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bottom-sheet"
            >
              <div className="bottom-sheet-handle" />
              <h3 className="font-bold text-slate-900 font-heading mb-1">Why did you miss it?</h3>
              <p className="text-sm text-slate-500 mb-5">No judgement — this helps your doctor understand</p>
              <div className="grid grid-cols-2 gap-3">
                {MISS_REASONS.map((r) => (
                  <motion.button
                    key={r.key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => markMissed(showMissSheet, r.key)}
                    className="py-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#1A6BFF] flex flex-col items-center gap-2 transition-all"
                  >
                    <span className="text-2xl">{r.emoji}</span>
                    <span className="text-xs font-semibold text-slate-700">{r.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

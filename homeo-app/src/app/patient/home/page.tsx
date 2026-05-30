'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bell, Calendar, Mic, MicOff, AlertTriangle, ChevronRight,
  Pill, Activity, FileText, MessageSquare, Phone, MapPin,
  Sun, Sunset, Moon, TrendingUp, Check
} from 'lucide-react';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';
import type { MoodEmoji } from '@/lib/types';

const MOODS: { emoji: MoodEmoji; label: string }[] = [
  { emoji: '😊', label: 'Great'   },
  { emoji: '😐', label: 'Okay'    },
  { emoji: '😔', label: 'Low'     },
  { emoji: '😤', label: 'Anxious' },
  { emoji: '🤒', label: 'Sick'    },
  { emoji: '😴', label: 'Tired'   },
];

const BODY_PARTS = ['Head', 'Chest', 'Stomach', 'Back', 'Arms', 'Legs'];

const EMERGENCY_OPTIONS = [
  { label: 'Chest Pain',       sub: 'Severe pressure or tightness', icon: '💔', color: 'bg-red-50 border-red-300' },
  { label: 'Can\'t Breathe',  sub: 'Shortness of breath at rest',   icon: '🫁', color: 'bg-red-50 border-red-300' },
  { label: 'Stroke Signs',     sub: 'Face drooping, arm weak, speech', icon: '🧠', color: 'bg-red-50 border-red-300' },
  { label: 'Severe Bleeding',  sub: 'Uncontrolled wound or injury',  icon: '🩸', color: 'bg-orange-50 border-orange-300' },
];

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { greeting: 'Good morning', icon: <Sun className="w-4 h-4" /> };
  if (h < 17) return { greeting: 'Good afternoon', icon: <Sunset className="w-4 h-4" /> };
  return { greeting: 'Good evening', icon: <Moon className="w-4 h-4" /> };
}

export default function PatientHome() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'Friend';
  const patientId = user?.patientId ?? 'p001';

  const [checkinDone, setCheckinDone]         = useState(false);
  const [selectedMood, setSelectedMood]       = useState<MoodEmoji | null>(null);
  const [selectedParts, setSelectedParts]     = useState<string[]>([]);
  const [energy, setEnergy]                   = useState(5);
  const [bouncingEmoji, setBouncingEmoji]     = useState<string | null>(null);

  const [showEmergency, setShowEmergency]     = useState(false);
  const [recording, setRecording]             = useState(false);
  const [recordSeconds, setRecordSeconds]     = useState(0);
  const recordTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [takenMeds, setTakenMeds]             = useState<Set<string>>(new Set());
  const [flyingPill, setFlyingPill]           = useState<string | null>(null);
  const [showConfetti, setShowConfetti]        = useState(false);

  const { greeting, icon } = getTimeGreeting();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      try {
        const token = localStorage.getItem('medifollowup_token');
        const res = await fetch('/api/patient/dashboard', {
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

  if (loading) return <div className="p-5 space-y-4 min-h-screen bg-[#F7F9FC]"><SkeletonCard lines={3} /><SkeletonCard lines={4} /><SkeletonCard lines={4} /></div>;
  if (error) return <div className="p-5"><ErrorState message={error} /></div>;
  if (!data) return null;

  const { nextAppt, patientMeds, todayLogs, recentCheckins } = data;

  const handleMoodSelect = (emoji: MoodEmoji) => {
    setSelectedMood(emoji);
    setBouncingEmoji(emoji);
    setTimeout(() => setBouncingEmoji(null), 500);
  };

  const toggleBodyPart = (part: string) => {
    setSelectedParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]
    );
  };

  const handleCheckinSubmit = async () => {
    if (!selectedMood) return;
    try {
      const token = localStorage.getItem('medifollowup_token');
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_id: user?.id,
          mood: selectedMood,
          energy,
          symptoms: selectedParts
        })
      });
      if (!res.ok) throw new Error('Failed to submit checkin');
      setCheckinDone(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    } catch (e) {
      console.error(e);
      alert('Failed to submit check-in');
    }
  };

  const handleMedTaken = async (medId: string) => {
    setFlyingPill(medId);
    try {
      const token = localStorage.getItem('medifollowup_token');
      await fetch('/api/medicines/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patient_id: user?.id,
          medicine_id: medId,
          taken: true
        })
      });
      setTimeout(() => {
        setFlyingPill(null);
        setTakenMeds((prev) => new Set(Array.from(prev).concat(medId)));
      }, 500);
    } catch (e) {
      console.error(e);
    }
  };

  const startRecording = () => {
    setRecording(true);
    setRecordSeconds(0);
    recordTimer.current = setInterval(() => setRecordSeconds((s) => {
      if (s >= 60) { stopRecording(); return s; }
      return s + 1;
    }), 1000);
  };

  const stopRecording = () => {
    setRecording(false);
    if (recordTimer.current) clearInterval(recordTimer.current);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F7F9FC] pb-4">

      {/* ── HERO HEADER ───────────────────────── */}
      <div className="relative bg-gradient-to-br from-[#1A6BFF] via-[#1255CC] to-[#0D3FA6] px-5 pt-12 pb-20 rounded-b-[40px]">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

        <div className="flex items-center justify-between relative">
          <div>
            <div className="flex items-center gap-1.5 text-blue-200 text-xs mb-1">
              {icon} <span>{greeting},</span>
            </div>
            <h1 className="text-white text-2xl font-bold font-heading">{firstName} 👋</h1>
            <p className="text-blue-200 text-xs mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <Link href="/patient/appointments">
            <button className="relative w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF4757] rounded-full text-[9px] font-bold flex items-center justify-center">2</span>
            </button>
          </Link>
        </div>

        {/* ── NEXT APPOINTMENT CARD ── */}
        {nextAppt && (
          <Link href="/patient/appointments">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-5 bg-white rounded-2xl p-4 shadow-xl shadow-blue-900/20 cursor-pointer hover:shadow-2xl transition-shadow relative"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-[#1A6BFF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A6BFF]">Next Appointment</span>
                    {nextAppt.type === 'urgent' && (
                      <span className="badge-red text-[9px]">URGENT</span>
                    )}
                  </div>
                  <p className="font-bold text-slate-900 text-sm">
                    {new Date(nextAppt.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}
                    {nextAppt.scheduled_time ? new Date(`1970-01-01T${nextAppt.scheduled_time}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                  </p>
                  {nextAppt.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                      💡 {nextAppt.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              </div>
            </motion.div>
          </Link>
        )}
      </div>

      <div className="px-4 -mt-6 space-y-4">

        {/* ── MEDICINE CLOCK WIDGET ───────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Pill className="w-4 h-4 text-[#1A6BFF]" /> Medicine Clock
            </h2>
            <Link href="/patient/medicines" className="text-xs text-[#1A6BFF] font-semibold flex items-center gap-0.5">
              All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {(['morning', 'afternoon', 'night'] as const).map((time) => {
              const medsForTime = patientMeds.filter((m: any) => m.times?.includes(time) || m.frequency?.toLowerCase().includes(time));
              const Icon = time === 'morning' ? Sun : time === 'afternoon' ? Sunset : Moon;
              const timeLabel = { morning: 'Morning', afternoon: 'Afternoon', night: 'Night' }[time];
              const allTaken = medsForTime.length > 0 && medsForTime.every((m: any) => takenMeds.has(m.id) || todayLogs.find((l: any) => l.medicine_id === m.id && l.taken));

              if (!medsForTime.length) return null;

              return (
                <div key={time} className={`flex items-center gap-3 p-3 rounded-xl ${allTaken ? 'med-taken' : 'med-pending'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    allTaken ? 'bg-[#00C48C]/15' : 'bg-slate-100'
                  }`}>
                    <Icon className={`w-4 h-4 ${allTaken ? 'text-[#00C48C]' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800">{timeLabel}</p>
                    <p className="text-[11px] text-slate-500 truncate">{medsForTime.length} medicine{medsForTime.length > 1 ? 's' : ''}</p>
                  </div>
                  {allTaken ? (
                    <div className="w-8 h-8 rounded-full bg-[#00C48C] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      {medsForTime.slice(0, 3).map((med: any) => (
                        <motion.button
                          key={med.id}
                          whileTap={{ scale: 0.85 }}
                          onClick={() => handleMedTaken(med.id)}
                          className={`relative w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm transition-all ${
                            takenMeds.has(med.id) ? 'bg-[#00C48C] border-[#00C48C]' : 'border-slate-300 bg-white'
                          } ${flyingPill === med.id ? 'pill-fly' : ''}`}
                        >
                          {takenMeds.has(med.id) ? <Check className="w-3 h-3 text-white" /> : '💊'}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── DAILY CHECK-IN CARD ─────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00C48C]" /> Daily Check-in
            </h2>
            {checkinDone && <span className="badge-green text-[10px]">Done ✓</span>}
          </div>

          {checkinDone ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">{selectedMood}</div>
              <p className="text-sm font-semibold text-slate-800">Check-in submitted!</p>
              <p className="text-xs text-slate-500 mt-1">Energy: {energy}/10 · {selectedParts.length} body area{selectedParts.length !== 1 ? 's' : ''} noted</p>
              {/* Confetti */}
              {showConfetti && (
                <div className="relative overflow-hidden h-12">
                  {['#1A6BFF','#00C48C','#FFB800','#FF4757'].map((color, i) => (
                    <div key={i} className="confetti-dot" style={{
                      backgroundColor: color,
                      left: `${20 + i * 20}%`,
                      animationDelay: `${i * 0.1}s`,
                    }} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mood row */}
              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-2">How do you feel today?</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {MOODS.map(({ emoji, label }) => (
                    <motion.button
                      key={emoji}
                      onClick={() => handleMoodSelect(emoji)}
                      animate={bouncingEmoji === emoji ? { scale: [1, 1.4, 0.9, 1.1, 1] } : {}}
                      transition={{ duration: 0.4 }}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                        selectedMood === emoji ? 'bg-blue-50 ring-2 ring-[#1A6BFF]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <span className="text-[9px] font-medium text-slate-600">{label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Body parts */}
              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-2">Any discomfort? (tap area)</p>
                <div className="flex flex-wrap gap-1.5">
                  {BODY_PARTS.map((part) => (
                    <button
                      key={part}
                      onClick={() => toggleBodyPart(part)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                        selectedParts.includes(part)
                          ? 'bg-[#FF4757]/10 border-[#FF4757]/40 text-[#FF4757]'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {part}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy slider */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                  <span>Energy level</span><span className="text-[#1A6BFF]">{energy}/10</span>
                </div>
                <input
                  type="range" min={1} max={10} value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full accent-[#1A6BFF] h-2"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCheckinSubmit}
                disabled={!selectedMood}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  selectedMood ? 'bg-[#00C48C] text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                Submit Check-in ✓
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* ── QUICK ACTIONS ROW ───────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="grid grid-cols-4 gap-2">
            {[
              { href: '/patient/medicines',    icon: Pill,          label: 'Meds',     color: 'bg-blue-50 text-[#1A6BFF]'   },
              { href: '/patient/reports',      icon: FileText,      label: 'Reports',  color: 'bg-yellow-50 text-amber-600' },
              { href: '/patient/quick-ask',    icon: MessageSquare, label: 'Ask',      color: 'bg-purple-50 text-purple-600' },
              { href: '/patient/appointments', icon: Calendar,      label: 'Appts',    color: 'bg-green-50 text-[#00C48C]'  },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href}>
                <motion.div whileTap={{ scale: 0.94 }} className="card py-3 flex flex-col items-center gap-1.5 cursor-pointer">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600">{label}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── HEALTH STORY TIMELINE ───────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1A6BFF]" /> Health Story
            </h2>
            <Link href="/patient/log" className="text-xs text-[#1A6BFF] font-semibold flex items-center gap-0.5">
              Full View <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100" />
            <div className="space-y-3 pl-10">
              {recentCheckins.map((ci: any, idx: number) => {
                const statusColor = ci.energy >= 7 ? 'bg-[#00C48C]' : ci.energy >= 4 ? 'bg-[#FFB800]' : 'bg-[#FF4757]';
                return (
                  <motion.div
                    key={ci.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="relative"
                  >
                    <div className={`absolute -left-6 top-2 w-3 h-3 rounded-full border-2 border-white ${statusColor}`} />
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{ci.mood}</span>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              {ci.symptoms.length ? ci.symptoms[0] : 'Feeling good'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(ci.check_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">⚡{ci.energy}/10</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── QUICK ASK + EMERGENCY ROW ──────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="flex gap-3">
          {/* Quick Ask hold-to-record */}
          <div className="flex-1 card p-4 flex flex-col items-center gap-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Quick Ask</p>
            <div className="relative">
              {recording && <div className="pulse-ring-blue" />}
              <motion.button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                whileTap={{ scale: 0.9 }}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white relative z-10 transition-colors ${
                  recording ? 'bg-[#FF4757]' : 'bg-[#1A6BFF]'
                }`}
                style={{ boxShadow: recording ? 'var(--shadow-glow-red)' : 'var(--shadow-glow-blue)' }}
              >
                {recording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </motion.button>
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              {recording ? `Recording… ${recordSeconds}s` : 'Hold to send voice message'}
            </p>
          </div>

          {/* Emergency Button */}
          <div className="flex-1 card p-4 flex flex-col items-center gap-2">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Emergency</p>
            <div className="relative">
              <div className="pulse-ring" />
              <div className="pulse-ring-delay" />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowEmergency(true)}
                className="emergency-btn relative z-10"
              >
                <AlertTriangle className="w-7 h-7 text-white" />
              </motion.button>
            </div>
            <p className="text-[10px] text-slate-500 text-center">Tap for emergency triage</p>
          </div>
        </motion.div>

      </div>

      {/* ════════════════════════════════════════
          EMERGENCY BOTTOM SHEET
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {showEmergency && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bottom-sheet-backdrop"
              onClick={() => setShowEmergency(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bottom-sheet"
            >
              <div className="bottom-sheet-handle" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#FF4757]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 font-heading">Emergency Triage</h3>
                  <p className="text-xs text-slate-500">Select what&apos;s happening — doctor + family will be notified</p>
                </div>
              </div>
              <div className="space-y-2 mb-5">
                {EMERGENCY_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.label}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full text-left p-4 rounded-xl border-2 flex items-center gap-3 ${opt.color} transition-all`}
                    onClick={() => {
                      alert(`Emergency alert sent: ${opt.label}\n\nYour doctor has been notified.\nEmergency contacts alerted.\nNearest ER: Please call 108 immediately.`);
                      setShowEmergency(false);
                    }}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{opt.label}</p>
                      <p className="text-xs text-slate-600">{opt.sub}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a href="tel:108" className="btn-danger flex items-center justify-center gap-2 text-sm rounded-xl">
                  <Phone className="w-4 h-4" /> Call 108
                </a>
                <button className="btn-secondary flex items-center justify-center gap-2 text-sm" onClick={() => setShowEmergency(false)}>
                  <MapPin className="w-4 h-4" /> Find ER
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

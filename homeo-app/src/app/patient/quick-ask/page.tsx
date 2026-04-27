'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mic, MicOff, MessageSquare, Send, AlertTriangle, Clock, Check } from 'lucide-react';
import { MOCK_QUICK_ASKS } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';

const URGENT_KEYWORDS = ['chest', 'breathless', 'severe', 'can\'t breathe', 'stroke', 'unconscious', 'bleeding'];

export default function QuickAskPage() {
  const router = useRouter();
  const { user } = useAuth();
  const patientId = user?.patientId ?? 'p001';

  const pastAsks = MOCK_QUICK_ASKS.filter((q) => q.patientId === patientId);
  const todayAsked = pastAsks.some((q) => q.askedAt.startsWith(new Date().toISOString().slice(0, 10)));

  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordSec, setRecordSec] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [allAsks, setAllAsks] = useState(pastAsks);
  const recordTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkUrgency = (t: string) => {
    setIsUrgent(URGENT_KEYWORDS.some((kw) => t.toLowerCase().includes(kw)));
  };

  const startRecording = () => {
    setRecording(true);
    setRecordSec(0);
    recordTimer.current = setInterval(() => {
      setRecordSec((s) => {
        if (s >= 60) { stopRecording(); return s; }
        return s + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    setRecording(false);
    if (recordTimer.current) clearInterval(recordTimer.current);
    if (recordSec > 2) {
      setText(`[Voice note · ${recordSec}s] Please advise on my current symptoms.`);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    const newAsk = {
      id: `qa_${Date.now()}`,
      patientId,
      doctorId: 'doctor-001',
      question: text,
      questionType: 'text' as const,
      askedAt: new Date().toISOString(),
      isUrgent,
      status: 'pending' as const,
    };
    setAllAsks((prev) => [newAsk, ...prev]);
    setText('');
    setSubmitted(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F7F9FC]">
      {/* Header */}
      <div className="gradient-header px-5 pt-10 pb-6 rounded-b-3xl">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white/70 text-sm mb-4 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white text-2xl font-bold font-heading flex items-center gap-2">
          <MessageSquare className="w-6 h-6" /> Quick Ask
        </h1>
        <p className="text-blue-100 text-xs mt-1">Send a question to your doctor · 1 per day</p>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Input section */}
        {!submitted && !todayAsked ? (
          <div className="card p-4 space-y-3">
            <h2 className="font-bold text-slate-900 text-sm">Ask Dr. Sharma</h2>

            {isUrgent && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-[#FFF0F1] border border-[#FF4757]/30 rounded-xl"
              >
                <AlertTriangle className="w-4 h-4 text-[#FF4757] flex-shrink-0" />
                <p className="text-xs font-semibold text-red-700">
                  This looks urgent! Dr. Sharma will be notified immediately. For emergencies, use the Red Button on home.
                </p>
              </motion.div>
            )}

            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); checkUrgency(e.target.value); }}
              placeholder="Describe your question or concern in simple words…"
              rows={4}
              className="input-field resize-none text-sm"
            />

            <div className="flex gap-2">
              {/* Voice record */}
              <div className="relative flex-shrink-0">
                {recording && <div className="pulse-ring-blue" style={{ borderRadius: '50%' }} />}
                <motion.button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  whileTap={{ scale: 0.9 }}
                  className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center text-white transition-colors ${
                    recording ? 'bg-[#FF4757]' : 'bg-slate-200'
                  }`}
                >
                  {recording
                    ? <MicOff className="w-5 h-5 text-white" />
                    : <Mic className="w-5 h-5 text-slate-600" />}
                </motion.button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  text.trim()
                    ? isUrgent
                      ? 'bg-[#FF4757] text-white shadow-md'
                      : 'bg-[#1A6BFF] text-white shadow-md'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Send className="w-4 h-4" />
                {isUrgent ? 'Send Urgent Question' : 'Send to Doctor'}
              </button>
            </div>

            {recording && (
              <p className="text-xs text-center text-slate-500">
                🔴 Recording… {recordSec}s (release to stop, max 60s)
              </p>
            )}

            <p className="text-[10px] text-slate-400 text-center">
              Your doctor typically responds within a few hours during clinic time
            </p>
          </div>
        ) : (
          <div className={`card p-4 ${submitted ? 'border-[#00C48C]/40 bg-[#E6FBF4]' : 'bg-[#FFF8E6] border-[#FFB800]/40'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${submitted ? 'bg-[#00C48C]/15' : 'bg-amber-100'}`}>
                {submitted ? <Check className="w-5 h-5 text-[#00C48C]" /> : <Clock className="w-5 h-5 text-amber-600" />}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">
                  {submitted ? 'Question sent!' : 'Already asked today'}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {submitted
                    ? 'Dr. Sharma will reply during clinic hours'
                    : 'You can ask again tomorrow. See reply below.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Past Q&A */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider px-1">Question History</h3>
          {allAsks.map((ask, i) => (
            <motion.div
              key={ask.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="card p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                  ask.isUrgent ? 'bg-red-100 text-[#FF4757]' : 'bg-blue-100 text-[#1A6BFF]'
                }`}>
                  {ask.questionType === 'voice' ? '🎤' : '💬'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ask.isUrgent && <span className="badge-red text-[9px]">URGENT</span>}
                    <span className="text-[10px] text-slate-400">
                      {new Date(ask.askedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800">{ask.question}</p>
                </div>
              </div>

              {ask.doctorReply && (
                <div className="ml-11 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-[10px] font-bold text-[#1A6BFF] mb-1">Dr. Sharma replied:</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{ask.doctorReply}</p>
                </div>
              )}

              {!ask.doctorReply && (
                <div className="ml-11 flex items-center gap-1.5 text-xs text-slate-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800] animate-pulse" />
                  Awaiting reply
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

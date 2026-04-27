'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, AlertTriangle, Clock, Send, ChevronRight, Check } from 'lucide-react';
import { MOCK_QUICK_ASKS, MOCK_PATIENTS } from '@/lib/mockData';

export default function DoctorQuickAskPage() {
  const [asks, setAsks] = useState(MOCK_QUICK_ASKS);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const pending = asks.filter((q) => q.status === 'pending');
  const displayed = filter === 'pending' ? pending : asks;

  const handleReply = (askId: string) => {
    if (!replyText.trim()) return;
    setAsks((prev) =>
      prev.map((q) =>
        q.id === askId
          ? { ...q, status: 'answered', doctorReply: replyText, repliedAt: new Date().toISOString() }
          : q
      )
    );
    setReplyingTo(null);
    setReplyText('');
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#1A6BFF]" /> Quick Ask Queue
            </h1>
            <p className="text-xs text-slate-500">{pending.length} pending · {asks.filter((q) => q.isUrgent).length} urgent</p>
          </div>
          <div className="flex gap-1.5">
            {(['pending', 'all'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold capitalize transition-all ${
                  filter === f ? 'bg-[#1A6BFF] text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="p-4 space-y-3">
        {displayed.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No {filter} questions</p>
          </div>
        )}

        {displayed.map((ask, i) => {
          const patient = MOCK_PATIENTS.find((p) => p.id === ask.patientId);
          const isPending = ask.status === 'pending';

          return (
            <motion.div
              key={ask.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`card overflow-hidden ${ask.isUrgent ? 'border-[#FF4757]/40' : ''}`}
            >
              {ask.isUrgent && (
                <div className="bg-[#FF4757] px-4 py-1.5 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-white" />
                  <p className="text-xs font-bold text-white uppercase tracking-wide">Urgent — Contains high-risk keywords</p>
                </div>
              )}

              <div className="p-4">
                {/* Patient context */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1A6BFF] to-[#1255CC] flex items-center justify-center text-white font-bold text-sm">
                    {patient?.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-sm">{patient?.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {new Date(ask.askedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {' · '}
                      {new Date(ask.askedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-100 capitalize">{patient?.status}</span>
                    </div>
                  </div>
                  {!isPending && (
                    <div className="w-7 h-7 rounded-full bg-[#00C48C]/15 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-[#00C48C]" />
                    </div>
                  )}
                </div>

                {/* Question */}
                <div className={`p-3 rounded-xl text-sm leading-relaxed mb-3 ${
                  ask.isUrgent ? 'bg-red-50 border border-red-100 text-red-800' : 'bg-slate-50 text-slate-700'
                }`}>
                  {ask.questionType === 'voice' ? (
                    <p className="flex items-center gap-2">
                      <span>🎤</span> <span>{ask.question}</span>
                    </p>
                  ) : ask.question}
                </div>

                {/* Doctor reply or reply form */}
                {ask.doctorReply ? (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] font-bold text-[#1A6BFF] mb-1">Your reply:</p>
                    <p className="text-xs text-slate-700">{ask.doctorReply}</p>
                  </div>
                ) : replyingTo === ask.id ? (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply to the patient…"
                      rows={3}
                      autoFocus
                      className="input-field resize-none text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReply(ask.id)}
                        disabled={!replyText.trim()}
                        className="flex-1 py-2 rounded-xl bg-[#1A6BFF] text-white text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" /> Send Reply
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setReplyingTo(ask.id)}
                    className="w-full py-2.5 rounded-xl bg-[#1A6BFF] text-white text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Reply to Patient
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

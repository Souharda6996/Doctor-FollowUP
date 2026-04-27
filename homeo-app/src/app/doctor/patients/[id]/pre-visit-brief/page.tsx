'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Brain, Loader } from 'lucide-react';
import { MOCK_PATIENTS, MOCK_CHECKINS, MOCK_MEDICINE_LOGS, MOCK_LAB_REPORTS, MOCK_QUICK_ASKS, MOCK_GUT_TAGS, MOCK_ADHERENCE } from '@/lib/mockData';
import { GUT_TAG_LABELS, type GutTagType } from '@/lib/types';

// Claude-generated mock brief content
const generateMockBrief = (patientId: string) => {
  const patient = MOCK_PATIENTS.find((p) => p.id === patientId);
  const adherence = MOCK_ADHERENCE.find((a) => a.patientId === patientId);
  const labReport = MOCK_LAB_REPORTS.find((r) => r.patientId === patientId);
  const asks = MOCK_QUICK_ASKS.filter((q) => q.patientId === patientId).slice(0, 2);
  const gutTags = MOCK_GUT_TAGS.filter((g) => g.patientId === patientId).slice(-1)[0];

  return {
    doctorBullets: [
      `📊 Mood trend last 30 days: Mix of positive (😊 4 days) and neutral/negative (😔 3 days) — energy levels averaging 6.1/10. Slight improvement week-over-week.`,
      `💊 Medication adherence: ${adherence?.weekPercent ?? 88}% this week. ${adherence?.missedReasonBreakdown?.cost ? `Cost was cited ${adherence.missedReasonBreakdown.cost} time(s) as reason for missing doses — worth discussing.` : 'All misses were due to forgetting.'}`,
      labReport
        ? `🔬 Lab flags: ${labReport.values.filter((v) => v.status === 'RED').map((v) => `${v.name} (${v.result} ${v.unit})`).join(', ') || 'No RED values'} · ${labReport.values.filter((v) => v.status === 'YELLOW').map((v) => v.name).join(', ') || 'No YELLOW values'} flagged YELLOW.`
        : `🔬 No recent lab reports uploaded.`,
      asks.length
        ? `💬 Quick Ask history: Patient asked — "${asks[0].question.slice(0, 80)}…" ${asks[0].doctorReply ? '(replied)' : '(unanswered — review during visit)'}`
        : `💬 No Quick Ask questions this month.`,
      gutTags
        ? `🧬 Gut Tags from last visit: ${gutTags.tags.map((t) => GUT_TAG_LABELS[t as GutTagType].label).join(', ')}. ${gutTags.notes ?? ''}`
        : `🧬 No gut tags from previous visit.`,
    ],
    patientVersion: `Hi ${patient?.name?.split(' ')[0]}, your doctor has reviewed your recent check-ins and health data before today's visit. Your energy and mood have been ${adherence && adherence.weekPercent >= 80 ? 'good, and your medication adherence is excellent' : 'variable this month — let\'s talk about what\'s been going on'}. ${labReport && labReport.overallStatus === 'RED' ? 'Some of your recent test results need attention today.' : 'Your recent tests look mostly okay.'} Please share this screen with Dr. Sharma at the start of the appointment.`,
  };
};

export default function PreVisitBriefPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState<ReturnType<typeof generateMockBrief> | null>(null);
  const [viewMode, setViewMode] = useState<'doctor' | 'patient'>('doctor');

  const patient  = MOCK_PATIENTS.find((p) => p.id === patientId);
  const gutTags  = MOCK_GUT_TAGS.filter((g) => g.patientId === patientId).slice(-1)[0];

  useEffect(() => {
    // Simulate Claude API call
    const timer = setTimeout(() => {
      setBrief(generateMockBrief(patientId));
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [patientId]);

  if (!patient) return null;

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="bg-gradient-to-br from-[#1255CC] to-[#0D3FA6] px-5 pt-10 pb-8 rounded-b-3xl">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white/70 text-sm mb-4 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold font-heading">Pre-Visit Smart Brief</h1>
            <p className="text-blue-100 text-xs mt-0.5">{patient.name} · AI-generated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {loading ? (
          <div className="card p-8 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center">
                <Brain className="w-8 h-8 text-purple-500" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-900">Claude is analysing…</p>
              <p className="text-xs text-slate-500 mt-1">Reviewing check-ins, medicines, lab reports & gut tags</p>
            </div>
          </div>
        ) : brief && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* View toggle */}
            <div className="flex gap-1">
              {(['doctor', 'patient'] as const).map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                    viewMode === mode ? 'bg-[#1A6BFF] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'
                  }`}>
                  {mode === 'doctor' ? '👨‍⚕️ Doctor View' : '🤲 Patient View'}
                </button>
              ))}
            </div>

            {viewMode === 'doctor' ? (
              <>
                {/* Gut tags summary */}
                {gutTags && (
                  <div className="card p-4 border-purple-200 bg-purple-50">
                    <p className="text-xs font-bold text-purple-700 mb-2">Gut Tags from Last Visit</p>
                    <div className="flex flex-wrap gap-2">
                      {gutTags.tags.map((tag) => {
                        const info = GUT_TAG_LABELS[tag as GutTagType];
                        return (
                          <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-white border border-purple-200 text-purple-700 font-medium">
                            {info.icon} {info.label}
                          </span>
                        );
                      })}
                    </div>
                    {gutTags.notes && (
                      <p className="text-xs text-purple-600 mt-2 italic">"{gutTags.notes}"</p>
                    )}
                  </div>
                )}

                {/* 5-bullet brief */}
                <div className="card p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">5-Point Clinical Brief</p>
                  <div className="space-y-3">
                    {brief.doctorBullets.map((bullet, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <span className="text-xs font-bold text-[#1A6BFF] bg-blue-50 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed">{bullet}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Patient-facing version */
              <div className="card p-5 border-[#1A6BFF]/20 bg-blue-50/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-[#1A6BFF]/10 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-[#1A6BFF]" />
                  </div>
                  <p className="font-bold text-slate-900 text-sm">Show This to Dr. Sharma</p>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{brief.patientVersion}</p>
                <div className="mt-4 p-3 bg-white rounded-xl border border-[#1A6BFF]/20">
                  <p className="text-[10px] font-bold text-[#1A6BFF] uppercase mb-1">Today's Visit</p>
                  <p className="text-sm font-semibold text-slate-900">{patient.name}</p>
                  <p className="text-xs text-slate-500">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push(`/doctor/patients/${patientId}/gut-tags`)}
                className="btn-secondary text-sm flex items-center justify-center gap-1"
              >
                Update Gut Tags
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary text-sm flex items-center justify-center gap-1"
              >
                Share Brief
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Zap } from 'lucide-react';
import { MOCK_PATIENTS, MOCK_GUT_TAGS } from '@/lib/mockData';
import { GUT_TAG_LABELS, type GutTagType } from '@/lib/types';

const ALL_TAGS: GutTagType[] = [
  'looks_tired', 'scared', 'home_stress', 'cost_issue', 'needs_handholding', 'improving_fast',
];

const TAG_COLORS: Record<GutTagType, { bg: string; border: string; selected: string }> = {
  looks_tired:       { bg: 'bg-blue-50',   border: 'border-blue-200',   selected: 'bg-[#1A6BFF] text-white border-[#1A6BFF]' },
  scared:            { bg: 'bg-purple-50', border: 'border-purple-200', selected: 'bg-purple-600 text-white border-purple-600' },
  home_stress:       { bg: 'bg-orange-50', border: 'border-orange-200', selected: 'bg-orange-500 text-white border-orange-500' },
  cost_issue:        { bg: 'bg-yellow-50', border: 'border-yellow-200', selected: 'bg-yellow-500 text-white border-yellow-500' },
  needs_handholding: { bg: 'bg-green-50',  border: 'border-green-200',  selected: 'bg-[#00C48C] text-white border-[#00C48C]' },
  improving_fast:    { bg: 'bg-teal-50',   border: 'border-teal-200',   selected: 'bg-teal-500 text-white border-teal-500' },
};

export default function GutTagsPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const patient = MOCK_PATIENTS.find((p) => p.id === patientId);
  const existing = MOCK_GUT_TAGS.filter((g) => g.patientId === patientId).slice(-1)[0];

  const [selectedTags, setSelectedTags] = useState<GutTagType[]>(existing?.tags ?? []);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saved, setSaved] = useState(false);

  const toggleTag = (tag: GutTagType) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    // In production: POST to /api/gut-tags/:patientId
    setSaved(true);
    setTimeout(() => router.back(), 1800);
  };

  if (!patient) return null;

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1A6BFF] to-[#764CF7] px-5 pt-10 pb-8 rounded-b-3xl">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white/70 text-sm mb-4 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold text-white">
            {patient.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-white text-xl font-bold font-heading">Doctor&apos;s Gut</h1>
            <p className="text-blue-100 text-xs mt-0.5">{patient.name} · Post-visit instinct tags</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Explanation */}
        <div className="card p-4 bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4.5 h-4.5 text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-purple-900 text-sm">What are Gut Tags?</p>
              <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                Tap what your instinct says after this visit. These tags shape the tone of AI-generated reminders, pre-visit briefs, and quick ask suggestions — making every touchpoint feel personal.
              </p>
            </div>
          </div>
        </div>

        {/* Tag Grid */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Select All That Apply</p>
          <div className="grid grid-cols-2 gap-3">
            {ALL_TAGS.map((tag) => {
              const info     = GUT_TAG_LABELS[tag];
              const colors   = TAG_COLORS[tag];
              const isSelected = selectedTags.includes(tag);

              return (
                <motion.button
                  key={tag}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => toggleTag(tag)}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all duration-200 ${
                    isSelected ? colors.selected : `${colors.bg} ${colors.border} text-slate-700`
                  }`}
                >
                  <span className="text-3xl">{info.icon}</span>
                  <span className="text-xs font-bold text-center leading-tight">{info.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Doctor&apos;s Private Notes (Optional)</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Patient seemed stressed about finances. Son recently lost job. Be gentle in messaging this month."
            rows={3}
            className="input-field resize-none text-sm"
          />
        </div>

        {/* How it affects AI */}
        {selectedTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 border-[#1A6BFF]/20 bg-blue-50/50"
          >
            <p className="text-xs font-bold text-[#1A6BFF] mb-2">How Claude will use these tags:</p>
            <ul className="space-y-1.5">
              {selectedTags.includes('cost_issue') && (
                <li className="text-xs text-slate-600">💸 Reminders will avoid urgency about paid services, focus on what&apos;s free</li>
              )}
              {selectedTags.includes('scared') && (
                <li className="text-xs text-slate-600">😰 Pre-visit brief will start with reassurance, not numbers</li>
              )}
              {selectedTags.includes('needs_handholding') && (
                <li className="text-xs text-slate-600">🤝 Messages will be warmer, more step-by-step</li>
              )}
              {selectedTags.includes('improving_fast') && (
                <li className="text-xs text-slate-600">🚀 Reminders will celebrate progress, keep motivation high</li>
              )}
              {selectedTags.includes('looks_tired') && (
                <li className="text-xs text-slate-600">😴 Pre-visit brief will flag fatigue as a clinical concern</li>
              )}
              {selectedTags.includes('home_stress') && (
                <li className="text-xs text-slate-600">🏠 Claude will suggest lifestyle support resources</li>
              )}
            </ul>
          </motion.div>
        )}

        {/* Save */}
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-4 text-center"
            >
              <div className="text-4xl mb-2">✅</div>
              <p className="font-bold text-slate-900">Gut tags saved!</p>
              <p className="text-sm text-slate-500 mt-1">Claude will use these for {patient.name}&apos;s next interaction</p>
            </motion.div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={selectedTags.length === 0}
              className={`w-full py-3.5 rounded-xl font-semibold transition-all text-[15px] ${
                selectedTags.length > 0
                  ? 'bg-gradient-to-r from-[#1A6BFF] to-[#764CF7] text-white shadow-lg'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              Save Gut Tags ({selectedTags.length})
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

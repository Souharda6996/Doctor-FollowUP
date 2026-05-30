'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, User, Phone, MapPin, Heart, Brain, Moon, Utensils, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS = ['Basic Info', 'Symptoms', 'Lifestyle', 'Review'];

export default function AddPatientPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', age: '', gender: 'female', phone: '', email: '', address: '',
    caseType: 'chronic', chiefComplaint: '', language: 'en',
    physicalSymptoms: '', mentalState: '', emotionalState: '', sleepPattern: '',
    sleepQuality: 'moderate', foodPreferences: '', foodAversions: '', triggers: '',
    notes: '',
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/doctor/patients', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save patient');
      }
      router.refresh(); // Clear Next.js App Router cache
      router.push('/doctor/patients');
    } catch (e: any) {
      alert(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900">New Patient Case</h1>
            <p className="text-xs text-slate-500">Step {step} of 4 — {STEP_LABELS[step - 1]}</p>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
          ))}
        </div>
      </header>

      <div className="p-5 pb-32">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="font-bold text-slate-900">Basic Information</h2>
              </div>
              <FieldGroup label="Full Name *">
                <input className="input-field" placeholder="Patient's full name" value={form.name} onChange={(e) => update('name', e.target.value)} />
              </FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Age *">
                  <input className="input-field" type="number" placeholder="Age" value={form.age} onChange={(e) => update('age', e.target.value)} />
                </FieldGroup>
                <FieldGroup label="Gender *">
                  <select className="input-field" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </FieldGroup>
              </div>
              <FieldGroup label="Phone *">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input className="input-field pl-10" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                </div>
              </FieldGroup>
              <FieldGroup label="Email">
                <input className="input-field" type="email" placeholder="Optional" value={form.email} onChange={(e) => update('email', e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Address">
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <textarea className="input-field pl-10 resize-none" rows={2} placeholder="City, State" value={form.address} onChange={(e) => update('address', e.target.value)} />
                </div>
              </FieldGroup>
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Case Type">
                  <select className="input-field" value={form.caseType} onChange={(e) => update('caseType', e.target.value)}>
                    <option value="chronic">Chronic</option>
                    <option value="acute">Acute</option>
                  </select>
                </FieldGroup>
                <FieldGroup label="Language">
                  <select className="input-field" value={form.language} onChange={(e) => update('language', e.target.value)}>
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="bn">Bengali</option>
                  </select>
                </FieldGroup>
              </div>
              <FieldGroup label="Chief Complaint *">
                <textarea className="input-field resize-none" rows={3} placeholder="Main reason for consultation..." value={form.chiefComplaint} onChange={(e) => update('chiefComplaint', e.target.value)} />
              </FieldGroup>
            </div>
          </motion.div>
        )}

        {/* Step 2: Symptoms */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-red-500" />
                </div>
                <h2 className="font-bold text-slate-900">Physical Symptoms</h2>
              </div>
              <FieldGroup label="Physical Symptoms (comma separated)">
                <textarea className="input-field resize-none" rows={3} placeholder="e.g. Headache, joint pain, fatigue..." value={form.physicalSymptoms} onChange={(e) => update('physicalSymptoms', e.target.value)} />
              </FieldGroup>
              <div className="flex items-center gap-2 pt-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-500" />
                </div>
                <h2 className="font-bold text-slate-900">Mental & Emotional State</h2>
              </div>
              <FieldGroup label="Mental State">
                <textarea className="input-field resize-none" rows={2} placeholder="e.g. Anxious, overthinking..." value={form.mentalState} onChange={(e) => update('mentalState', e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Emotional State">
                <textarea className="input-field resize-none" rows={2} placeholder="e.g. Depressed, irritable, grief..." value={form.emotionalState} onChange={(e) => update('emotionalState', e.target.value)} />
              </FieldGroup>
            </div>
          </motion.div>
        )}

        {/* Step 3: Lifestyle */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Moon className="w-4 h-4 text-indigo-500" />
                </div>
                <h2 className="font-bold text-slate-900">Sleep Patterns</h2>
              </div>
              <FieldGroup label="Sleep Pattern">
                <input className="input-field" placeholder="e.g. 6 hours, wakes at 3am..." value={form.sleepPattern} onChange={(e) => update('sleepPattern', e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Sleep Quality">
                <select className="input-field" value={form.sleepQuality} onChange={(e) => update('sleepQuality', e.target.value)}>
                  <option value="good">Good</option>
                  <option value="moderate">Moderate</option>
                  <option value="poor">Poor</option>
                </select>
              </FieldGroup>
              <div className="flex items-center gap-2 pt-2">
                <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-green-500" />
                </div>
                <h2 className="font-bold text-slate-900">Food & Triggers</h2>
              </div>
              <FieldGroup label="Food Preferences (comma separated)">
                <input className="input-field" placeholder="e.g. Salty, cold drinks, meat..." value={form.foodPreferences} onChange={(e) => update('foodPreferences', e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Food Aversions (comma separated)">
                <input className="input-field" placeholder="e.g. Spicy, coffee, sweets..." value={form.foodAversions} onChange={(e) => update('foodAversions', e.target.value)} />
              </FieldGroup>
              <div className="flex items-center gap-2 pt-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-orange-500" />
                </div>
                <h2 className="font-bold text-slate-900">Aggravating Factors</h2>
              </div>
              <FieldGroup label="Triggers (comma separated)">
                <textarea className="input-field resize-none" rows={2} placeholder="e.g. Cold weather, stress, bright light..." value={form.triggers} onChange={(e) => update('triggers', e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Additional Notes">
                <textarea className="input-field resize-none" rows={3} placeholder="Any other relevant information..." value={form.notes} onChange={(e) => update('notes', e.target.value)} />
              </FieldGroup>
            </div>
          </motion.div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div className="card p-5 space-y-3">
              <h2 className="font-bold text-slate-900 text-base mb-3">Review Case Summary</h2>
              <ReviewRow label="Name" value={form.name || '—'} />
              <ReviewRow label="Age / Gender" value={`${form.age || '—'} / ${form.gender}`} />
              <ReviewRow label="Phone" value={form.phone || '—'} />
              <ReviewRow label="Case Type" value={form.caseType} />
              <ReviewRow label="Chief Complaint" value={form.chiefComplaint || '—'} />
              <ReviewRow label="Physical Symptoms" value={form.physicalSymptoms || '—'} />
              <ReviewRow label="Mental State" value={form.mentalState || '—'} />
              <ReviewRow label="Sleep Quality" value={form.sleepQuality} />
              <ReviewRow label="Food Preferences" value={form.foodPreferences || '—'} />
              <ReviewRow label="Triggers" value={form.triggers || '—'} />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">🧠 AI will analyze this case</p>
              <p className="text-xs text-blue-600">After saving, the AI engine will generate a clinical summary and flag any patterns or risk factors.</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:ml-64 bg-white border-t border-slate-200 p-4 flex gap-3">
        {step > 1 && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="btn-secondary flex-1"
          >
            Back
          </motion.button>
        )}
        {step < 4 ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setStep((s) => (s + 1) as Step)}
            className="btn-primary flex-1"
          >
            Continue →
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Patient Case
              </>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-xs text-slate-800 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

'use client';

import React from 'react';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, Mic, ChevronRight, Check,
  Smile, Frown, Meh
} from 'lucide-react';

const COMMON_SYMPTOMS = [
  'Headache', 'Joint Pain', 'Fatigue', 'Acidity', 
  'Anxiety', 'Nausea', 'Cough', 'Skin Itch'
];

export default function SymptomLogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [severity, setSeverity] = useState(5);
  const [mood, setMood] = useState('neutral');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s]
    );
  };

  const handleFinish = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('medifollowup_token');
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patient_id: user.id,
          mood: mood === 'happy' ? '😊' : mood === 'sad' ? '😔' : '😐',
          energy: Math.max(1, 11 - severity), // inverse relation, severity 10 = energy 1
          symptoms: selectedSymptoms,
          notes
        })
      });
      if (!res.ok) throw new Error('Failed to log symptom');
      router.push('/patient/home');
    } catch (e) {
      console.error(e);
      alert('Failed to log symptom');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC]">
      <header className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-bold text-slate-900">How do you feel?</h1>
        <div className="w-9" /> {/* Spacer */}
      </header>

      <div className="flex-1 p-6 flex flex-col overflow-y-auto">
        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Overall Severity</h2>
              <p className="text-xs text-slate-500">Rate your general discomfort today</p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <span className={`text-6xl font-bold ${
                severity > 7 ? 'text-red-500' : severity > 4 ? 'text-yellow-500' : 'text-green-500'
              }`}>{severity}</span>
              <input 
                type="range" min="1" max="10" step="1"
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
              />
              <div className="w-full flex justify-between text-[10px] font-bold text-slate-400 px-1 uppercase tracking-widest">
                <span>Excellent</span>
                <span>Mild</span>
                <span>Severe</span>
              </div>
            </div>

            <div className="pt-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Select Symptoms</h3>
              <div className="grid grid-cols-2 gap-2">
                {COMMON_SYMPTOMS.map(s => (
                  <button 
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                      selectedSymptoms.includes(s) 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="space-y-10"
          >
            <div className="text-center">
              <h2 className="text-lg font-bold text-slate-900 mb-2">How is your mood?</h2>
              <p className="text-xs text-slate-500">Homeopathy tracks emotional states carefully</p>
            </div>

            <div className="flex justify-between items-center px-4">
              <MoodButton 
                active={mood === 'sad'} 
                onClick={() => setMood('sad')} 
                icon={Frown} 
                label="Low" 
                color="text-blue-500" 
              />
              <MoodButton 
                active={mood === 'neutral'} 
                onClick={() => setMood('neutral')} 
                icon={Meh} 
                label="Neutral" 
                color="text-slate-400" 
              />
              <MoodButton 
                active={mood === 'happy'} 
                onClick={() => setMood('happy')} 
                icon={Smile} 
                label="Great" 
                color="text-green-500" 
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Voice or Text Notes</h3>
                <button 
                  onClick={() => setIsRecording(!isRecording)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold ${
                    isRecording ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Mic className="w-3 h-3" />
                  {isRecording ? 'Recording...' : 'Record Voice'}
                </button>
              </div>
              <textarea 
                className="w-full bg-white border border-slate-200 rounded-3xl p-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                rows={4}
                placeholder="Describe your symptoms in detail. Mention things like triggers or when it feels better/worse..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-100">
        {step < 2 ? (
          <button 
            onClick={() => setStep(step + 1)}
            className="w-full btn-primary !rounded-3xl flex items-center justify-center gap-2"
          >
            Next Step <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={handleFinish}
            disabled={loading}
            className={`w-full bg-green-600 text-white font-bold py-4 rounded-3xl flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 active:scale-95 transition-all ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? 'Submitting...' : <>Submit Entry <Check className="w-5 h-5" /></>}
          </button>
        )}
      </div>
    </div>
  );
}

function MoodButton({ active, onClick, icon: Icon, label, color }: {
  active: boolean; onClick: () => void; icon: React.ElementType; label: string; color: string;
}) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2"
    >
      <motion.div 
        animate={{ scale: active ? 1.2 : 1 }}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
          active ? 'bg-white shadow-xl shadow-slate-200' : 'bg-slate-50'
        }`}
      >
        <Icon className={`w-8 h-8 ${active ? color : 'text-slate-300'}`} />
      </motion.div>
      <span className={`text-[10px] font-bold ${active ? 'text-slate-900' : 'text-slate-400'}`}>{label}</span>
    </button>
  );
}

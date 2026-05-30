'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Calendar, Phone, MapPin, Pill, Activity,
  MessageSquare, Edit, ChevronDown, ChevronUp,
  Clock, TrendingUp, FileText
} from 'lucide-react';
import { getStatusColor, formatDate, formatRelativeTime } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';

type Tab = 'overview' | 'history' | 'remedies' | 'timeline' | 'logs';

export default function PatientCaseFile() {
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showAIInsights, setShowAIInsights] = useState(false);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const res = await fetch(`/api/doctor/patients/${patientId}`, {
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
  }, [token, patientId]);

  if (loading) return <div className="p-5 space-y-4"><SkeletonCard lines={4} /><SkeletonCard lines={6} /></div>;
  if (error) return <div className="p-5"><ErrorState message={error} /></div>;
  if (!data || !data.patient) return (
    <div className="flex items-center justify-center min-h-screen text-slate-500">
      Patient not found. <Link href="/doctor/patients" className="text-blue-600 ml-2">Go back</Link>
    </div>
  );

  const { patient, caseHistory, prescriptions, logs, timeline } = data;
  const user = patient.users;

  const tabs: { key: Tab; label: string; icon: typeof Activity }[] = [
    { key: 'overview', label: 'Overview',      icon: Activity  },
    { key: 'history',  label: 'Case History',  icon: FileText  },
    { key: 'remedies', label: 'Prescriptions', icon: Pill      },
    { key: 'timeline', label: 'Timeline',      icon: Clock     },
    { key: 'logs',     label: 'Symptom Logs',  icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Header */}
      <div className="gradient-header px-5 pt-5 pb-16 relative">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white/80 text-sm mb-4 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-2xl font-bold text-white uppercase">
            {user?.display_name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{user?.display_name || 'Patient'}</h1>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusColor(patient.status)}`}>
                {patient.status}
              </span>
            </div>
            <p className="text-blue-100 text-sm mt-0.5 capitalize">{patient.case_type} Case</p>
            <p className="text-blue-200 text-xs mt-1 flex items-center gap-1">
              <Phone className="w-3 h-3" /> {user?.phone}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 -mt-8 mx-0 shadow-sm">
        <div className="flex overflow-x-auto scrollbar-none px-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Chief Complaint */}
            <div className="card p-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chief Complaint</h3>
              <p className="text-slate-800 text-sm font-medium">{patient.chief_complaint || 'No complaint recorded'}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{prescriptions.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Prescriptions</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{logs.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Symptom Logs</p>
              </div>
            </div>

            {/* Patient Info */}
            <div className="card p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Details</h3>
              <div className="space-y-2 text-sm">
                {user?.address && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {user.address}
                  </div>
                )}
                {user?.created_at && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  Registered: {formatDate(user.created_at)}
                </div>
                )}
                {patient.last_checkin && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  Last checkin: {formatRelativeTime(patient.last_checkin)}
                </div>
                )}
                {patient.next_follow_up && (
                  <div className="flex items-center gap-2 text-blue-600 font-medium">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    Next follow-up: {formatDate(patient.next_follow_up)}
                  </div>
                )}
              </div>
            </div>

            {/* AI Insights Panel */}
            <div className="card border-purple-200 overflow-hidden">
              <button
                onClick={() => setShowAIInsights(!showAIInsights)}
                className="w-full p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                    <span className="text-lg">🧠</span>
                  </div>
                  <span className="font-semibold text-slate-900 text-sm">AI Case Insights</span>
                </div>
                {showAIInsights ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {showAIInsights && caseHistory[0]?.ai_summary && (
                <div className="px-4 pb-4 border-t border-purple-100">
                  <div className="bg-purple-50 rounded-xl p-3 mt-3">
                    <p className="text-sm text-purple-900 leading-relaxed">{caseHistory[0].ai_summary}</p>
                  </div>
                  <Link href={`/doctor/ai-assistant?patient=${patientId}`}>
                    <motion.button whileTap={{ scale: 0.97 }} className="mt-3 w-full text-center text-purple-700 text-sm font-semibold bg-purple-50 border border-purple-200 rounded-xl py-2.5">
                      Ask AI about this patient →
                    </motion.button>
                  </Link>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Link href={`/doctor/patients/${patientId}/edit`}>
                <motion.button whileTap={{ scale: 0.97 }} className="w-full btn-secondary flex items-center justify-center gap-2 text-sm">
                  <Edit className="w-4 h-4" /> Edit Case
                </motion.button>
              </Link>
              <Link href={`/doctor/ai-assistant?patient=${patientId}`}>
                <motion.button whileTap={{ scale: 0.97 }} className="w-full btn-primary flex items-center justify-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4" /> AI Consult
                </motion.button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* CASE HISTORY TAB */}
        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {caseHistory.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No case history recorded yet.</p>}
            {caseHistory.map((ch: any) => (
              <div key={ch.id} className="card p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-sm">Case Taken: {formatDate(ch.date)}</h3>
                </div>
                <Section title="Physical Symptoms" items={ch.physical_symptoms || []} />
                <InfoRow label="Mental State" value={ch.mental_state || ''} />
                <InfoRow label="Emotional State" value={ch.emotional_state || ''} />
                <InfoRow label="Sleep" value={`${ch.sleep_pattern || ''} (${ch.sleep_quality || ''})`} />
                <Section title="Food Preferences" items={ch.food_preferences || []} color="green" />
                <Section title="Food Aversions" items={ch.food_aversions || []} color="red" />
                <Section title="Triggers" items={ch.triggers || []} color="yellow" />
                {ch.doctor_notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-blue-700 mb-1">Doctor Notes</p>
                    <p className="text-sm text-blue-900">{ch.doctor_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* PRESCRIPTIONS TAB */}
        {activeTab === 'remedies' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {prescriptions.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No prescriptions added yet.</p>}
            {prescriptions.map((remedy: any) => (
              <div key={remedy.id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900">{remedy.medicine_name}</h3>
                    <p className="text-sm text-purple-600 font-semibold">{remedy.potency}</p>
                  </div>
                  {remedy.status && (
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      remedy.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>{remedy.status}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <LabelValue label="Dosage" value={remedy.dosage} />
                  <LabelValue label="Frequency" value={remedy.frequency} />
                  <LabelValue label="Duration" value={`${remedy.duration_days} days`} />
                  <LabelValue label="Start Date" value={formatDate(remedy.start_date)} />
                </div>
                {remedy.instructions && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 font-semibold mb-1">Instructions</p>
                    <p className="text-xs text-slate-700">{remedy.instructions}</p>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {timeline.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No timeline events yet.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-200" />
                <div className="space-y-4 pl-12">
                  {timeline.map((event: any) => (
                    <div key={event.id} className="relative">
                      <div className={`absolute -left-7 top-1 w-4 h-4 rounded-full border-2 border-white ${
                        event.type === 'prescription' ? 'bg-purple-500' :
                        event.type === 'appointment' ? 'bg-blue-500' :
                        event.type === 'case' ? 'bg-green-500' :
                        event.type === 'report' ? 'bg-orange-500' : 'bg-slate-400'
                      }`} />
                      <div className="card p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-slate-900">{event.title}</p>
                          <p className="text-[10px] text-slate-400">{formatDate(event.date)}</p>
                        </div>
                        <p className="text-xs text-slate-600">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* SYMPTOM LOGS TAB */}
        {activeTab === 'logs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {logs.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No symptom logs yet.</p>}
            {logs.map((log: any) => (
              <div key={log.id} className="card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{formatDate(log.check_date)}</span>
                </div>
                {log.symptoms && log.symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {log.symptoms.map((s: string) => (
                      <span key={s} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}
                {log.notes && <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2">{log.notes}</p>}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Section({ title, items, color = 'blue' }: { title: string; items: string[]; color?: string }) {
  const colorMap: Record<string, string> = { blue: 'bg-blue-100 text-blue-800', green: 'bg-green-100 text-green-800', red: 'bg-red-100 text-red-800', yellow: 'bg-yellow-100 text-yellow-800' };
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className={`text-xs px-2.5 py-1 rounded-full font-medium ${colorMap[color] ?? colorMap.blue}`}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  );
}

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2">
      <p className="text-[10px] font-semibold text-slate-400 uppercase">{label}</p>
      <p className="text-xs font-medium text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}

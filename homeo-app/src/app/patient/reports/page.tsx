'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileText, AlertTriangle, TrendingUp, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import type { TrafficLight, LabValue } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';

function TrafficDot({ status, delay = 0 }: { status: TrafficLight; delay?: number }) {
  const color = status === 'GREEN' ? 'bg-[#00C48C]' : status === 'YELLOW' ? 'bg-[#FFB800]' : 'bg-[#FF4757]';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', damping: 15, stiffness: 300 }}
      className={`w-5 h-5 rounded-full border-2 border-white shadow-md ${color}`}
    />
  );
}

function TrafficLightDisplay({ values }: { values: LabValue[] }) {
  const counts = { GREEN: 0, YELLOW: 0, RED: 0 };
  values.forEach((v) => counts[v.status]++);
  return (
    <div className="flex items-center gap-3">
      {(['RED', 'YELLOW', 'GREEN'] as TrafficLight[]).map((s, i) => (
        <div key={s} className="flex flex-col items-center gap-1">
          <TrafficDot status={s} delay={i * 0.15} />
          <span className="text-[10px] font-bold text-slate-500">{counts[s]}</span>
        </div>
      ))}
    </div>
  );
}

function LabValueRow({ value, index }: { value: LabValue; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const color = value.status === 'GREEN' ? '#00C48C' : value.status === 'YELLOW' ? '#FFB800' : '#FF4757';
  const bg    = value.status === 'GREEN' ? 'bg-[#E6FBF4]' : value.status === 'YELLOW' ? 'bg-[#FFF8E6]' : 'bg-[#FFF0F1]';
  const border= value.status === 'GREEN' ? 'border-[#00C48C]/30' : value.status === 'YELLOW' ? 'border-[#FFB800]/30' : 'border-[#FF4757]/30';

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.25 }}
      className={`rounded-xl border overflow-hidden ${bg} ${border}`}
    >
      <button
        className="w-full text-left p-3 flex items-center gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">{value.name}</p>
          <p className="text-xs text-slate-500">Tap to see what this means</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-current/10 px-3 pb-3 pt-2"
          >
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-xl font-bold text-slate-900">{value.result}</span>
              <span className="text-sm text-slate-500">{value.unit}</span>
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full`} style={{ color, backgroundColor: `${color}20` }}>{value.status}</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{value.plain_english_explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const patientId = user?.patientId ?? 'p001';

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      try {
        const token = localStorage.getItem('medifollowup_token');
        const res = await fetch('/api/patient/reports', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        setReports(json.reports);
        if (json.reports.length > 0) {
          setActiveReport(json.reports[0].id);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const handleUpload = async (_file: File) => {
    setUploading(true);
    setUploadProgress(0);

    // Simulate file upload progress
    for (let p = 0; p <= 100; p += 10) {
      await new Promise((r) => setTimeout(r, 80));
      setUploadProgress(p);
    }
    setUploading(false);
    setAnalyzing(true);

    // Simulate Claude analysis
    await new Promise((r) => setTimeout(r, 2200));
    setAnalyzing(false);

    try {
      const token = localStorage.getItem('medifollowup_token');
      const formData = new FormData();
      formData.append('file', _file);
      formData.append('patientId', user?.id || '');

      const res = await fetch('/api/reports/analyze', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setReports((prev) => [data, ...prev]);
      setActiveReport(data.id);
    } catch (e) {
      console.error(e);
      alert('Failed to analyze report');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <div className="p-5 space-y-4 min-h-screen bg-[#F7F9FC]"><SkeletonCard lines={3} /><SkeletonCard lines={4} /><SkeletonCard lines={4} /></div>;
  if (error) return <div className="p-5"><ErrorState message={error} /></div>;

  const currentReport = reports.find((r) => r.id === activeReport);

  return (
    <div className="flex-1 flex flex-col bg-[#F7F9FC]">
      {/* Header */}
      <div className="gradient-header px-5 pt-10 pb-6 rounded-b-3xl">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white/70 text-sm mb-4 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-white text-2xl font-bold font-heading flex items-center gap-2">
          <FileText className="w-6 h-6" /> Report Analyzer
        </h1>
        <p className="text-blue-100 text-xs mt-1">Upload a lab report — AI explains it in plain language</p>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Upload card */}
        <div className="card p-5">
          <h2 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#1A6BFF]" /> Upload New Report
          </h2>

          {uploading && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Uploading…</span><span>{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  className="h-full bg-[#1A6BFF] rounded-full"
                />
              </div>
            </div>
          )}

          {analyzing && (
            <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl mb-3">
              <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="text-sm font-semibold text-purple-900">AI Analysing Report…</p>
                <p className="text-xs text-purple-600">Claude is extracting and classifying all values</p>
              </div>
            </div>
          )}

          <label className="block w-full border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#1A6BFF] transition-colors group">
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            <div className="text-3xl mb-2">📄</div>
            <p className="text-sm font-semibold text-slate-700 group-hover:text-[#1A6BFF]">Tap to upload</p>
            <p className="text-xs text-slate-400 mt-1">Photo or PDF · Blood test, urine, X-ray reports</p>
          </label>
        </div>

        {/* Report selector */}
        {reports.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveReport(r.id)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  activeReport === r.id
                    ? 'bg-[#1A6BFF] text-white border-[#1A6BFF]'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {new Date(r.report_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                {r.overall_status === 'RED' && ' 🔴'}
                {r.overall_status === 'YELLOW' && ' 🟡'}
                {r.overall_status === 'GREEN' && ' 🟢'}
              </button>
            ))}
          </div>
        )}

        {/* Current report */}
        {currentReport && (
          <motion.div
            key={currentReport.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Traffic light summary */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Report Traffic Light</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(currentReport.report_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <TrafficLightDisplay values={currentReport.values} />
              </div>

              <div className={`p-3 rounded-xl text-xs leading-relaxed ${
                currentReport.overall_status === 'RED'    ? 'bg-[#FFF0F1] border border-[#FF4757]/20 text-red-800' :
                currentReport.overall_status === 'YELLOW' ? 'bg-[#FFF8E6] border border-[#FFB800]/20 text-amber-800' :
                'bg-[#E6FBF4] border border-[#00C48C]/20 text-emerald-800'
              }`}>
                {currentReport.overall_status === 'RED' && <AlertTriangle className="w-3.5 h-3.5 inline-block mr-1" />}
                {currentReport.summary_text}
              </div>
            </div>

            {/* Individual values */}
            <div className="card p-4">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#1A6BFF]" /> Your Results
                <span className="text-[10px] font-normal text-slate-500">(tap each to expand)</span>
              </h3>
              <div className="space-y-2">
                {currentReport.values.map((v, i) => (
                  <LabValueRow key={v.name} value={v} index={i} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

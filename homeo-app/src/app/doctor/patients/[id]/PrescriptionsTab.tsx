'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Plus, X, Save, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function PrescriptionsTab({ prescriptions: initialPrescriptions, patientId }: { prescriptions: any[], patientId: string }) {
  const router = useRouter();
  const { token } = useAuth();
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: 'Ongoing',
    notes: '',
    times: { morning: true, afternoon: false, night: false }
  });

  const resetForm = () => {
    setForm({ name: '', dosage: '', frequency: '', duration: 'Ongoing', notes: '', times: { morning: true, afternoon: false, night: false } });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (rx: any) => {
    setForm({
      name: rx.name || '',
      dosage: rx.dosage || '',
      frequency: rx.frequency || '',
      duration: rx.duration || 'Ongoing',
      notes: rx.notes || '',
      times: {
        morning: rx.times?.includes('morning') || false,
        afternoon: rx.times?.includes('afternoon') || false,
        night: rx.times?.includes('night') || false,
      }
    });
    setEditingId(rx.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.dosage) return alert('Name and dosage are required');
    setSaving(true);
    
    const selectedTimes = Object.entries(form.times).filter(([_, v]) => v).map(([k]) => k);
    if (selectedTimes.length === 0) selectedTimes.push('morning');

    const payload = {
      name: form.name,
      dosage: form.dosage,
      frequency: form.frequency,
      duration: form.duration,
      notes: form.notes,
      times: selectedTimes
    };

    try {
      const url = editingId 
        ? `/api/doctor/patients/${patientId}/prescriptions/${editingId}`
        : `/api/doctor/patients/${patientId}/prescriptions`;
        
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error(await res.text());
      const { prescription } = await res.json();
      
      if (editingId) {
        setPrescriptions(prev => prev.map(p => p.id === editingId ? prescription : p));
      } else {
        setPrescriptions(prev => [prescription, ...prev]);
      }
      
      resetForm();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/prescriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prescription?')) return;
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/prescriptions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setPrescriptions(prev => prev.filter(p => p.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold text-slate-900 flex items-center gap-2"><Pill className="w-5 h-5 text-blue-500" /> Prescriptions</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add New
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="card p-4 space-y-3 mb-4 border-2 border-blue-100">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-slate-800">{editingId ? 'Edit Medicine' : 'Add Medicine'}</h3>
                <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
              <input className="input-field" placeholder="Medicine Name *" value={form.name} onChange={(e) => setForm(f => ({...f, name: e.target.value}))} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input-field" placeholder="Dosage (e.g. 500mg) *" value={form.dosage} onChange={(e) => setForm(f => ({...f, dosage: e.target.value}))} />
                <input className="input-field" placeholder="Frequency (e.g. Once daily)" value={form.frequency} onChange={(e) => setForm(f => ({...f, frequency: e.target.value}))} />
              </div>
              <input className="input-field" placeholder="Duration (e.g. 7 days, Ongoing)" value={form.duration} onChange={(e) => setForm(f => ({...f, duration: e.target.value}))} />
              
              <div className="pt-1">
                <p className="text-xs font-semibold text-slate-600 mb-2">Times of day</p>
                <div className="flex gap-3">
                  {['morning', 'afternoon', 'night'].map((time) => (
                    <label key={time} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="checkbox" checked={(form.times as any)[time]} onChange={(e) => setForm(f => ({ ...f, times: { ...f.times, [time]: e.target.checked } }))} className="rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                      <span className="capitalize text-slate-700">{time}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <textarea className="input-field resize-none" rows={2} placeholder="Instructions / Notes" value={form.notes} onChange={(e) => setForm(f => ({...f, notes: e.target.value}))} />
              
              <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-2.5 mt-2 flex justify-center items-center gap-2">
                {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Prescription</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {prescriptions.length === 0 && !showForm && <p className="text-slate-400 text-sm text-center py-8">No prescriptions added yet.</p>}
      
      <div className="space-y-3">
        {prescriptions.map((remedy) => (
          <div key={remedy.id} className={`card p-4 space-y-3 transition-opacity ${!remedy.is_active ? 'opacity-60 bg-slate-50' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`font-bold ${remedy.is_active ? 'text-slate-900' : 'text-slate-600 line-through'}`}>{remedy.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{remedy.dosage} • {remedy.frequency}</p>
              </div>
              <div className="flex gap-1">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${remedy.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  {remedy.is_active ? 'Active' : 'Stopped'}
                </span>
              </div>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {remedy.times?.map((t: string) => (
                <span key={t} className="text-[10px] uppercase font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 mt-2">
              <div className="text-slate-500">Duration: <span className="font-medium text-slate-700">{remedy.duration}</span></div>
              <div className="text-slate-500 text-right">Started: <span className="font-medium text-slate-700">{formatDate(remedy.start_date)}</span></div>
            </div>

            {remedy.notes && (
              <div className="bg-slate-50 rounded-lg p-2.5 mt-1 border border-slate-100">
                <p className="text-xs text-slate-600">{remedy.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => handleToggleStatus(remedy.id, remedy.is_active)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                {remedy.is_active ? 'Stop' : 'Resume'}
              </button>
              <button onClick={() => handleEdit(remedy)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                Edit
              </button>
              <button onClick={() => handleDelete(remedy.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

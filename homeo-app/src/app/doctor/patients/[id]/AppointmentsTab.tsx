'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, X, Save, Trash2, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function AppointmentsTab({ appointments: initialAppointments, patientId }: { appointments: any[], patientId: string }) {
  const router = useRouter();
  const { token } = useAuth();
  const [appointments, setAppointments] = useState(initialAppointments || []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    scheduled_date: '',
    scheduled_time: '09:00',
    type: 'follow-up',
    reason: '',
    status: 'scheduled',
    doctor_notes: ''
  });

  const resetForm = () => {
    setForm({ scheduled_date: '', scheduled_time: '09:00', type: 'follow-up', reason: '', status: 'scheduled', doctor_notes: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (apt: any) => {
    setForm({
      scheduled_date: apt.scheduled_date || '',
      scheduled_time: apt.scheduled_time ? apt.scheduled_time.substring(0, 5) : '09:00',
      type: apt.type || 'follow-up',
      reason: apt.reason || '',
      status: apt.status || 'scheduled',
      doctor_notes: apt.doctor_notes || ''
    });
    setEditingId(apt.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.scheduled_date) return alert('Date is required');
    setSaving(true);
    
    try {
      const url = editingId 
        ? `/api/doctor/patients/${patientId}/appointments/${editingId}`
        : `/api/doctor/patients/${patientId}/appointments`;
        
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      
      if (!res.ok) throw new Error(await res.text());
      const { appointment } = await res.json();
      
      if (editingId) {
        setAppointments(prev => prev.map(p => p.id === editingId ? appointment : p));
      } else {
        setAppointments(prev => [appointment, ...prev].sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()));
      }
      
      resetForm();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setAppointments(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold text-slate-900 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500" /> Appointments</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Schedule
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="card p-4 space-y-3 mb-4 border-2 border-blue-100">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-slate-800">{editingId ? 'Edit Appointment' : 'Schedule Appointment'}</h3>
                <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Date</label>
                  <input type="date" className="input-field mt-1" value={form.scheduled_date} onChange={(e) => setForm(f => ({...f, scheduled_date: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Time</label>
                  <input type="time" className="input-field mt-1" value={form.scheduled_time} onChange={(e) => setForm(f => ({...f, scheduled_time: e.target.value}))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Type</label>
                  <select className="input-field mt-1" value={form.type} onChange={(e) => setForm(f => ({...f, type: e.target.value}))}>
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="initial">Initial</option>
                  </select>
                </div>
                {editingId && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Status</label>
                    <select className="input-field mt-1" value={form.status} onChange={(e) => setForm(f => ({...f, status: e.target.value}))}>
                      <option value="scheduled">Scheduled</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="missed">Missed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Reason</label>
                <input className="input-field mt-1" placeholder="e.g. 1 Month review" value={form.reason} onChange={(e) => setForm(f => ({...f, reason: e.target.value}))} />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-600">Doctor Notes (Private)</label>
                <textarea className="input-field resize-none mt-1" rows={2} placeholder="Internal notes" value={form.doctor_notes} onChange={(e) => setForm(f => ({...f, doctor_notes: e.target.value}))} />
              </div>
              
              <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-2.5 mt-2 flex justify-center items-center gap-2">
                {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Appointment</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {appointments.length === 0 && !showForm && <p className="text-slate-400 text-sm text-center py-8">No appointments scheduled yet.</p>}
      
      <div className="space-y-3">
        {appointments.map((apt) => {
          const isPast = new Date(`${apt.scheduled_date}T${apt.scheduled_time}`) < new Date();
          return (
            <div key={apt.id} className={`card p-4 space-y-3 transition-opacity ${isPast && apt.status !== 'completed' ? 'border-red-100 bg-red-50/20' : ''} ${apt.status === 'completed' || apt.status === 'cancelled' ? 'opacity-60 bg-slate-50' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">{formatDate(apt.scheduled_date)}</h3>
                  <p className="text-sm font-semibold text-slate-600 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {apt.scheduled_time ? apt.scheduled_time.substring(0, 5) : 'TBD'}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  apt.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  apt.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                  apt.status === 'cancelled' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                  'bg-orange-50 text-orange-700 border-orange-200'
                }`}>
                  {apt.status}
                </span>
              </div>

              <div className="flex gap-2 text-xs">
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase font-semibold">{apt.type}</span>
                {apt.reason && <span className="text-slate-600 pt-0.5">{apt.reason}</span>}
              </div>

              {apt.doctor_notes && (
                <div className="bg-yellow-50 rounded-lg p-2 mt-1 border border-yellow-100">
                  <p className="text-[10px] font-bold text-yellow-700 uppercase mb-0.5">Doctor Notes</p>
                  <p className="text-xs text-yellow-900">{apt.doctor_notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
                {apt.status === 'scheduled' && (
                  <button onClick={() => handleUpdateStatus(apt.id, 'completed')} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100">
                    Mark Completed
                  </button>
                )}
                <button onClick={() => handleEdit(apt)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

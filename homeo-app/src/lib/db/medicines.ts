import { supabase } from '../supabase';

export async function getPatientMedicines(patientUserId: string) {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('patient_id', patientUserId)
    .eq('is_active', true);

  if (error) throw error;
  return data;
}

// Log a medicine action (taken or missed)
export async function logMedicineTaken(prescriptionId: string, patientUserId: string, slot: string, status: 'taken' | 'missed') {
  // We should call our API route so it can also update silence score using the server-side logic
  // But we can do it directly here if we want to rely on the client token.
  // The plan specified keeping the `/api/medicines/log` route for this.
  const res = await fetch('/api/medicines/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prescriptionId, slot, status })
  });
  
  if (!res.ok) throw new Error('Failed to log medicine');
  return await res.json();
}

export async function getMedicineAdherence(patientUserId: string, days = 7) {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);
  
  const { data, error } = await supabase
    .from('medicine_logs')
    .select('status')
    .eq('patient_id', patientUserId)
    .gte('logged_at', dateLimit.toISOString());

  if (error) throw error;
  if (!data || data.length === 0) return 100; // No data yet = assume good for now, or 0.

  const taken = data.filter(d => d.status === 'taken').length;
  return Math.round((taken / data.length) * 100);
}

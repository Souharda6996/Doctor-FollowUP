import { supabase } from '../supabase';

export async function submitCheckin(data: any) {
  // Use the API route to ensure token verification and server-side silence update
  const res = await fetch('/api/checkins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!res.ok) throw new Error('Failed to submit checkin');
  return await res.json();
}

export async function getPatientCheckins(patientUserId: string, limit = 7) {
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('patient_id', patientUserId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

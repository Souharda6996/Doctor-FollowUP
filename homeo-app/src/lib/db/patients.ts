import { supabase } from '../supabase';

export async function getDoctorPatients(doctorUserId: string) {
  // Assuming RLS ensures the doctor can only see their patients
  const { data, error } = await supabase
    .from('patient_profiles')
    .select(`
      *,
      users:user_id ( display_name, phone, avatar_url )
    `)
    .order('silence_days', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPatientById(userId: string) {
  const { data, error } = await supabase
    .from('patient_profiles')
    .select(`
      *,
      users:user_id ( display_name, phone, avatar_url, email, language_preference ),
      doctor:doctor_id ( users:user_id ( display_name, phone ) )
    `)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function computeDashboardStats(doctorUserId: string) {
  // In a real production app you'd ideally use an RPC function or edge function to aggregate.
  // We'll do multiple targeted queries.
  const [patients, appointments] = await Promise.all([
    supabase.from('patient_profiles').select('silence_days'),
    supabase.from('appointments').select('id, status, scheduled_at')
      .gte('scheduled_at', new Date().toISOString().split('T')[0])
      .lte('scheduled_at', new Date(Date.now() + 86400000).toISOString().split('T')[0])
  ]);

  const patientList = patients.data || [];
  const todayAppts = appointments.data?.filter(a => a.status === 'scheduled' || a.status === 'confirmed') || [];

  return {
    totalPatients: patientList.length,
    criticalPatients: patientList.filter(p => p.silence_days >= 7).length,
    todayFollowups: todayAppts.length
  };
}

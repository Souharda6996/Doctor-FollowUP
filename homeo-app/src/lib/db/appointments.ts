import { supabase } from '../supabase';

export async function getUpcomingAppointments() {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:patient_id (
        users:user_id ( display_name, phone, avatar_url )
      )
    `)
    .in('status', ['scheduled', 'confirmed', 'rescheduled'])
    .order('scheduled_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getPatientAppointments(patientUserId: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select(`*, doctor:doctor_id ( users:user_id ( display_name ) )`)
    .eq('patient_id', patientUserId)
    .order('scheduled_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateAppointmentStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

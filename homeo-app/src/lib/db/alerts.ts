import { supabase } from '../supabase';

export async function getDoctorAlerts(doctorUserId: string) {
  const { data, error } = await supabase
    .from('alerts')
    .select(`
      *,
      patient:patient_id (
        users:user_id ( display_name, avatar_url )
      )
    `)
    .eq('doctor_id', doctorUserId)
    .is('read_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function markAlertRead(alertId: string) {
  const { data, error } = await supabase
    .from('alerts')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

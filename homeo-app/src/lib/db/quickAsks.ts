import { supabase } from '../supabase';

export async function getPatientQuickAsks(patientUserId: string) {
  const { data, error } = await supabase
    .from('quick_asks')
    .select(`*, doctor:doctor_id ( users:user_id ( display_name ) )`)
    .eq('patient_id', patientUserId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getDoctorQuickAsks(doctorUserId: string) {
  const { data, error } = await supabase
    .from('quick_asks')
    .select(`*, patient:patient_id ( users:user_id ( display_name ) )`)
    .eq('doctor_id', doctorUserId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function submitQuickAsk(patientUserId: string, doctorUserId: string, question: string) {
  const { data, error } = await supabase
    .from('quick_asks')
    .insert({
      patient_id: patientUserId,
      doctor_id: doctorUserId,
      question,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function replyToQuickAsk(askId: string, reply: string) {
  const { data, error } = await supabase
    .from('quick_asks')
    .update({
      answer: reply,
      answered_at: new Date().toISOString(),
      status: 'answered'
    })
    .eq('id', askId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

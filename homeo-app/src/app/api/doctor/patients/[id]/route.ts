export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyFirebaseToken } from '@/lib/auth-utils';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decodedToken = await verifyFirebaseToken(req.headers.get('Authorization'));
    const supabase = getServiceSupabase();
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', decodedToken.uid)
      .single();

    if (userError || !user) throw new Error('User not found in internal DB');
    const doctorId = user.id;
    const patientId = params.id;

    // Verify doctor-patient relationship
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('*, users:user_id(*)')
      .eq('user_id', patientId)
      .eq('doctor_id', doctorId)
      .single();

    if (profileError || !patientProfile) throw new Error('Patient not found or unauthorized');

    // Fetch case history
    const { data: caseHistory } = await supabase
      .from('case_history')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false });

    // Fetch prescriptions
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', patientId)
      .order('start_date', { ascending: false });

    // Fetch checkins (Symptom Logs)
    const { data: checkins } = await supabase
      .from('checkins')
      .select('*')
      .eq('patient_id', patientId)
      .order('check_date', { ascending: false });

    // Fetch timeline
    const { data: timeline } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false });

    // Fetch appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('scheduled_date', { ascending: false });

    return NextResponse.json({
      patient: patientProfile,
      caseHistory: caseHistory || [],
      prescriptions: prescriptions || [],
      logs: checkins || [],
      timeline: timeline || [],
      appointments: appointments || []
    });

  } catch (error: any) {
    console.error('Doctor patient API error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

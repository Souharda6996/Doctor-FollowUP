export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyFirebaseToken } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifyFirebaseToken(req.headers.get('Authorization'));
    const supabase = getServiceSupabase();
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', decodedToken.uid)
      .single();

    if (userError || !user) throw new Error('User not found in internal DB');
    const patientId = user.id;

    // Next appointment
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(1);

    // Active prescriptions
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active');

    // Today's medicine logs
    const today = new Date().toISOString().split('T')[0];
    const { data: todayLogs } = await supabase
      .from('medicine_logs')
      .select('*')
      .eq('patient_id', patientId)
      .eq('log_date', today);

    // Recent checkins
    const { data: checkins } = await supabase
      .from('checkins')
      .select('*')
      .eq('patient_id', patientId)
      .order('check_date', { ascending: false })
      .limit(5);

    return NextResponse.json({
      nextAppt: appointments && appointments.length > 0 ? appointments[0] : null,
      patientMeds: prescriptions || [],
      todayLogs: todayLogs || [],
      recentCheckins: checkins || []
    });

  } catch (error: any) {
    console.error('Patient dashboard API error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

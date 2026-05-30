export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyFirebaseToken } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifyFirebaseToken(req.headers.get('Authorization'));
    // Get the internal doctor UUID
    const supabase = getServiceSupabase();
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', decodedToken.uid)
      .single();

    if (userError || !user) throw new Error('User not found in internal DB');
    const doctorId = user.id;

    // Fetch alerts
    const { data: alerts } = await supabase
      .from('alerts')
      .select('*, patient:patient_id(users:user_id(display_name, avatar_url))')
      .eq('doctor_id', doctorId)
      .is('read_at', null)
      .order('created_at', { ascending: false });

    // Fetch patients
    const { data: patients, error: patientsError } = await supabase
      .from('patient_profiles')
      .select(`
        user_id,
        status,
        case_type,
        silence_days,
        last_checkin,
        chief_complaint,
        users:user_id(display_name, phone, avatar_url)
      `)
      .eq('doctor_id', doctorId);
      
    if (patientsError) {
      console.error('Error fetching patients:', patientsError);
    }

    // Fetch today's appointments
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    const { data: followUps } = await supabase
      .from('appointments')
      .select('*, patient:patient_id(users:user_id(display_name))')
      .eq('doctor_id', doctorId)
      .gte('scheduled_at', today)
      .lt('scheduled_at', tomorrow)
      .order('scheduled_at', { ascending: true });

    // Fingerprint alerts
    const fingerprintAlerts = alerts?.filter(a => a.type === 'fingerprint') || [];

    // Dashboard stats
    const totalPatients = patients?.length || 0;
    const criticalPatients = patients?.filter(p => p.status === 'critical' || p.silence_days >= 7).length || 0;
    const improvingPatients = patients?.filter(p => p.status === 'improving').length || 0;
    const todayFollowUps = followUps?.length || 0;

    return NextResponse.json({
      alerts: alerts || [],
      patients: patients || [],
      followUps: followUps || [],
      fingerprintAlerts,
      stats: {
        totalPatients,
        criticalPatients,
        improvingPatients,
        todayFollowUps,
        missedFollowUps: 0
      }
    });

  } catch (error: any) {
    console.error('Doctor dashboard API error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

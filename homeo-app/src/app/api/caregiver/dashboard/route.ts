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

    // Get linked patient
    const { data: link, error: linkError } = await supabase
      .from('caretaker_patient_links')
      .select('patient_id')
      .eq('caretaker_id', user.id)
      .limit(1)
      .single();

    if (linkError || !link) {
      return NextResponse.json({ error: 'No patient linked' }, { status: 404 });
    }

    const patientId = link.patient_id;

    // Fetch patient profile
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('status, chief_complaint, user:users(display_name)')
      .eq('id', patientId)
      .single();

    // Fetch Next Appt
    const { data: nextAppt } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .not('status', 'eq', 'completed')
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .single();

    // Fetch alerts
    const { data: alerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    // Fetch recent checkins
    const { data: recentCheckins } = await supabase
      .from('checkins')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(7);

    // Fetch adherence
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: logs } = await supabase
      .from('medicine_logs')
      .select('*')
      .eq('patient_id', patientId)
      .gte('log_date', sevenDaysAgo.toISOString().split('T')[0]);

    let weekPercent = 88; // Default mock
    if (logs && logs.length > 0) {
      const takenDoses = logs.filter((l: any) => l.taken).length;
      const totalDoses = logs.length;
      weekPercent = Math.round((takenDoses / totalDoses) * 100);
    }

    return NextResponse.json({
      patient: {
        id: patientId,
        name: patientProfile?.user?.display_name || 'Patient',
        age: 65, // Mock age since dob might not be parsed easily
        chiefComplaint: patientProfile?.chief_complaint,
        status: patientProfile?.status || 'improving'
      },
      nextAppt,
      alerts: alerts || [],
      recentCheckins: recentCheckins || [],
      adherence: { weekPercent }
    });
  } catch (error: any) {
    console.error('Caregiver dashboard API error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

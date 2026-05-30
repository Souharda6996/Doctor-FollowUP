import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const doctorId = decodedToken.uid;
    const supabase = getServiceSupabase();

    // 1. Get total patients
    const { count: totalPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId);

    // 2. Get today's and upcoming appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('status')
      .eq('doctor_id', doctorId);
    
    const completedAppointments = appointments?.filter(a => a.status === 'completed').length || 0;
    const upcomingAppointments = appointments?.filter(a => a.status !== 'completed').length || 0;

    // 3. Get adherence data from medicine logs
    // Find all patients of this doctor
    const { data: myPatients } = await supabase
      .from('patients')
      .select('id')
      .eq('doctor_id', doctorId);
    
    const patientIds = myPatients?.map(p => p.id) || [];
    let adherenceRate = 0;
    
    if (patientIds.length > 0) {
      const { data: logs } = await supabase
        .from('medicine_logs')
        .select('taken')
        .in('patient_id', patientIds);
      
      if (logs && logs.length > 0) {
        const taken = logs.filter(l => l.taken).length;
        adherenceRate = Math.round((taken / logs.length) * 100);
      }
    }

    // 4. Quick Asks resolution rate
    const { data: asks } = await supabase
      .from('quick_asks')
      .select('status')
      .eq('doctor_id', doctorId);
    
    let resolutionRate = 0;
    if (asks && asks.length > 0) {
      const resolved = asks.filter(a => a.status === 'answered').length;
      resolutionRate = Math.round((resolved / asks.length) * 100);
    }

    return NextResponse.json({
      totalPatients: totalPatients || 0,
      completedAppointments,
      upcomingAppointments,
      adherenceRate,
      resolutionRate
    });

  } catch (error: any) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

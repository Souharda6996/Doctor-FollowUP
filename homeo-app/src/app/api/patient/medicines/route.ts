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

    // Fetch active prescriptions
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active');

    // Fetch logs from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: logs } = await supabase
      .from('medicine_logs')
      .select('*')
      .eq('patient_id', patientId)
      .gte('log_date', sevenDaysAgo.toISOString().split('T')[0]);

    // Calculate weekly adherence
    let totalDoses = 0;
    let takenDoses = 0;
    const missedReasonBreakdown: Record<string, number> = {};

    if (logs && prescriptions) {
      // In a real app, you'd calculate total expected doses over the week based on frequency.
      // For simplicity here, we assume total expected is (active prescriptions count * 7) roughly, 
      // or we just base it on recorded logs. Let's base it on recorded logs and active prescriptions.
      // Simple logic: adherence = taken / (taken + missed) for logs recorded.
      const takenLogs = logs.filter(l => l.taken);
      const missedLogs = logs.filter(l => !l.taken);
      
      takenDoses = takenLogs.length;
      totalDoses = logs.length;

      missedLogs.forEach(ml => {
        if (ml.missed_reason) {
          missedReasonBreakdown[ml.missed_reason] = (missedReasonBreakdown[ml.missed_reason] || 0) + 1;
        }
      });
    }

    const weekPercent = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100; // default 100% if no logs yet

    return NextResponse.json({
      meds: prescriptions || [],
      savedLogs: logs || [],
      adherence: {
        weekPercent,
        missedReasonBreakdown
      }
    });

  } catch (error: any) {
    console.error('Patient medicines API error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

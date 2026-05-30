export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

// This function can run on a schedule to check adherence and create alerts
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Find active patients
    const { data: patients, error: pErr } = await supabase
      .from('patient_profiles')
      .select('id, user:users(display_name)');

    if (pErr) throw pErr;

    // A real implementation would check prescriptions vs logs for the day
    // For now, we will just record that cron ran successfully.

    return NextResponse.json({ success: true, processed: patients?.length });
  } catch (err: any) {
    console.error('Cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

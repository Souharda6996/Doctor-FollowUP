export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyFirebaseToken } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    await verifyFirebaseToken(req.headers.get('Authorization'));
    const { prescriptionId, patient_id, slot, status } = await req.json();

    if (!prescriptionId || !status || !patient_id) {
      return NextResponse.json({ error: 'prescriptionId, patient_id, and status are required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    
    // 1. Insert medicine log
    const { data: log, error: logError } = await supabase
      .from('medicine_logs')
      .insert({
        prescription_id: prescriptionId,
        patient_id,
        slot,
        status // 'taken' or 'missed'
      })
      .select()
      .single();

    if (logError) throw logError;

    // 2. Reset silence score if taken
    if (status === 'taken') {
      const { error: profileError } = await supabase
        .from('patient_profiles')
        .update({
          last_medicine_tap: new Date().toISOString(),
          silence_days: 0
        })
        .eq('user_id', patient_id);

      if (profileError) console.error('Failed to update silence score:', profileError);
    }

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    console.error('Medicine POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}


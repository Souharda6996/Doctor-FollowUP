export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyFirebaseToken } from '@/lib/auth-utils';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const decodedToken = await verifyFirebaseToken(req.headers.get('Authorization'));
    const supabase = getServiceSupabase();
    
    const { data: user } = await supabase.from('users').select('id').eq('firebase_uid', decodedToken.uid).single();
    if (!user) throw new Error('Doctor not found');

    const body = await req.json();
    const patientId = params.id;

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: patientId,
        doctor_id: user.id,
        scheduled_date: body.scheduled_date,
        scheduled_time: body.scheduled_time || '09:00:00',
        type: body.type || 'follow-up',
        status: body.status || 'scheduled',
        reason: body.reason || '',
        doctor_notes: body.doctor_notes || ''
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, appointment });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

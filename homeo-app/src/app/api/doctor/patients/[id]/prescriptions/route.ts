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

    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .insert({
        patient_id: patientId,
        doctor_id: user.id,
        name: body.name,
        dosage: body.dosage,
        frequency: body.frequency,
        times: body.times && body.times.length > 0 ? body.times : ['morning'],
        duration: body.duration || 'Ongoing',
        notes: body.notes || '',
        start_date: new Date().toISOString().split('T')[0],
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, prescription });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

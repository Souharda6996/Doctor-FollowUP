export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyFirebaseToken } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const decodedToken = await verifyFirebaseToken(req.headers.get('Authorization'));
    // Since Firebase UID maps to users.firebase_uid, we need the internal UUID, 
    // or we can pass the patient_id from the frontend if available.
    const body = await req.json();
    const { patient_id, mood, energy, symptoms, audio_note } = body;
    
    if (!patient_id) {
      return NextResponse.json({ error: 'patient_id is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    
    // 1. Insert checkin
    const { data: checkin, error: checkinError } = await supabase
      .from('checkins')
      .insert({
        patient_id,
        mood,
        energy,
        symptoms,
        audio_note
      })
      .select()
      .single();

    if (checkinError) throw checkinError;

    // 2. Reset silence score
    const { error: profileError } = await supabase
      .from('patient_profiles')
      .update({
        last_checkin: new Date().toISOString(),
        silence_days: 0
      })
      .eq('user_id', patient_id);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, checkin });
  } catch (error: any) {
    console.error('Checkin POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await verifyFirebaseToken(req.headers.get('Authorization'));
    
    const patientId = req.nextUrl.searchParams.get('patientId');
    const supabase = getServiceSupabase();
    
    let query = supabase.from('checkins').select('*').order('created_at', { ascending: false });
    if (patientId) query = query.eq('patient_id', patientId);
    
    const { data: checkins, error } = await query;
    if (error) throw error;
    
    return NextResponse.json({ checkins });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}


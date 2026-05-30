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

    // Fetch appointments
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*, doctor:doctor_id(display_name)')
      .eq('patient_id', patientId)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ appointments: appointments || [] });

  } catch (error: any) {
    console.error('Patient appointments API error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const decodedToken = await verifyFirebaseToken(req.headers.get('Authorization'));
    const supabase = getServiceSupabase();
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', decodedToken.uid)
      .single();

    if (userError || !user) throw new Error('User not found in internal DB');
    
    const body = await req.json();
    const { appointment_id, status } = body;
    
    // Allow patient to confirm an appointment
    if (status === 'confirmed') {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointment_id)
        .eq('patient_id', user.id);
        
      if (updateError) throw updateError;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Patient appointments update error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

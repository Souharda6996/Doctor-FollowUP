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

    const { data: asks, error } = await supabase
      .from('quick_asks')
      .select('*')
      .eq('patient_id', patientId)
      .order('asked_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ asks: asks || [] });
  } catch (error: any) {
    console.error('Patient quick-ask GET API error:', error);
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
    const { question, is_urgent, question_type } = body;

    const { data: insertedAsk, error: insertError } = await supabase
      .from('quick_asks')
      .insert({
        patient_id: user.id,
        question,
        question_type: question_type || 'text',
        is_urgent: !!is_urgent,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    if (is_urgent) {
      await supabase.from('alerts').insert({
        patient_id: user.id,
        type: 'symptom_spike',
        title: 'Urgent Quick Ask',
        message: question,
        severity: 'high'
      });
    }

    return NextResponse.json({ ask: insertedAsk });
  } catch (error: any) {
    console.error('Patient quick-ask POST API error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

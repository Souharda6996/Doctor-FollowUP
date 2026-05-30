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
    const doctorId = user.id;

    const { data: quickAsks, error } = await supabase
      .from('quick_asks')
      .select('*, patient:patient_id(status, users:user_id(display_name))')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ quickAsks });
  } catch (error: any) {
    console.error('Doctor quick-ask API error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const decodedToken = await verifyFirebaseToken(req.headers.get('Authorization'));
    const { askId, replyText } = await req.json();

    const supabase = getServiceSupabase();
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', decodedToken.uid)
      .single();

    if (userError || !user) throw new Error('User not found');
    const doctorId = user.id;

    const { data, error } = await supabase
      .from('quick_asks')
      .update({
        answer: replyText,
        status: 'answered',
        answered_at: new Date().toISOString()
      })
      .eq('id', askId)
      .eq('doctor_id', doctorId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

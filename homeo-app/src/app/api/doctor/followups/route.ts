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

    const { data: followUps, error } = await supabase
      .from('appointments')
      .select('*, patient:patient_id(users:user_id(display_name), chief_complaint)')
      .eq('doctor_id', doctorId)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ followUps });
  } catch (error: any) {
    console.error('Doctor followups API error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

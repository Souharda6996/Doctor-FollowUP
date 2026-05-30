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

    // Fetch reports
    const { data: reports, error } = await supabase
      .from('lab_reports')
      .select('*')
      .eq('patient_id', patientId)
      .order('report_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ reports: reports || [] });

  } catch (error: any) {
    console.error('Patient reports API error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

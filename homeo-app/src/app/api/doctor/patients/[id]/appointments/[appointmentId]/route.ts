export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyFirebaseToken } from '@/lib/auth-utils';

export async function PUT(req: NextRequest, { params }: { params: { id: string, appointmentId: string } }) {
  try {
    const decodedToken = await verifyFirebaseToken(req.headers.get('Authorization'));
    const supabase = getServiceSupabase();
    
    const { data: user } = await supabase.from('users').select('id').eq('firebase_uid', decodedToken.uid).single();
    if (!user) throw new Error('Doctor not found');

    const body = await req.json();

    const { data: appointment, error } = await supabase
      .from('appointments')
      .update(body)
      .eq('id', params.appointmentId)
      .eq('doctor_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, appointment });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string, appointmentId: string } }) {
  try {
    const decodedToken = await verifyFirebaseToken(req.headers.get('Authorization'));
    const supabase = getServiceSupabase();
    
    const { data: user } = await supabase.from('users').select('id').eq('firebase_uid', decodedToken.uid).single();
    if (!user) throw new Error('Doctor not found');

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', params.appointmentId)
      .eq('doctor_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

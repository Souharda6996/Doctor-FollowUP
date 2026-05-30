export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyFirebaseToken } from '@/lib/auth-utils';

export async function PUT(req: NextRequest, { params }: { params: { id: string, prescriptionId: string } }) {
  try {
    const decodedToken = await verifyFirebaseToken(req.headers.get('Authorization'));
    const supabase = getServiceSupabase();
    
    const { data: user } = await supabase.from('users').select('id').eq('firebase_uid', decodedToken.uid).single();
    if (!user) throw new Error('Doctor not found');

    const body = await req.json();

    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .update(body)
      .eq('id', params.prescriptionId)
      .eq('doctor_id', user.id) // Ensure doctor owns it
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, prescription });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string, prescriptionId: string } }) {
  try {
    const decodedToken = await verifyFirebaseToken(req.headers.get('Authorization'));
    const supabase = getServiceSupabase();
    
    const { data: user } = await supabase.from('users').select('id').eq('firebase_uid', decodedToken.uid).single();
    if (!user) throw new Error('Doctor not found');

    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('id', params.prescriptionId)
      .eq('doctor_id', user.id); // Ensure doctor owns it

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

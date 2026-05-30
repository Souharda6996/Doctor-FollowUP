export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyFirebaseToken } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const decodedToken = await verifyFirebaseToken(req.headers.get('Authorization'));
    const body = await req.json().catch(() => ({}));
    const requestedRole = body.role;

    const supabase = getServiceSupabase();
    
    // Check if user exists by firebase_uid
    let { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('firebase_uid', decodedToken.uid)
      .single();

    if (!user && decodedToken.phone_number) {
      // Try to find by phone (created by doctor)
      let { data: phoneUser } = await supabase
        .from('users')
        .select('*')
        .eq('phone', decodedToken.phone_number)
        .single();
        
      if (phoneUser) {
        // Link firebase_uid to the existing user
        const { data: linkedUser } = await supabase
          .from('users')
          .update({ firebase_uid: decodedToken.uid })
          .eq('id', phoneUser.id)
          .select()
          .single();
        user = linkedUser;
      }
    }

    if (fetchError && fetchError.code !== 'PGRST116' && !user) {
      throw fetchError;
    }

    if (!user) {
      // Patients cannot self-register
      if (requestedRole === 'patient' || !requestedRole) {
         return NextResponse.json({ error: 'Patient not found. Please contact your doctor to register.' }, { status: 403 });
      }

      // Create user (for doctors)
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          firebase_uid: decodedToken.uid,
          phone: decodedToken.phone_number || '',
          role: requestedRole,
          language_preference: 'en',
          display_name: 'New User'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      user = newUser;
    } else if (requestedRole && user.role !== requestedRole) {
      // Update role if explicitly requested and different
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ role: requestedRole })
        .eq('id', user.id)
        .select()
        .single();
      if (!updateError && updatedUser) {
        user = updatedUser;
      }
    }

    return NextResponse.json({ success: true, data: user });

  } catch (error: any) {
    console.error('Error in sync-user:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyFirebaseToken } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const decodedToken = await verifyFirebaseToken(authHeader);
    const supabase = getServiceSupabase();
    
    // 1. Find doctor
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', decodedToken.uid)
      .single();

    if (userError || !user) throw new Error('Doctor user not found in internal DB');
    const doctorId = user.id;

    const body = await req.json();

    // 2. Find or Create the patient user
    let patientId = null;

    // First check if a user with this email or phone already exists
    if (body.email || body.phone) {
      let query = supabase.from('users').select('id');
      
      if (body.email && body.phone) {
        query = query.or(`email.eq.${body.email},phone.eq.${body.phone}`);
      } else if (body.email) {
        query = query.eq('email', body.email);
      } else if (body.phone) {
        query = query.eq('phone', body.phone);
      }
      
      const { data: existingUsers } = await query;
      if (existingUsers && existingUsers.length > 0) {
        patientId = existingUsers[0].id;
      }
    }

    // If not found, create a new one
    if (!patientId) {
      const tempFirebaseUid = `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const { data: newPatientUser, error: newUserError } = await supabase
        .from('users')
        .insert({
          firebase_uid: tempFirebaseUid,
          display_name: body.name || 'Unknown Patient',
          phone: body.phone || null,
          email: body.email || null,
          role: 'patient',
          language_preference: body.language || 'en'
        })
        .select('id')
        .single();

      if (newUserError || !newPatientUser) {
        throw new Error(`Failed to create patient user: ${newUserError?.message}`);
      }
      patientId = newPatientUser.id;
    }

    // 3. Create the patient profile
    const { error: profileError } = await supabase
      .from('patient_profiles')
      .insert({
        user_id: patientId,
        doctor_id: doctorId,
        status: 'stable',
        case_type: body.caseType || 'chronic',
        chief_complaint: body.chiefComplaint || '',
        age: body.age ? parseInt(body.age) : null,
        gender: body.gender || 'other',
        address: body.address || null
      });
      
    if (profileError) throw new Error(`Failed to create patient profile: ${profileError.message}`);

    // 4. Create the case history
    const { error: historyError } = await supabase
      .from('case_history')
      .insert({
        patient_id: patientId,
        date: new Date().toISOString(),
        physical_symptoms: body.physicalSymptoms ? body.physicalSymptoms.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        mental_state: body.mentalState || '',
        emotional_state: body.emotionalState || '',
        sleep_pattern: body.sleepPattern || '',
        sleep_quality: body.sleepQuality || 'moderate',
        food_preferences: body.foodPreferences ? body.foodPreferences.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        food_aversions: body.foodAversions ? body.foodAversions.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        triggers: body.triggers ? body.triggers.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        chief_complaint: body.chiefComplaint || '',
        notes: body.notes || ''
      });

    if (historyError) {
      console.warn('Case history failed to insert, but continuing:', historyError);
    }

    return NextResponse.json({ success: true, patientId });

  } catch (error: any) {
    console.error('Add patient API error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

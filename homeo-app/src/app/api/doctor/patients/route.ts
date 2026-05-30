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

    if (!patientId) {
      // Create with null firebase_uid
      const { data: newPatientUser, error: newUserError } = await supabase
        .from('users')
        .insert({
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
    const emergencyContact = (body.emergencyContactName || body.emergencyContactPhone) 
      ? `${body.emergencyContactName || ''} ${body.emergencyContactPhone ? `(${body.emergencyContactPhone})` : ''}`.trim() 
      : null;

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
        address: body.address || null,
        blood_group: body.bloodGroup || null,
        emergency_contact: emergencyContact,
        doctor_notes: body.doctorInitialNotes || ''
      });
      
    if (profileError) throw new Error(`Failed to create patient profile: ${profileError.message}`);

    // Combine lifestyle and history into notes since schema doesn't have exact fields
    let additionalNotes = '';
    if (body.knownAllergies) additionalNotes += `Allergies: ${body.knownAllergies}\n`;
    if (body.pastMedicalHistory) additionalNotes += `Past History: ${body.pastMedicalHistory}\n`;
    if (body.familyHistory) additionalNotes += `Family History: ${body.familyHistory}\n`;
    if (body.currentMedications) additionalNotes += `Current Meds: ${body.currentMedications}\n`;
    if (body.exerciseHabits) additionalNotes += `Exercise: ${body.exerciseHabits}\n`;
    if (body.occupation) additionalNotes += `Occupation: ${body.occupation}\n`;
    if (body.smokingAlcohol) additionalNotes += `Smoking/Alcohol: ${body.smokingAlcohol}\n`;

    const combinedNotes = `${body.notes ? body.notes + '\n\n' : ''}${additionalNotes}`.trim();

    // 4. Create the case history
    const { error: historyError } = await supabase
      .from('case_history')
      .insert({
        patient_id: patientId,
        doctor_id: doctorId,
        visit_date: new Date().toISOString().split('T')[0],
        physical_symptoms: body.physicalSymptoms ? body.physicalSymptoms.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        mental_state: body.mentalState || '',
        emotional_state: body.emotionalState || '',
        sleep_pattern: body.sleepPattern || '',
        sleep_quality: body.sleepQuality || 'moderate',
        food_preferences: body.foodPreferences ? body.foodPreferences.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        food_aversions: body.foodAversions ? body.foodAversions.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        triggers: body.triggers ? body.triggers.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        chief_complaint: body.chiefComplaint || '',
        doctor_notes: combinedNotes
      });

    if (historyError) {
      console.warn('Case history failed to insert:', historyError);
    }

    // 5. Create initial prescriptions
    if (body.initialPrescriptions && body.initialPrescriptions.length > 0) {
      const prescriptionsToInsert = body.initialPrescriptions.map((p: any) => ({
        patient_id: patientId,
        doctor_id: doctorId,
        name: p.name,
        dosage: p.dosage,
        frequency: p.frequency,
        times: p.times && p.times.length > 0 ? p.times : ['morning'],
        duration: p.duration || 'Ongoing',
        start_date: new Date().toISOString().split('T')[0],
      }));
      const { error: rxError } = await supabase.from('prescriptions').insert(prescriptionsToInsert);
      if (rxError) console.warn('Failed to insert prescriptions:', rxError);
    }

    // 6. Schedule first appointment
    if (body.scheduleFirstAppointment && body.appointmentDate) {
      const { error: aptError } = await supabase.from('appointments').insert({
        patient_id: patientId,
        doctor_id: doctorId,
        scheduled_date: body.appointmentDate,
        scheduled_time: body.appointmentTime || '09:00:00',
        type: 'initial',
        reason: 'Initial Consultation',
        status: 'scheduled'
      });
      if (aptError) console.warn('Failed to insert appointment:', aptError);
    }

    return NextResponse.json({ success: true, patientId });

  } catch (error: any) {
    console.error('Add patient API error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

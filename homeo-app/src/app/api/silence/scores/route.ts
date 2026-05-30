export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';

const LADDER = [
  { minDays: 9,  level: 'priority',   action: 'Push to doctor dashboard as PRIORITY' },
  { minDays: 7,  level: 'caregiver',  action: 'WhatsApp alert to linked caregiver'   },
  { minDays: 5,  level: 'whatsapp',   action: 'WhatsApp message to patient'           },
  { minDays: 3,  level: 'nudge',      action: 'In-app gentle nudge notification'      },
  { minDays: 0,  level: 'none',       action: 'No action needed'                      },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId');

    const supabase = getServiceSupabase();
    
    let query = supabase
      .from('patient_profiles')
      .select(`
        user_id,
        silence_days,
        last_login,
        last_checkin,
        last_medicine_tap,
        users:user_id ( display_name )
      `)
      .order('silence_days', { ascending: false });

    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }

    const { data: patients, error } = await query;
    if (error) throw error;

    const scores = patients.map((patient: any) => {
      const silenceDays = patient.silence_days ?? 0;
      const level = LADDER.find((l) => silenceDays >= l.minDays)!;
      
      // Calculate last activity conceptually
      const dates = [
        new Date(patient.last_checkin || 0),
        new Date(patient.last_medicine_tap || 0),
        new Date(patient.last_login || 0)
      ].sort((a, b) => b.getTime() - a.getTime());

      return {
        patientId: patient.user_id,
        patientName: patient.users?.display_name || 'Unknown Patient',
        silenceDays,
        lastActivity: dates[0].toISOString(),
        level: level.level,
        recommendedAction: level.action,
      };
    });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      scores,
      priorityCount: scores.filter((s: any) => s.level === 'priority').length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

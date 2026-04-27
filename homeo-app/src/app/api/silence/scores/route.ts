import { NextRequest, NextResponse } from 'next/server';

// Silence detection response ladder
const LADDER = [
  { minDays: 9,  level: 'priority',   action: 'Push to doctor dashboard as PRIORITY' },
  { minDays: 7,  level: 'caregiver',  action: 'WhatsApp alert to linked caregiver'   },
  { minDays: 5,  level: 'whatsapp',   action: 'WhatsApp message to patient'           },
  { minDays: 3,  level: 'nudge',      action: 'In-app gentle nudge notification'      },
  { minDays: 0,  level: 'none',       action: 'No action needed'                      },
];

export async function GET(req: NextRequest) {
  // In production: compute from Supabase last_login, last_checkin, last_medicine_tap per patient
  // Using mock data for demo
  const { MOCK_PATIENTS } = await import('@/lib/mockData');

  const scores = MOCK_PATIENTS.map((patient) => {
    const silenceDays = patient.silenceDays ?? 0;
    const level = LADDER.find((l) => silenceDays >= l.minDays)!;

    return {
      patientId: patient.id,
      patientName: patient.name,
      silenceDays,
      lastActivity: patient.lastCheckin ?? patient.lastLogin ?? 'unknown',
      level: level.level,
      recommendedAction: level.action,
    };
  });

  // Sort: most silent first
  scores.sort((a, b) => b.silenceDays - a.silenceDays);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    scores,
    priorityCount: scores.filter((s) => s.level === 'priority').length,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { generatePreVisitBrief } from '@/lib/claudeClient';
import { MOCK_PATIENTS, MOCK_CHECKINS, MOCK_MEDICINE_LOGS, MOCK_LAB_REPORTS, MOCK_QUICK_ASKS, MOCK_GUT_TAGS, MOCK_ADHERENCE } from '@/lib/mockData';
import type { GutTagType } from '@/lib/types';
import { GUT_TAG_LABELS } from '@/lib/types';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const appointmentId = params.id;

  // In production: fetch appointment from Supabase to get patient context
  const patientId = req.nextUrl.searchParams.get('patientId') ?? 'p001';
  const patient   = MOCK_PATIENTS.find((p) => p.id === patientId);
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

  const checkins   = MOCK_CHECKINS.filter((c) => c.patientId === patientId).slice(0, 30);
  const adherence  = MOCK_ADHERENCE.find((a) => a.patientId === patientId);
  const labReport  = MOCK_LAB_REPORTS.find((r) => r.patientId === patientId);
  const asks       = MOCK_QUICK_ASKS.filter((q) => q.patientId === patientId).slice(0, 3);
  const gutTags    = MOCK_GUT_TAGS.filter((g) => g.patientId === patientId).slice(-1)[0];

  const context = {
    patientName: patient.name,
    language: patient.language,
    checkins: checkins.map((c) => `${c.date}: mood=${c.mood}, energy=${c.energy}/10, symptoms=${c.symptoms.join(',')}`).join(' | '),
    missedMeds: adherence
      ? `Adherence: ${adherence.weekPercent}%. Missed reasons: ${JSON.stringify(adherence.missedReasonBreakdown)}`
      : 'No adherence data',
    labFlags: labReport
      ? labReport.values.filter((v) => v.status !== 'GREEN').map((v) => `${v.name} ${v.result} ${v.unit} (${v.status})`).join(', ')
      : 'No recent labs',
    quickAskHistory: asks.map((q) => q.question).join(' | ') || 'None',
    gutTags: gutTags
      ? gutTags.tags.map((t) => GUT_TAG_LABELS[t as GutTagType].label).join(', ')
      : 'None recorded',
  };

  const brief = await generatePreVisitBrief(context);

  return NextResponse.json({
    appointmentId,
    patientId,
    generatedAt: new Date().toISOString(),
    ...brief,
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { MOCK_FINGERPRINT_ALERTS, MOCK_CHECKINS } from '@/lib/mockData';

/**
 * Symptom Fingerprint Check
 * 
 * In production:
 * 1. Extract 7-day symptom vector from check-ins
 * 2. Query pgvector for similarity search against stored historical patterns
 * 3. Return match if cosine similarity > 0.85
 * 
 * Here we return mock data that simulates the result.
 */
export async function GET(req: NextRequest, { params }: { params: { patientId: string } }) {
  const { patientId } = params;

  // In production: embed symptom vectors, query pgvector
  const alert = MOCK_FINGERPRINT_ALERTS.find((a) => a.patientId === patientId);

  if (!alert) {
    // Compute a simple mock pattern match
    const checkins = MOCK_CHECKINS.filter((c) => c.patientId === patientId);
    const recentEnergy = checkins.slice(0, 7).map((c) => c.energy);
    const avgEnergy = recentEnergy.reduce((a, b) => a + b, 0) / (recentEnergy.length || 1);

    return NextResponse.json({
      patientId,
      matchFound: avgEnergy < 4.5,
      confidence: avgEnergy < 4.5 ? 0.72 : 0,
      previousEventDate: null,
      previousEventDescription: null,
      recommendedAction: avgEnergy < 4.5
        ? 'Energy consistently low. Consider scheduling review ahead of planned appointment.'
        : 'Pattern looks stable. No pre-flare signature detected.',
    });
  }

  return NextResponse.json({
    patientId,
    ...alert,
  });
}

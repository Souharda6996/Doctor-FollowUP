import { NextRequest, NextResponse } from 'next/server';

const checkinStore: any[] = []; // In production: Supabase `checkins` table

export async function POST(req: NextRequest) {
  const body = await req.json();
  const checkin = { ...body, id: `ci_${Date.now()}`, createdAt: new Date().toISOString() };
  checkinStore.push(checkin);
  // In production: INSERT into supabase, update silence score
  return NextResponse.json({ success: true, checkin });
}

export async function GET(req: NextRequest) {
  const patientId = req.nextUrl.searchParams.get('patientId');
  const filtered  = patientId ? checkinStore.filter((c) => c.patientId === patientId) : checkinStore;
  return NextResponse.json({ checkins: filtered });
}

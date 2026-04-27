import { NextRequest, NextResponse } from 'next/server';

const quickAskStore: any[] = [];
const URGENT_KEYWORDS = ['chest', 'breathless', 'severe', 'stroke', 'unconscious', 'bleeding', "can't breathe"];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const isUrgent = URGENT_KEYWORDS.some((kw) => body.question?.toLowerCase().includes(kw));
  const ask = { ...body, id: `qa_${Date.now()}`, askedAt: new Date().toISOString(), isUrgent, status: 'pending' };
  quickAskStore.push(ask);

  if (isUrgent) {
    console.log(`[URGENT] Quick Ask flagged for patient ${body.patientId} — notify doctor immediately`);
    // TODO: push notification to doctor
  }

  return NextResponse.json({ success: true, ask });
}

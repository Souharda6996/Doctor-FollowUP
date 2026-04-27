import { NextRequest, NextResponse } from 'next/server';

const medLogStore: any[] = [];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const log = { ...body, id: `ml_${Date.now()}`, loggedAt: new Date().toISOString() };
  medLogStore.push(log);
  return NextResponse.json({ success: true, log });
}

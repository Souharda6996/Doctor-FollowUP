import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { phone, otp, role, language } = await req.json();
  // Demo: any 6-digit OTP is accepted
  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
  }
  // In production: verify with Twilio / Supabase Auth
  const session = { userId: `user_${phone}`, role, language, token: `demo_token_${Date.now()}` };
  return NextResponse.json({ success: true, session });
}

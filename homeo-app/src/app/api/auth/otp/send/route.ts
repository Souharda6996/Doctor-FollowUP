import { NextRequest, NextResponse } from 'next/server';

// Simulate OTP send (production: use Twilio Verify or Firebase Auth)
export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  if (!phone || phone.length < 10) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
  }
  // In production: Twilio.verify.services(SID).verifications.create({ to: '+91'+phone, channel:'sms' })
  console.log(`[OTP] Sending 6-digit OTP to ${phone} (demo — any 6 digits will work)`);
  return NextResponse.json({ success: true, message: 'OTP sent', demo: true });
}

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import twilio from 'twilio';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    
    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    if (isDemoMode) {
      // Demo Mode: Generate a random 6-digit OTP and store it in Supabase
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minute expiry
      
      const supabase = getServiceSupabase();
      
      const { error } = await supabase
        .from('otp_sessions')
        .upsert({ 
          phone, 
          otp, 
          expires_at: expiresAt.toISOString() 
        });

      if (error) throw error;

      console.log(`[Demo Mode] OTP for ${phone} is ${otp}`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'OTP generated (Demo Mode)',
        demoOtp: otp // We send it back in demo mode to display it on screen
      });
    }

    // Production Mode: Send real SMS via Twilio
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioVerifySid = process.env.TWILIO_VERIFY_SID;

    if (!twilioAccountSid || !twilioAuthToken || !twilioVerifySid) {
      console.error('Twilio credentials missing for production OTP');
      return NextResponse.json({ error: 'SMS service not configured' }, { status: 500 });
    }

    const client = twilio(twilioAccountSid, twilioAuthToken);
    
    // Ensure phone has + prefix, assuming India +91 if missing for simplicity, 
    // but best practice is to pass full E.164 from frontend
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    await client.verify.v2
      .services(twilioVerifySid)
      .verifications.create({ to: formattedPhone, channel: 'sms' });

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });

  } catch (error: any) {
    console.error('Error in OTP send:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}

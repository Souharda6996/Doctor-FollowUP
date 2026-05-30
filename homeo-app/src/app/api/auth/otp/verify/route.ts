export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { createDemoCustomToken } from '@/lib/auth-utils';
import twilio from 'twilio';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, role, language } = await req.json();

    if (!phone || !otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: 'Invalid OTP format' }, { status: 400 });
    }

    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    let isVerified = false;

    if (isDemoMode) {
      // Demo Mode: Verify against Supabase otp_sessions
      const supabase = getServiceSupabase();
      
      const { data, error } = await supabase
        .from('otp_sessions')
        .select('*')
        .eq('phone', phone)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'No OTP found or expired' }, { status: 400 });
      }

      const now = new Date();
      const expiresAt = new Date(data.expires_at);

      if (now > expiresAt) {
        return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
      }

      if (data.otp !== otp) {
        return NextResponse.json({ error: 'Incorrect OTP' }, { status: 400 });
      }

      // Valid! Delete the OTP so it can't be reused
      await supabase.from('otp_sessions').delete().eq('phone', phone);
      isVerified = true;

    } else {
      // Production Mode: Verify with Twilio
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioVerifySid = process.env.TWILIO_VERIFY_SID;

      if (!twilioAccountSid || !twilioAuthToken || !twilioVerifySid) {
        return NextResponse.json({ error: 'SMS service not configured' }, { status: 500 });
      }

      const client = twilio(twilioAccountSid, twilioAuthToken);
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

      const verificationCheck = await client.verify.v2
        .services(twilioVerifySid)
        .verificationChecks.create({ to: formattedPhone, code: otp });

      if (verificationCheck.status !== 'approved') {
        return NextResponse.json({ error: 'Incorrect OTP' }, { status: 400 });
      }
      isVerified = true;
    }

    if (!isVerified) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    // Now that they are verified, if we are in DEMO mode, we need to log them in to Firebase.
    // In production, they'd use Firebase's own signInWithPhoneNumber which handles this,
    // but our API route needs to mint a Custom Token for demo mode to use.
    
    // Format for Firebase Auth (E.164)
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    const customToken = await createDemoCustomToken(formattedPhone);

    return NextResponse.json({ 
      success: true, 
      customToken,
      message: 'Verified successfully'
    });

  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}

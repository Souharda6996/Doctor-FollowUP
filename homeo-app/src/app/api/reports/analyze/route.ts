import { NextRequest, NextResponse } from 'next/server';
import { analyzeLabReport } from '@/lib/claudeClient';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const patientId = formData.get('patientId') as string;

    if (!file && !formData.get('text')) {
      return NextResponse.json({ error: 'No file or text provided' }, { status: 400 });
    }

    let reportContent = '';
    if (file) {
      // In production: extract text via OCR (Google Vision, AWS Textract, etc.)
      reportContent = `[File: ${file.name} (${Math.round(file.size / 1024)}KB) — OCR extraction placeholder]`;
    } else {
      reportContent = formData.get('text') as string;
    }

    const result = await analyzeLabReport(reportContent);

    // In production: save to Supabase lab_reports table, alert doctor if RED
    if (result.overall_status === 'RED') {
      console.log(`[ALERT] RED lab report for patient ${patientId} — notify doctor!`);
      // TODO: send WhatsApp via Twilio, push notification via FCM
    }

    return NextResponse.json({
      overallStatus: result.overall_status,
      summaryText: result.summary_text,
      values: result.values,
      patientId,
      reportDate: new Date().toISOString().slice(0, 10),
      uploadedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Lab Analysis] Error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

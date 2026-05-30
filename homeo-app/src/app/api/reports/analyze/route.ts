export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { analyzeLabReport } from '@/lib/claudeClient';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyFirebaseToken } from '@/lib/auth-utils';

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

    const decodedToken = await verifyFirebaseToken(req.headers.get('Authorization'));
    const supabase = getServiceSupabase();
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', decodedToken.uid)
      .single();

    if (userError || !user) throw new Error('User not found in internal DB');
    const dbPatientId = user.id;

    const result = await analyzeLabReport(reportContent);

    // Save to Supabase lab_reports table
    const { data: insertedReport, error: insertError } = await supabase
      .from('lab_reports')
      .insert({
        patient_id: dbPatientId,
        report_date: new Date().toISOString().split('T')[0],
        overall_status: result.overall_status,
        summary_text: result.summary_text,
        values: result.values
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting lab report:', insertError);
      throw insertError;
    }

    if (result.overall_status === 'RED') {
      console.log(`[ALERT] RED lab report for patient ${dbPatientId} — notify doctor!`);
      // Alert creation
      await supabase.from('alerts').insert({
        patient_id: dbPatientId,
        type: 'lab_red',
        title: 'Critical Lab Report',
        message: result.summary_text,
        severity: 'high'
      });
    }

    return NextResponse.json({
      id: insertedReport.id,
      overallStatus: insertedReport.overall_status,
      summaryText: insertedReport.summary_text,
      values: insertedReport.values,
      patientId: dbPatientId,
      reportDate: insertedReport.report_date,
      uploadedAt: insertedReport.created_at,
    });
  } catch (err) {
    console.error('[Lab Analysis] Error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

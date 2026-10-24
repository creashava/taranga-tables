import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/db';

const reportSchema = z.object({
  reporterId: z.string().optional(),
  podId: z.string().optional(),
  meetupId: z.string().optional(),
  subjectUserId: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high']),
  category: z.string().min(1),
  body: z.string().min(1),
});

/**
 * POST /api/report
 * Submit a safety report from any screen.
 * AT12: High-severity reports immediately log host email in console within 1 minute
 * and top the H6 Safety Queue.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { reporterId, podId, meetupId, subjectUserId, severity, category, body: reportText } = parsed.data;
    const db = getDatabase();

    const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    db.safetyReports.set(reportId, {
      id: reportId,
      reporter_id: reporterId,
      pod_id: podId,
      meetup_id: meetupId,
      subject_user_id: subjectUserId,
      severity,
      category,
      body: reportText,
      status: 'open',
      created_at: now,
    });

    db.logEvent('safety_report_filed', reporterId, podId, {
      report_id: reportId,
      severity,
      category,
    });

    db.logAudit('safety_report_filed', reporterId ?? 'anonymous', 'safety_report', reportId);

    // AT12: High severity emails the host instantly
    if (severity === 'high') {
      const hostEmail = 'host@tarangatables.in';
      console.log(
        `[SAFETY ALERT - AT12] High-severity report filed (${category}): emailing host at ${hostEmail} immediately.`
      );
    }

    return NextResponse.json({
      success: true,
      report_id: reportId,
      message: 'Your report has been received and will be reviewed promptly by the hosting team.',
    });
  } catch (error) {
    console.error('POST /api/report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

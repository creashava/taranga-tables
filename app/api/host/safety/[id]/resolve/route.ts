import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '@/lib/db';

const resolveSchema = z.object({
  resolution: z.string().min(1),
  status: z.enum(['resolved', 'in_review']).default('resolved'),
});

/**
 * POST /api/host/safety/[id]/resolve
 * Host marks safety report as in-review or resolved with a logged resolution note.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = params.id;
    const body = await req.json();
    const parsed = resolveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { resolution, status } = parsed.data;
    const db = getDatabase();

    const report = db.safetyReports.get(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Safety report not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    report.status = status;
    report.resolution = resolution;
    if (status === 'resolved') {
      report.resolved_at = now;
    }

    db.logAudit('safety_report_resolved', 'host-01', 'safety_report', reportId);
    db.logEvent('safety_report_resolved', undefined, report.pod_id, {
      report_id: reportId,
      status,
    });

    return NextResponse.json({
      success: true,
      message: `Report marked as ${status}.`,
    });
  } catch (error) {
    console.error('POST /api/host/safety/[id]/resolve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { consentSubmissionSchema } from '@/lib/validations/onboarding';
import { getDatabase } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = consentSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, purpose, noticeVersion, granted } = parsed.data;
    const db = getDatabase();

    const consentKey = `c-${userId}-${purpose}`;
    const existing = db.consents.get(consentKey);

    if (existing) {
      existing.granted = granted;
      if (!granted) {
        existing.withdrawn_at = new Date().toISOString();
      } else {
        existing.withdrawn_at = undefined;
      }
      db.consents.set(consentKey, existing);
    } else {
      db.consents.set(consentKey, {
        id: consentKey,
        user_id: userId,
        purpose,
        notice_version: noticeVersion,
        granted,
        granted_at: new Date().toISOString(),
        withdrawn_at: granted ? undefined : new Date().toISOString(),
      });
    }

    db.logEvent(granted ? 'consent_granted' : 'consent_withdrawn', userId, undefined, {
      purpose,
      noticeVersion,
    });

    return NextResponse.json({
      success: true,
      consent: {
        userId,
        purpose,
        granted,
      },
    });
  } catch (error) {
    console.error('Consent API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

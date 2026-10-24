import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/me/export
 * Download all personal data in JSON format (GDPR / DPDP data portability, AT16).
 * Contains profile, consents, screening band, letters, RSVPs, stretch choices, and feedback.
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || new URL(req.url).searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const db = getDatabase();
    const profile = db.profiles.get(userId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const userConsents = Array.from(db.consents.values()).filter((c) => c.user_id === userId);
    const userScreening = db.screenings.get(userId);
    const userLetters = Array.from(db.letters.values()).filter((l) => l.author_id === userId);
    const userRsvps = Array.from(db.rsvps.values()).filter((r) => r.user_id === userId);
    const userStretch = Array.from(db.stretchChoices.values()).filter((s) => s.user_id === userId);
    const userNotes = Array.from(db.podNotes.values()).filter((n) => n.author_id === userId);
    const userFeedback = Array.from(db.feedback.values()).filter((f) => f.user_id === userId);
    const userMemberships = db.podMembers.filter((pm) => pm.user_id === userId);

    db.logAudit('data_exported', userId, 'profile', userId);

    const exportData = {
      exported_at: new Date().toISOString(),
      profile: {
        id: profile.id,
        display_name: profile.display_name,
        role: profile.role,
        is_18_plus: profile.is_18_plus,
        area: profile.area,
        languages: profile.languages,
        interests: profile.interests,
        talk_vs_listen: profile.talk_vs_listen,
        planned_vs_spontaneous: profile.planned_vs_spontaneous,
        status: profile.status,
        wants_women_only: profile.wants_women_only,
        letter_hour: profile.letter_hour,
        created_at: profile.created_at,
      },
      consents: userConsents,
      screening: userScreening
        ? {
            band: userScreening.band,
            created_at: userScreening.created_at,
          }
        : null,
      letters: userLetters,
      pod_notes: userNotes,
      rsvps: userRsvps,
      stretch_choices: userStretch,
      feedback: userFeedback,
      pod_memberships: userMemberships,
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('GET /api/me/export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

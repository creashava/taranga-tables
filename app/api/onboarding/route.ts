import { NextRequest, NextResponse } from 'next/server';
import { onboardingProfileSchema } from '@/lib/validations/onboarding';
import { getAgeAssuranceAdapter } from '@/lib/adapters/age';
import { getDatabase } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // AT1: Check 18+ declaration through AgeAssurance adapter
    if (!body.is18Plus) {
      return NextResponse.json(
        {
          error: 'Under-18 signup rejected.',
          message: 'Under India DPDP Act and Taranga Tables safety guidelines, you must be 18 or older to participate.',
        },
        { status: 403 }
      );
    }

    const parsed = onboardingProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      userId,
      displayName,
      is18Plus,
      gender,
      wantsWomenOnly,
      languages,
      interests,
      talkVsListen,
      plannedVsSpontaneous,
      availability,
      area,
      letterHour,
    } = parsed.data;

    const ageAdapter = getAgeAssuranceAdapter();
    const ageResult = await ageAdapter.verify({ is18PlusDeclared: is18Plus, userId });

    if (!ageResult.is18Plus) {
      return NextResponse.json(
        { error: 'Age verification failed', message: 'You must be 18 or older to join.' },
        { status: 403 }
      );
    }

    const db = getDatabase();

    // Save profile (Data minimisation: no DOB, no phone, no precise location)
    db.profiles.set(userId, {
      id: userId,
      display_name: displayName,
      role: 'member',
      status: 'onboarding',
      is_18_plus: true,
      age_method: ageResult.method,
      age_checked_at: ageResult.checkedAt,
      gender,
      wants_women_only: wantsWomenOnly,
      languages,
      interests,
      talk_vs_listen: talkVsListen,
      planned_vs_spontaneous: plannedVsSpontaneous,
      availability,
      area,
      letter_hour: letterHour,
      created_at: new Date().toISOString(),
    });

    db.logEvent('onboarding_completed', userId);

    return NextResponse.json({
      success: true,
      profile: {
        id: userId,
        displayName,
        status: 'onboarding',
      },
    });
  } catch (error) {
    console.error('Onboarding API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

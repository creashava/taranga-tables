'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Users, MapPin, BookOpen, CheckCircle2, Circle, Loader2, Sparkles, MessageSquare } from 'lucide-react';

interface PodMember {
  user_id: string;
  display_name: string;
  is_self: boolean;
}

interface NextMeetup {
  id: string;
  seq: number;
  starts_at: string;
  ends_at: string;
  venue_name: string | null;
  venue_area: string | null;
}

interface PodData {
  pod: { id: string; name: string; status: string; arm: string; deposit_inr: number };
  members: PodMember[];
  next_meetup: NextMeetup | null;
  hours_together: number;
}

interface LetterState {
  current_seq: number | null;
  all_done: boolean;
  prompt: { body_en: string } | null;
  own_submitted_seqs: number[];
  unlocked_letters: Array<{ letter_id: string; seq: number; author_display_name: string }>;
  pending_unlocks: Array<{ author_display_name: string; seq: number; reveal_at: string }>;
  letter_hour: number;
}

function formatDateIST(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HoursRing({ hours }: { hours: number }) {
  // Milestones: 5, 10, 25, 50 hours
  const milestones = [5, 10, 25, 50];
  const nextMilestone = milestones.find((m) => m > hours) ?? 50;
  const pct = Math.min((hours / nextMilestone) * 100, 100);
  const radius = 32;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="80" viewBox="0 0 80 80" className="rotate-[-90deg]">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" className="text-paper-200" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-wave-600 transition-all duration-700"
          strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="text-center -mt-[68px] mb-6 pointer-events-none">
        <div className="text-xl font-bold text-paper-900 font-serif">{hours}</div>
        <div className="text-[10px] text-muted-foreground leading-none">hrs</div>
      </div>
      <p className="text-[11px] text-muted-foreground text-center mt-8">
        {hours < nextMilestone
          ? `${(nextMilestone - hours).toFixed(1)}h to ${nextMilestone}-hour mark`
          : 'Milestone reached'}
      </p>
      <p className="text-[10px] text-paper-700/60 text-center italic max-w-[160px]">
        Research suggests friendships take many shared hours. This is a rough guide, not a rule.
      </p>
    </div>
  );
}

export default function PodHomePage() {
  const [pod, setPod] = useState<PodData | null>(null);
  const [letters, setLetters] = useState<LetterState | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('taranga_user_id') ?? 'usr-a1'; // demo default
    setUserId(id);

    async function load() {
      try {
        const [podRes, letterRes] = await Promise.all([
          fetch('/api/me/pod', { headers: { 'x-user-id': id } }),
          fetch('/api/letters/current', { headers: { 'x-user-id': id } }),
        ]);
        if (podRes.ok) setPod(await podRes.json());
        if (letterRes.ok) setLetters(await letterRes.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-wave-600 w-6 h-6" />
      </div>
    );
  }

  if (!pod) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4 py-12">
        <Users className="w-10 h-10 text-wave-400" />
        <div>
          <h1 className="font-serif text-2xl text-paper-900 mb-2">Not in a pod yet</h1>
          <p className="text-sm text-paper-800">Your host is still forming your pod. Check back soon.</p>
        </div>
        <Link href="/waitlist" className="text-sm text-wave-700 hover:underline">Back to Waitlist</Link>
      </div>
    );
  }

  const newLetterCount = letters?.unlocked_letters.length ?? 0;
  const seqsDone = letters?.own_submitted_seqs ?? [];
  const canWrite = letters?.current_seq !== null && !letters?.all_done;

  return (
    <div className="flex-1 flex flex-col gap-6 py-4">
      {/* Pod Header */}
      <header className="space-y-1">
        <span className="text-xs uppercase tracking-widest text-wave-700 font-semibold">
          Your Pod
        </span>
        <h1 className="font-serif text-2xl text-paper-900 leading-tight">
          {pod.pod.name}
        </h1>
        {pod.pod.arm === 'deposit' && (
          <span className="inline-block text-[11px] text-wave-700 bg-wave-50 border border-wave-200 rounded-full px-2.5 py-0.5">
            ₹{pod.pod.deposit_inr} refundable deposit arm
          </span>
        )}
      </header>

      {/* Members row */}
      <section aria-label="Pod members" className="p-4 bg-paper-100 border border-paper-200 rounded-xl space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-paper-700">
          <Users className="w-3.5 h-3.5" />
          <span>Your six</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {pod.members.map((m) => (
            <span
              key={m.user_id}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                m.is_self
                  ? 'bg-wave-100 border-wave-300 text-wave-800'
                  : 'bg-paper-50 border-paper-200 text-paper-800'
              }`}
            >
              {m.display_name}
              {m.is_self && <span className="ml-1 text-wave-500">(you)</span>}
            </span>
          ))}
        </div>
      </section>

      {/* Hours Together */}
      <section aria-label="Hours together" className="p-4 bg-paper-100 border border-paper-200 rounded-xl flex items-center gap-6">
        <HoursRing hours={pod.hours_together} />
        <div className="flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-paper-700">
            Hours Together
          </p>
          <p className="text-sm text-paper-800 leading-relaxed">
            Confirmed in-person hours with your pod. The app measures offline time, not screen time.
          </p>
        </div>
      </section>

      {/* Letters progress */}
      <section aria-label="Letters" className="p-4 bg-paper-100 border border-paper-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-paper-700">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Letters</span>
          </div>
          {newLetterCount > 0 && (
            <span className="text-[11px] font-medium text-wave-700 bg-wave-50 border border-wave-200 rounded-full px-2.5 py-0.5">
              {newLetterCount} new {newLetterCount === 1 ? 'letter' : 'letters'}
            </span>
          )}
        </div>

        {/* Seq progress */}
        <div className="space-y-1.5">
          {[1, 2, 3].map((seq) => {
            const done = seqsDone.includes(seq);
            const isCurrent = letters?.current_seq === seq;
            return (
              <div key={seq} className="flex items-center gap-2 text-sm">
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-wave-600 flex-shrink-0" />
                ) : (
                  <Circle
                    className={`w-4 h-4 flex-shrink-0 ${isCurrent ? 'text-wave-400' : 'text-paper-300'}`}
                  />
                )}
                <span className={`${done ? 'text-paper-700 line-through' : isCurrent ? 'text-paper-900 font-medium' : 'text-paper-400'}`}>
                  Letter {seq}
                  {isCurrent && !done && (
                    <span className="ml-1.5 text-xs font-normal text-wave-600 no-underline">
                      — ready to write
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Pending unlocks info (no guilt copy) */}
        {letters?.pending_unlocks && letters.pending_unlocks.length > 0 && (
          <p className="text-xs text-muted-foreground pt-1">
            More letters unlock at {letters.letter_hour}:00 today.
          </p>
        )}

        {/* CTA */}
        {canWrite && (
          <Link
            id="pod-write-letter-cta"
            href="/pod/write"
            className="block w-full py-3 text-center text-sm font-medium bg-wave-600 hover:bg-wave-700 text-white rounded-lg transition-colors mt-1"
          >
            Write Letter {letters?.current_seq}
          </Link>
        )}
        {newLetterCount > 0 && (
          <Link
            id="pod-read-letters-cta"
            href="/pod/letters"
            className="block w-full py-2.5 text-center text-sm font-medium text-wave-700 hover:text-wave-800 bg-wave-50 hover:bg-wave-100 border border-wave-200 rounded-lg transition-colors"
          >
            Read pod letters
          </Link>
        )}
        {letters?.all_done && newLetterCount === 0 && (
          <div className="text-center py-2">
            <p className="text-sm text-paper-800">
              That&apos;s everything for today. Your next letter arrives at {letters.letter_hour}:00 tomorrow.
            </p>
            <p className="text-sm text-wave-700 mt-1 font-medium">See you at the table.</p>
          </div>
        )}
      </section>

      {/* Next Table */}
      {pod.next_meetup && (
        <section aria-label="Next table" className="p-4 bg-paper-100 border border-paper-200 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-paper-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Table {pod.next_meetup.seq}</span>
          </div>
          <p className="text-sm font-medium text-paper-900">
            {formatDateIST(pod.next_meetup.starts_at)}
          </p>
          {pod.next_meetup.venue_name && (
            <p className="text-xs text-paper-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-wave-500" />
              {pod.next_meetup.venue_name}
              {pod.next_meetup.venue_area && `, ${pod.next_meetup.venue_area}`}
            </p>
          )}
          <Link
            id="pod-rsvp-cta"
            href={`/pod/rsvp?meetup=${pod.next_meetup.id}`}
            className="block w-full py-2.5 text-center text-sm font-medium text-wave-700 hover:text-wave-800 bg-wave-50 hover:bg-wave-100 border border-wave-200 rounded-lg transition-colors mt-1"
          >
            RSVP for Table {pod.next_meetup.seq}
          </Link>
        </section>
      )}

      {/* Pod Activities: Stretch & Notes */}
      <section className="grid grid-cols-2 gap-3 pt-1">
        <Link
          href="/pod/stretch"
          className="p-3.5 bg-paper-100 hover:bg-paper-200 border border-paper-200 rounded-xl space-y-1 text-left transition-colors"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-paper-900">
            <Sparkles className="w-3.5 h-3.5 text-wave-600" />
            <span>Stretch Cards</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Optional table challenges
          </p>
        </Link>

        <Link
          href="/pod/notes"
          className="p-3.5 bg-paper-100 hover:bg-paper-200 border border-paper-200 rounded-xl space-y-1 text-left transition-colors"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-paper-900">
            <MessageSquare className="w-3.5 h-3.5 text-wave-600" />
            <span>Pod Notes</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Quiet shared notes
          </p>
        </Link>
      </section>

      {/* Footer navigation */}
      <footer className="pt-2 border-t border-paper-200/80 flex items-center justify-between text-xs text-muted-foreground">
        <Link href="/pod/closing" className="hover:text-paper-900 hover:underline">
          Closing & Feedback
        </Link>
        <Link href="/settings" className="hover:text-paper-900 hover:underline">
          Settings & Safety
        </Link>
      </footer>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Loader2, Lock, Clock } from 'lucide-react';

interface UnlockedLetter {
  letter_id: string;
  author_display_name: string;
  seq: number;
  body: string;
  submitted_at: string;
  reveal_at: string;
  read: boolean;
}

interface PendingUnlock {
  author_display_name: string;
  seq: number;
  reveal_at: string;
}

interface LetterCurrentState {
  current_seq: number | null;
  all_done: boolean;
  prompt: { id: string; body_en: string; level: number } | null;
  own_draft: { id: string; body: string; seq: number } | null;
  own_submitted_seqs: number[];
  unlocked_letters: UnlockedLetter[];
  pending_unlocks: PendingUnlock[];
  letter_hour: number;
}

function formatRevealTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function LetterCard({
  letter,
  onRead,
}: {
  letter: UnlockedLetter;
  onRead: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => {
    setExpanded(true);
    onRead(letter.letter_id);
  };

  return (
    <article
      className={`border rounded-xl overflow-hidden transition-all duration-300 ${
        letter.read || expanded
          ? 'bg-white border-paper-200'
          : 'bg-wave-50 border-wave-200 shadow-sm'
      }`}
    >
      <button
        id={`letter-card-${letter.letter_id}`}
        onClick={handleExpand}
        className="w-full text-left p-4 flex items-start justify-between gap-3"
        aria-expanded={expanded}
      >
        <div className="space-y-0.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-wave-700">
              Letter {letter.seq}
            </span>
            {!letter.read && !expanded && (
              <span className="w-2 h-2 rounded-full bg-wave-500 flex-shrink-0" aria-label="Unread" />
            )}
          </div>
          <p className="text-sm font-medium text-paper-900">{letter.author_display_name}</p>
          {!expanded && (
            <p className="text-xs text-paper-600 mt-0.5 line-clamp-1">
              {letter.body.slice(0, 60)}…
            </p>
          )}
        </div>
        {!expanded && (
          <ChevronRight className="w-4 h-4 text-paper-400 flex-shrink-0 mt-0.5" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-5 space-y-3 border-t border-paper-100">
          <p className="text-sm text-paper-900 leading-relaxed font-serif whitespace-pre-wrap pt-3">
            {letter.body}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Shared at {formatRevealTime(letter.reveal_at)}
          </p>
        </div>
      )}
    </article>
  );
}

function ClosingScreen({ letterHour }: { letterHour: number }) {
  return (
    <div
      id="closing-screen"
      className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4 py-12"
      aria-live="polite"
    >
      {/* Wave motif */}
      <div className="text-5xl select-none" aria-hidden="true">〰️</div>
      <div className="space-y-3 max-w-xs">
        <h2 className="font-serif text-2xl text-paper-900 leading-snug">
          That&apos;s everything for today.
        </h2>
        <p className="text-sm text-paper-800 leading-relaxed">
          Your next letter arrives at {letterHour}:00 tomorrow. See you at the table.
        </p>
      </div>
      {/* No 'you might also like'. Session ends here. */}
      <Link
        href="/pod"
        id="closing-screen-back-to-pod"
        className="mt-4 text-sm text-wave-700 hover:underline"
      >
        Back to Pod Home
      </Link>
    </div>
  );
}

export default function LetterRevealPage() {
  const [state, setState] = useState<LetterCurrentState | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showClosing, setShowClosing] = useState(false);
  const [readLetterIds, setReadLetterIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const id = localStorage.getItem('taranga_user_id') ?? 'usr-a1';
    setUserId(id);

    fetch('/api/letters/current', { headers: { 'x-user-id': id } })
      .then((r) => r.json())
      .then((data: LetterCurrentState) => {
        setState(data);
        // If no unread letters, go straight to closing (AT8)
        if (data.unlocked_letters.length === 0) {
          setShowClosing(true);
        }
      })
      .catch(() => setState(null))
      .finally(() => setLoading(false));
  }, []);

  const handleRead = async (letterId: string) => {
    if (!userId) return;
    // Mark read locally
    setReadLetterIds((prev) => new Set([...prev, letterId]));

    // Fire and forget
    fetch(`/api/letters/${letterId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reader_id: userId }),
    }).catch(() => {});

    // After all letters are read, show closing (AT8)
    const allLetters = state?.unlocked_letters ?? [];
    const allRead = allLetters.every((l) => l.letter_id === letterId || readLetterIds.has(l.letter_id));
    if (allRead) {
      setTimeout(() => setShowClosing(true), 800);
    }
  };

  const handleShowClosing = () => setShowClosing(true);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-wave-600 w-6 h-6" />
      </div>
    );
  }

  if (showClosing && state) {
    return <ClosingScreen letterHour={state.letter_hour} />;
  }

  const unlockedLetters = state?.unlocked_letters ?? [];
  const pendingUnlocks = state?.pending_unlocks ?? [];
  const canWrite = state?.current_seq !== null && !state?.all_done;
  const ownSeqsDone = state?.own_submitted_seqs ?? [];

  return (
    <div className="flex-1 flex flex-col py-4">
      <nav className="mb-5">
        <Link href="/pod" className="inline-flex items-center gap-1.5 text-sm text-wave-700 hover:text-wave-800">
          <ArrowLeft className="w-4 h-4" />
          Pod Home
        </Link>
      </nav>

      <header className="mb-5 space-y-1">
        <span className="text-xs uppercase tracking-widest text-wave-700 font-semibold">
          Letters
        </span>
        <h1 className="font-serif text-2xl text-paper-900 leading-tight">
          Your pod&apos;s letters
        </h1>
      </header>

      {/* Must write own letter first */}
      {canWrite && ownSeqsDone.length === 0 && unlockedLetters.length === 0 && (
        <div className="mb-5 p-4 bg-paper-100 border border-paper-200 rounded-xl flex items-start gap-3">
          <Lock className="w-5 h-5 text-wave-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm text-paper-900 font-medium">Write first to unlock</p>
            <p className="text-sm text-paper-700">
              Pod letters unlock for you once you&apos;ve written your own Letter {state?.current_seq}.
            </p>
            <Link
              href="/pod/write"
              id="letters-write-cta"
              className="inline-block mt-2 py-2 px-4 text-sm font-medium bg-wave-600 hover:bg-wave-700 text-white rounded-lg transition-colors"
            >
              Write Letter {state?.current_seq}
            </Link>
          </div>
        </div>
      )}

      {/* Unlocked letters */}
      {unlockedLetters.length > 0 && (
        <div className="space-y-3 mb-5">
          {unlockedLetters.map((letter) => (
            <LetterCard
              key={letter.letter_id}
              letter={{ ...letter, read: readLetterIds.has(letter.letter_id) || letter.read }}
              onRead={handleRead}
            />
          ))}
        </div>
      )}

      {/* Pending unlocks (locked until reveal_at) */}
      {pendingUnlocks.length > 0 && (
        <div className="space-y-2 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-paper-600 mb-2">
            Arriving later today
          </p>
          {pendingUnlocks.map((p, i) => (
            <div
              key={i}
              className="p-4 bg-paper-100/70 border border-paper-200 rounded-xl flex items-center gap-3"
            >
              <Clock className="w-4 h-4 text-wave-400 flex-shrink-0" />
              <div>
                <p className="text-sm text-paper-700">
                  {p.author_display_name}&apos;s Letter {p.seq}
                </p>
                <p className="text-xs text-muted-foreground">
                  Unlocks at {formatRevealTime(p.reveal_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Done reading — manually go to closing */}
      {unlockedLetters.length > 0 && (
        <button
          id="letters-done-reading"
          onClick={handleShowClosing}
          className="w-full py-3 text-sm font-medium text-wave-700 bg-wave-50 hover:bg-wave-100 border border-wave-200 rounded-lg transition-colors mt-auto"
        >
          Done reading
        </button>
      )}

      {/* No letters at all */}
      {unlockedLetters.length === 0 && pendingUnlocks.length === 0 && !canWrite && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4 py-8">
          <p className="text-sm text-paper-800">No letters to show yet.</p>
          <Link href="/pod" className="text-sm text-wave-700 hover:underline">Back to Pod Home</Link>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Save, Loader2, AlertCircle, Info } from 'lucide-react';

const MIN_CHARS = 20;
const MAX_CHARS = 1200;
const SOFT_MIN = 80; // gentle guide, not a hard requirement

interface LetterPrompt {
  id: string;
  body_en: string;
  level: number;
}

interface LetterCurrentState {
  current_seq: number | null;
  all_done: boolean;
  prompt: LetterPrompt | null;
  own_draft: { id: string; body: string; seq: number } | null;
  letter_hour: number;
}

function CharGuide({ count }: { count: number }) {
  const pct = Math.min((count / MAX_CHARS) * 100, 100);
  const isUnderMin = count > 0 && count < MIN_CHARS;
  const isSoftMin = count >= MIN_CHARS && count < SOFT_MIN;
  const isGood = count >= SOFT_MIN && count < MAX_CHARS * 0.9;
  const isNearLimit = count >= MAX_CHARS * 0.9;

  let label = '';
  let color = 'text-muted-foreground';
  if (isUnderMin) {
    label = `${MIN_CHARS - count} more character${MIN_CHARS - count !== 1 ? 's' : ''} needed`;
    color = 'text-amber-600';
  } else if (isSoftMin) {
    label = 'Keep going…';
    color = 'text-paper-600';
  } else if (isGood) {
    label = `${MAX_CHARS - count} characters left`;
    color = 'text-muted-foreground';
  } else if (isNearLimit) {
    label = `${MAX_CHARS - count} characters left`;
    color = 'text-amber-600';
  }

  return (
    <div className="space-y-1.5">
      <div className="h-1 rounded-full bg-paper-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isUnderMin ? 'bg-amber-400' : isNearLimit ? 'bg-amber-500' : 'bg-wave-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-xs text-right ${color}`}>{count > 0 ? label : `${MAX_CHARS} characters max`}</p>
    </div>
  );
}

export default function WriteLetterPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [letterState, setLetterState] = useState<LetterCurrentState | null>(null);
  const [body, setBody] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userWarning, setUserWarning] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('taranga_user_id') ?? 'usr-a1';
    setUserId(id);

    fetch('/api/letters/current', { headers: { 'x-user-id': id } })
      .then((r) => r.json())
      .then((data: LetterCurrentState) => {
        setLetterState(data);
        if (data.own_draft?.body) {
          setBody(data.own_draft.body);
        }
      })
      .catch(() => setError('Could not load the letter prompt. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [body]);

  // Auto-save draft every 5 seconds if changed
  const triggerAutoSave = (text: string) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveDraft(text), 5000);
  };

  const saveDraft = async (text: string) => {
    if (!userId || !letterState?.current_seq || !letterState.prompt || text.length < 1) return;
    setSaving(true);
    try {
      await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          seq: letterState.current_seq,
          promptId: letterState.prompt.id,
          body: text,
          status: 'draft',
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent auto-save fail
    } finally {
      setSaving(false);
    }
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      setBody(val);
      setSaved(false);
      triggerAutoSave(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !letterState?.current_seq || !letterState.prompt) return;
    if (body.length < MIN_CHARS) {
      setError(`Your letter needs at least ${MIN_CHARS} characters.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    setUserWarning(null);

    try {
      const res = await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          seq: letterState.current_seq,
          promptId: letterState.prompt.id,
          body,
          status: 'submitted',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Could not submit your letter. Please try again.');
        return;
      }

      if (data.user_warning) {
        setUserWarning(data.user_warning);
        return; // Stay on page, show helpline message
      }

      // Success → letter reveal / pod home
      router.push('/pod/letters');
    } catch {
      setError('Could not submit your letter. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-wave-600 w-6 h-6" />
      </div>
    );
  }

  if (letterState?.all_done) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4 py-12">
        <div className="text-5xl">✉️</div>
        <div>
          <h1 className="font-serif text-2xl text-paper-900 mb-2">All letters written</h1>
          <p className="text-sm text-paper-800 leading-relaxed">
            That&apos;s everything for today. Your next letter arrives at {letterState.letter_hour}:00 tomorrow.
            See you at the table.
          </p>
        </div>
        <Link href="/pod" className="text-sm text-wave-700 hover:underline">Back to Pod Home</Link>
      </div>
    );
  }

  const seq = letterState?.current_seq;
  const prompt = letterState?.prompt;

  return (
    <div className="flex-1 flex flex-col py-4">
      {/* Back nav */}
      <nav className="mb-5">
        <Link href="/pod" className="inline-flex items-center gap-1.5 text-sm text-wave-700 hover:text-wave-800">
          <ArrowLeft className="w-4 h-4" />
          Pod Home
        </Link>
      </nav>

      <header className="mb-6 space-y-1">
        <span className="text-xs uppercase tracking-widest text-wave-700 font-semibold">
          Letter {seq} of 3
        </span>
        <h1 className="font-serif text-2xl text-paper-900 leading-tight">
          Write your letter
        </h1>
      </header>

      {/* Safety warning (self-harm keyword triggered) */}
      {userWarning && (
        <div
          role="alert"
          className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 leading-relaxed">{userWarning}</div>
          </div>
          <Link
            href="/pod"
            className="block w-full py-2 text-center text-xs font-medium text-wave-700 bg-white border border-wave-200 rounded-lg mt-2"
          >
            Back to Pod Home
          </Link>
        </div>
      )}

      {/* Error */}
      {error && !userWarning && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {!userWarning && (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5">
          {/* Prompt card */}
          {prompt && (
            <div className="p-4 bg-paper-100/80 border border-paper-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-paper-600 mb-2">
                <Info className="w-3.5 h-3.5" />
                <span>Today&apos;s prompt</span>
              </div>
              <p className="text-base font-serif text-paper-900 leading-snug italic">
                &ldquo;{prompt.body_en}&rdquo;
              </p>
            </div>
          )}

          {/* Write-to-unlock reminder */}
          <div className="flex items-start gap-2 px-1">
            <span className="text-paper-400 mt-0.5">⇄</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your letter unlocks your pod&apos;s letters for you. Once you submit, they arrive at {letterState?.letter_hour ?? 20}:00.
            </p>
          </div>

          {/* Textarea */}
          <div className="flex flex-col gap-2 flex-1">
            <label htmlFor="letter-body" className="sr-only">Your letter</label>
            <textarea
              id="letter-body"
              ref={textareaRef}
              value={body}
              onChange={handleBodyChange}
              placeholder="Write here…"
              className="w-full min-h-[200px] p-4 bg-white border border-paper-300 rounded-xl resize-none text-sm text-paper-900 placeholder-paper-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-wave-400 focus:border-wave-400 transition-colors font-serif"
              disabled={submitting}
              aria-describedby="char-guide"
            />
            <div id="char-guide">
              <CharGuide count={body.length} />
            </div>
          </div>

          {/* Save status */}
          <div className="flex items-center justify-between text-xs text-muted-foreground min-h-[18px]">
            {saving && (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving draft…
              </span>
            )}
            {saved && !saving && <span className="text-wave-600">Draft saved</span>}
            {!saving && !saved && <span />}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              id="write-letter-save-draft"
              disabled={saving || body.length < 1}
              onClick={() => saveDraft(body)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-wave-700 bg-paper-100 border border-paper-200 rounded-lg hover:bg-paper-200 transition-colors disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              Save draft
            </button>
            <button
              type="submit"
              id="write-letter-submit"
              disabled={submitting || body.length < MIN_CHARS}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold bg-wave-600 hover:bg-wave-700 disabled:bg-wave-300 text-white rounded-lg transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send letter
            </button>
          </div>

          <p className="text-[11px] text-center text-muted-foreground pb-2">
            Once sent, your letter cannot be edited. It will be shared with your pod.
          </p>
        </form>
      )}
    </div>
  );
}

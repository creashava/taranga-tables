'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, Send } from 'lucide-react';

interface PodMember {
  user_id: string;
  display_name: string;
}

interface Appreciation {
  id: string;
  author_name: string;
  body: string;
  created_at: string;
}

function SeenCardContent() {
  const [podMembers, setPodMembers] = useState<PodMember[]>([]);
  const [received, setReceived] = useState<Appreciation[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [body, setBody] = useState('');
  const [meetupId, setMeetupId] = useState('m-a1');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/me/pod').then((r) => r.json()),
      fetch('/api/pod/seen').then((r) => r.json()),
    ]).then(([podData, seenData]) => {
      if (podData.members) setPodMembers(podData.members);
      if (seenData.appreciations) setReceived(seenData.appreciations);
      if (podData.current_meetup) setMeetupId(podData.current_meetup.id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient || !body.trim()) return;
    if (body.trim().length < 10 || body.trim().length > 200) {
      setError('Write between 10 and 200 characters.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/pod/seen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetup_id: meetupId, recipient_id: selectedRecipient, body }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not submit.'); return; }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[var(--ink-muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-8 py-6">
      {/* Received Seen Cards */}
      {received.length > 0 && (
        <section aria-labelledby="received-heading">
          <h2 id="received-heading" className="text-xs uppercase tracking-wider text-[var(--ink-muted)] mb-3">
            Notes for you
          </h2>
          <ul className="space-y-3">
            {received.map((a) => (
              <li key={a.id} className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-5">
                <p className="text-sm text-[var(--ink)] leading-relaxed">"{a.body}"</p>
                <p className="mt-2 text-xs text-[var(--ink-muted)]">— {a.author_name}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Write a Seen Card */}
      <section aria-labelledby="write-seen-heading">
        <h2 id="write-seen-heading" className="text-xs uppercase tracking-wider text-[var(--ink-muted)] mb-3">
          {submitted ? 'Sent' : 'Write a Seen card'}
        </h2>

        {submitted ? (
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-6 text-center space-y-2">
            <Heart className="w-8 h-8 text-[var(--warm)] mx-auto" />
            <p className="text-sm text-[var(--ink)]">Your note is on its way to them at their letter time.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="seen-recipient" className="block text-sm font-medium text-[var(--ink)] mb-1.5">
                Who saw you clearly today?
              </label>
              <select
                id="seen-recipient"
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] text-sm focus-ring"
                required
              >
                <option value="">Choose a pod member</option>
                {podMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="seen-body" className="block text-sm font-medium text-[var(--ink)] mb-1.5">
                What specifically did they do or say that you noticed?
              </label>
              <textarea
                id="seen-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                maxLength={200}
                placeholder="Say one specific thing — 10 to 200 characters."
                className="w-full px-4 py-3 rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] text-sm leading-relaxed resize-none focus-ring"
                required
              />
              <div className="flex justify-between mt-1">
                {error && <p className="text-xs text-[var(--error)]">{error}</p>}
                <p className="ml-auto text-xs text-[var(--ink-muted)]">{body.length}/200</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || !selectedRecipient || body.trim().length < 10}
                className="flex-1 min-h-[52px] px-6 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-medium flex items-center justify-center gap-2 hover:opacity-95 focus-ring disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Sending…' : 'Send card'}
              </button>
              <Link
                href="/pod"
                className="flex-1 min-h-[52px] px-6 rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] font-medium flex items-center justify-center hover:bg-[var(--paper)] focus-ring text-center"
              >
                Not now
              </Link>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default function SeenPage() {
  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)] p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-md flex flex-col min-h-[90vh]">
        <header className="flex items-center justify-between py-4 border-b border-[var(--line)]">
          <Link href="/pod" className="flex items-center text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] focus-ring p-2 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Pod Home
          </Link>
          <span className="text-xs tracking-wider uppercase font-medium text-[var(--ink-muted)]">Seen Cards</span>
        </header>
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><p className="text-[var(--ink-muted)]">Loading…</p></div>}>
          <SeenCardContent />
        </Suspense>
      </div>
    </main>
  );
}

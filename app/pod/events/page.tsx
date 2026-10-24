'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';

interface TarangaEventCard {
  id: string;
  title: string;
  blurb: string;
  starts_at: string;
  ends_at: string;
  place_name: string;
  is_interested: boolean;
}

export default function EventsPage() {
  const [visible, setVisible] = useState(false);
  const [events, setEvents] = useState<TarangaEventCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/events')
      .then((r) => r.json())
      .then((data) => {
        setVisible(Boolean(data.visible));
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleInterest = async (eventId: string) => {
    setResponding(eventId);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      });
      if (res.ok) {
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, is_interested: true } : e))
        );
      }
    } finally {
      setResponding(null);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center p-6">
        <p className="text-[var(--ink-muted)]">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)] p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between py-4 border-b border-[var(--line)]">
          <Link href="/pod" className="flex items-center text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] focus-ring p-2 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Pod Home
          </Link>
          <span className="text-xs tracking-wider uppercase font-medium text-[var(--ink-muted)]">From Taranga</span>
        </header>

        {/* Taranga identity disclosure (N8) */}
        <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-4 text-xs text-[var(--ink-muted)] leading-relaxed">
          These events are run by <strong className="text-[var(--ink)]">Taranga</strong> — the community team behind this Wave.
          No pressure. Tap "Interested" if you'd like to be on their list.
        </div>

        {!visible ? (
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-8 text-center space-y-3">
            <p className="font-serif text-lg text-[var(--ink)]">Upcoming Taranga events</p>
            <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
              Events from Taranga will appear here once your Wave is complete.
            </p>
            <Link href="/pod" className="inline-block text-sm text-[var(--accent)] hover:underline focus-ring">
              Back to Pod Home
            </Link>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-6 text-center">
            <p className="text-sm text-[var(--ink-muted)]">No upcoming events right now. The Taranga team will be in touch soon.</p>
          </div>
        ) : (
          <ul className="space-y-5" aria-label="Taranga events">
            {events.map((event) => (
              <li key={event.id} className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 space-y-4">
                <div className="space-y-1.5">
                  <h2 className="font-serif text-xl text-[var(--ink)]">{event.title}</h2>
                  <p className="text-sm text-[var(--ink-muted)] leading-relaxed">{event.blurb}</p>
                </div>

                <div className="space-y-1.5 text-xs text-[var(--ink-muted)]">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{formatDate(event.starts_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{event.place_name}</span>
                  </div>
                </div>

                {/* N7: equal-size, no-guilt buttons. N6: no urgency copy. */}
                <div className="flex gap-3 pt-1">
                  {event.is_interested ? (
                    <div className="flex-1 min-h-[48px] rounded-xl bg-[var(--success-soft)] text-[var(--success)] text-sm font-medium flex items-center justify-center">
                      You're interested
                    </div>
                  ) : (
                    <button
                      type="button"
                      id={`interested-${event.id}`}
                      onClick={() => handleInterest(event.id)}
                      disabled={responding === event.id}
                      className="flex-1 min-h-[48px] rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] text-sm font-medium hover:opacity-95 focus-ring disabled:opacity-40"
                    >
                      {responding === event.id ? 'Saving…' : 'Interested'}
                    </button>
                  )}
                  <button
                    type="button"
                    id={`not-for-me-${event.id}`}
                    onClick={() => {
                      setEvents((prev) => prev.filter((e) => e.id !== event.id));
                    }}
                    className="flex-1 min-h-[48px] rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] text-sm font-medium hover:bg-[var(--paper)] focus-ring"
                  >
                    Not for me
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

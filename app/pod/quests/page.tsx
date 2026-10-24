'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Users, Stamp, Check } from 'lucide-react';

interface Bounty {
  id: string;
  title: string;
  description: string;
  waypoint_name: string;
  waypoint_area: string;
  group_min: number;
  starts_at: string;
  ends_at: string;
  host_contact: string;
  participant_count: number;
  has_joined: boolean;
}

interface Stamp {
  waypoint_name: string;
  stamped_at: string;
}

export default function QuestsPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/bounties')
      .then((r) => r.json())
      .then((data) => {
        if (data.bounties) setBounties(data.bounties);
        if (data.passport_stamps) setStamps(data.passport_stamps);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleJoin = async (bountyId: string) => {
    setJoining(bountyId);
    try {
      const res = await fetch('/api/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bounty_id: bountyId }),
      });
      if (res.ok) {
        setBounties((prev) =>
          prev.map((b) =>
            b.id === bountyId
              ? { ...b, has_joined: true, participant_count: b.participant_count + 1 }
              : b
          )
        );
      }
    } finally {
      setJoining(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center p-6">
        <p className="text-[var(--ink-muted)]">Loading quests...</p>
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
          <span className="text-xs tracking-wider uppercase font-medium text-[var(--ink-muted)]">Quests & Passport</span>
        </header>

        {/* Passport Stamps */}
        {stamps.length > 0 && (
          <section aria-labelledby="stamps-heading">
            <h2 id="stamps-heading" className="text-xs uppercase tracking-wider text-[var(--ink-muted)] mb-3">
              Your Passport
            </h2>
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-4 space-y-2">
              {stamps.map((s, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <Stamp className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span className="text-[var(--ink)]">{s.waypoint_name}</span>
                  <span className="ml-auto text-xs text-[var(--ink-muted)]">
                    {new Date(s.stamped_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Open Bounties */}
        <section aria-labelledby="bounties-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="bounties-heading" className="text-xs uppercase tracking-wider text-[var(--ink-muted)]">
              Open Bounties
            </h2>
            <span className="text-xs text-[var(--ink-muted)]">Groups of 4+, daylight hours</span>
          </div>

          {bounties.length === 0 ? (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-6 text-center">
              <p className="text-sm text-[var(--ink-muted)]">No open bounties right now. Check back soon.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {bounties.map((b) => (
                <li key={b.id} className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-5 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg text-[var(--ink)]">{b.title}</h3>
                    <p className="text-sm text-[var(--ink-muted)] leading-relaxed">{b.description}</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-[var(--ink-muted)]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{b.waypoint_name}, {b.waypoint_area}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span>Minimum {b.group_min} people · {b.participant_count} interested</span>
                    </div>
                    <p>
                      {formatDate(b.starts_at)} – {new Date(b.ends_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p>Host contact: {b.host_contact}</p>
                  </div>

                  {/* Equal-size action buttons (N7) */}
                  <div className="flex gap-3">
                    {b.has_joined ? (
                      <div className="flex-1 min-h-[44px] px-4 rounded-xl bg-[var(--success-soft)] text-[var(--success)] text-sm font-medium flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        You're in
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleJoin(b.id)}
                        disabled={joining === b.id}
                        className="flex-1 min-h-[44px] px-4 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] text-sm font-medium hover:opacity-95 focus-ring disabled:opacity-40"
                      >
                        {joining === b.id ? 'Joining…' : 'Join bounty'}
                      </button>
                    )}
                    <Link
                      href="/pod"
                      className="flex-1 min-h-[44px] px-4 rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] text-sm font-medium flex items-center justify-center hover:bg-[var(--paper)] focus-ring"
                    >
                      Not for me
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* N17 rules disclosure */}
        <div className="text-xs text-[var(--ink-muted)] leading-relaxed text-center pb-6">
          All quests are at public, verified locations. Taranga host is present.
          Daylight hours only (7 am – 6:30 pm).
        </div>
      </div>
    </main>
  );
}

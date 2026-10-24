'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Users, Check } from 'lucide-react';

interface EventSummary {
  id: string;
  title: string;
  blurb: string;
  starts_at: string;
  place_name: string;
  status: string;
  interested_count: number;
  attended_count: number;
  interested_members: Array<{ user_id: string; display_name: string; attended: boolean }>;
}

export default function HostEventsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', blurb: '', starts_at: '', ends_at: '', place_name: '', capacity: '' });
  const [creating, setCreating] = useState(false);

  const load = () => {
    fetch('/api/host/events')
      .then((r) => r.json())
      .then((d) => { setEvents(d.events || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch('/api/host/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...form }),
    });
    if (res.ok) { setShowCreate(false); load(); }
    setCreating(false);
  };

  const handleMarkAttended = async (userId: string, eventId: string) => {
    await fetch('/api/host/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_attendance', user_id: userId, event_id: eventId }),
    });
    load();
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center p-6">
        <p className="text-[var(--ink-muted)]">Loading events...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)] p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between py-4 border-b border-[var(--line)]">
          <Link href="/host" className="flex items-center text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] focus-ring p-2 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Host Home
          </Link>
          <span className="text-xs tracking-wider uppercase font-medium text-[var(--ink-muted)]">H10 Taranga Events</span>
        </header>

        <div className="flex justify-between items-center">
          <h1 className="font-serif text-xl text-[var(--ink)]">Events Console</h1>
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-[var(--ink)] text-[var(--paper)] hover:opacity-90 focus-ring"
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 space-y-4">
            <h2 className="font-medium text-sm text-[var(--ink)]">Create Taranga Event</h2>
            {[
              { id: 'ev-title', label: 'Title', key: 'title', type: 'text', required: true },
              { id: 'ev-blurb', label: 'Blurb (brief description)', key: 'blurb', type: 'textarea', required: true },
              { id: 'ev-place', label: 'Place / Venue name', key: 'place_name', type: 'text', required: true },
              { id: 'ev-starts', label: 'Starts at', key: 'starts_at', type: 'datetime-local', required: true },
              { id: 'ev-ends', label: 'Ends at', key: 'ends_at', type: 'datetime-local', required: true },
              { id: 'ev-cap', label: 'Capacity (optional)', key: 'capacity', type: 'number', required: false },
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-xs font-medium text-[var(--ink-muted)] mb-1">{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    id={f.id}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    required={f.required}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-sm resize-none focus-ring"
                  />
                ) : (
                  <input
                    id={f.id}
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    required={f.required}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] text-sm focus-ring"
                  />
                )}
              </div>
            ))}
            <div className="flex gap-3">
              <button type="submit" disabled={creating} className="flex-1 min-h-[44px] rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] text-sm font-medium hover:opacity-95 focus-ring disabled:opacity-40">
                {creating ? 'Creating…' : 'Publish event'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 min-h-[44px] rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] text-sm font-medium hover:bg-[var(--paper)] focus-ring">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Events List */}
        {events.length === 0 ? (
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-6 text-center">
            <p className="text-sm text-[var(--ink-muted)]">No events yet. Create the first one.</p>
          </div>
        ) : (
          <ul className="space-y-5">
            {events.map((event) => (
              <li key={event.id} className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-lg text-[var(--ink)]">{event.title}</h3>
                    <p className="text-xs text-[var(--ink-muted)] mt-0.5">{event.place_name} · {formatDate(event.starts_at)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${event.status === 'published' ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--paper)] border border-[var(--line)] text-[var(--ink-muted)]'}`}>
                    {event.status}
                  </span>
                </div>

                {/* Funnel Stats */}
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-[var(--ink)]">{event.interested_count}</p>
                    <p className="text-xs text-[var(--ink-muted)]">Interested</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-[var(--ink)]">{event.attended_count}</p>
                    <p className="text-xs text-[var(--ink-muted)]">Attended</p>
                  </div>
                </div>

                {/* Interested Members */}
                {event.interested_members.length > 0 && (
                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-[var(--ink-muted)] mb-2">
                      <Users className="w-3 h-3 inline mr-1" />
                      Interested members
                    </h4>
                    <ul className="space-y-1.5">
                      {event.interested_members.map((m) => (
                        <li key={m.user_id} className="flex items-center justify-between text-sm">
                          <span className="text-[var(--ink)]">{m.display_name}</span>
                          {m.attended ? (
                            <span className="text-xs text-[var(--success)] flex items-center gap-1">
                              <Check className="w-3 h-3" /> Attended
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarkAttended(m.user_id, event.id)}
                              className="text-xs px-3 py-1 rounded-lg border border-[var(--line)] text-[var(--ink-muted)] hover:text-[var(--ink)] focus-ring"
                            >
                              Mark attended
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

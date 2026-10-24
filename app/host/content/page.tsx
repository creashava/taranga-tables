'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Gamepad2, MapPin, Target, Inbox } from 'lucide-react';

interface ContentData {
  prompts: any[];
  games: any[];
  waypoints: any[];
  bounties: any[];
  outbox: any[];
}

type Tab = 'prompts' | 'games' | 'waypoints' | 'bounties' | 'outbox';

export default function HostContentPage() {
  const [data, setData] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('prompts');

  useEffect(() => {
    fetch('/api/host/content')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'prompts', label: 'Prompts', icon: <FileText className="w-4 h-4" /> },
    { key: 'games', label: 'Games', icon: <Gamepad2 className="w-4 h-4" /> },
    { key: 'waypoints', label: 'Waypoints', icon: <MapPin className="w-4 h-4" /> },
    { key: 'bounties', label: 'Bounties', icon: <Target className="w-4 h-4" /> },
    { key: 'outbox', label: 'Outbox', icon: <Inbox className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center p-6">
        <p className="text-[var(--ink-muted)]">Loading content console...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)] p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        <header className="flex items-center justify-between py-4 border-b border-[var(--line)]">
          <Link href="/host" className="flex items-center text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] focus-ring p-2 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Host Home
          </Link>
          <span className="text-xs tracking-wider uppercase font-medium text-[var(--ink-muted)]">H9 Content Console</span>
        </header>

        {/* Tab Nav */}
        <nav className="flex gap-1 bg-[var(--card)] border border-[var(--line)] rounded-xl p-1" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={activeTab === t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-medium transition-colors focus-ring ${
                activeTab === t.key
                  ? 'bg-[var(--ink)] text-[var(--paper)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        {data && (
          <div role="tabpanel">
            {activeTab === 'prompts' && (
              <ul className="space-y-3">
                {data.prompts.map((p) => (
                  <li key={p.id} className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--paper)] border border-[var(--line)] text-[var(--ink-muted)]">
                        {p.kind}
                      </span>
                      {!p.active && <span className="text-xs text-[var(--error)]">inactive</span>}
                    </div>
                    <p className="text-sm text-[var(--ink)] leading-relaxed">{p.body_en}</p>
                    {p.body_kn && <p className="text-xs text-[var(--ink-muted)] mt-1">{p.body_kn}</p>}
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'games' && (
              <ul className="space-y-3">
                {data.games.map((g) => (
                  <li key={g.id} className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm text-[var(--ink)]">{g.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${g.verified ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--paper)] border border-[var(--line)] text-[var(--ink-muted)]'}`}>
                        {g.verified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                    {g.region && <p className="text-xs text-[var(--ink-muted)] mb-2">{g.region} · {g.players_min}–{g.players_max} players</p>}
                    <p className="text-sm text-[var(--ink-muted)] leading-relaxed">{g.rules_summary}</p>
                    {g.source_note && <p className="text-xs text-[var(--ink-muted)] mt-1 italic">{g.source_note}</p>}
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'waypoints' && (
              <ul className="space-y-3">
                {data.waypoints.map((w) => (
                  <li key={w.id} className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm text-[var(--ink)]">{w.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${w.active ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--paper)] border border-[var(--line)] text-[var(--ink-muted)]'}`}>
                        {w.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ink-muted)] mb-2">{w.area}</p>
                    {w.safety_notes && <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{w.safety_notes}</p>}
                    <div className="flex gap-2 mt-2 text-xs text-[var(--ink-muted)]">
                      {w.staffed && <span className="px-2 py-0.5 bg-[var(--paper)] border border-[var(--line)] rounded-full">Staffed</span>}
                      {w.host_attended && <span className="px-2 py-0.5 bg-[var(--paper)] border border-[var(--line)] rounded-full">Host attends</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'bounties' && (
              <ul className="space-y-3">
                {data.bounties.map((b) => (
                  <li key={b.id} className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm text-[var(--ink)]">{b.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === 'open' ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--paper)] border border-[var(--line)] text-[var(--ink-muted)]'}`}>
                        {b.status}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--ink-muted)] mb-2">Min {b.group_min} people</p>
                    <p className="text-sm text-[var(--ink-muted)] leading-relaxed">{b.description}</p>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'outbox' && (
              <div className="space-y-3">
                {data.outbox.length === 0 ? (
                  <div className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-6 text-center">
                    <p className="text-sm text-[var(--ink-muted)]">No notifications in mock outbox yet.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {data.outbox.map((n) => (
                      <li key={n.id} className="bg-[var(--card)] border border-[var(--line)] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-[var(--ink)]">{n.kind}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${n.status === 'sent' ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-[var(--paper)] border border-[var(--line)] text-[var(--ink-muted)]'}`}>
                            {n.status}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{n.reason_text}</p>
                        <p className="text-xs text-[var(--ink-muted)] mt-1">→ {n.user_id} · {n.channel}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

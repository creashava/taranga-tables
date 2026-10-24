'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Sparkles, Shield, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface WaitlistMember {
  id: string;
  displayName: string;
  status: string;
  area: string;
  languages: string[];
  interests: string[];
  screeningBand: 'none' | 'mild' | 'elevated';
  hostFollowupDone: boolean;
  wantsWomenOnly: boolean;
}

interface PodSummary {
  id: string;
  name: string;
  status: string;
  arm: 'free' | 'deposit';
  deposit_inr: number;
  members: Array<{ userId: string; displayName: string }>;
}

export default function HostDashboardPage() {
  const [waitlist, setWaitlist] = useState<WaitlistMember[]>([]);
  const [pods, setPods] = useState<PodSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [wRes, pRes] = await Promise.all([
          fetch('/api/host/waitlist'),
          fetch('/api/host/pods'),
        ]);

        if (wRes.ok) {
          const wData = await wRes.json();
          setWaitlist(wData.waitlist || []);
        }

        if (pRes.ok) {
          const pData = await pRes.json();
          setPods(pData.pods || []);
        }
      } catch (err) {
        console.error('Failed to load host dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex-1 flex flex-col py-4 space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-wave-700 font-semibold">
            Host Console (Varun)
          </span>
          <span className="text-[10px] bg-paper-200 text-paper-800 px-2 py-0.5 rounded font-mono">
            Asia/Kolkata
          </span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-paper-900">
          Mysuru Pilot Command Center
        </h1>
        <p className="text-xs text-paper-800">
          Manage waitlists, human-in-the-loop matching, and 4-week pod waves.
        </p>
      </header>

      {/* Quick Match Action */}
      <div className="p-4 bg-paper-100 border border-paper-300 rounded-xl flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-paper-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-wave-600" />
            <span>Smart Pod Matching (Section 6)</span>
          </h2>
          <p className="text-xs text-paper-800 pt-0.5">
            Run greedy matching with hard constraints and plain-language explanations.
          </p>
        </div>
        <Link
          href="/host/suggestions"
          className="px-4 py-2 bg-wave-600 hover:bg-wave-700 text-white rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 shadow-sm"
        >
          <span>Review Suggestions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Active Pods Overview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-paper-900">
            Active Pods ({pods.length})
          </h2>
        </div>

        {pods.length === 0 ? (
          <div className="p-4 bg-paper-100 rounded-lg text-xs text-muted-foreground text-center">
            No active pods currently formed.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pods.map((pod) => (
              <div
                key={pod.id}
                className="p-3.5 bg-paper-100 border border-paper-200 rounded-lg hover:border-paper-300 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-paper-900">{pod.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                        pod.arm === 'deposit'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {pod.arm === 'deposit' ? `Deposit ₹${pod.deposit_inr}` : 'Free Arm'}
                    </span>
                  </div>
                  <Link
                    href={`/host/pods/${pod.id}`}
                    className="text-xs text-wave-700 hover:underline font-medium"
                  >
                    Manage Pod &rarr;
                  </Link>
                </div>

                <div className="text-xs text-paper-800">
                  <span className="font-medium text-paper-900">Members ({pod.members.length}/6): </span>
                  {pod.members.map((m) => m.displayName).join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Waitlist Section (H1) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-paper-900">
            Waitlist Pool ({waitlist.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-muted-foreground">Loading waitlist...</div>
        ) : waitlist.length === 0 ? (
          <div className="p-4 bg-paper-100 rounded-lg text-xs text-muted-foreground text-center">
            No members currently on waitlist.
          </div>
        ) : (
          <div className="space-y-2">
            {waitlist.map((m) => (
              <div
                key={m.id}
                className="p-3 bg-paper-100 border border-paper-200 rounded-lg flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-paper-900">{m.displayName}</span>
                    <span className="text-muted-foreground">• {m.area}</span>
                    {m.wantsWomenOnly && (
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-mono">
                        Women-only preferred
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-paper-800">
                    Interests: {m.interests.join(', ')} | Languages: {m.languages.join(', ')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {m.screeningBand === 'elevated' ? (
                    <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <AlertCircle className="w-3 h-3" />
                      {m.hostFollowupDone ? 'Followup Done' : 'Needs Host Call'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

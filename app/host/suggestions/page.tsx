'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { SuggestedPod } from '@/lib/matching/types';

export default function MatchSuggestionsPage() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<SuggestedPod[]>([]);
  const [unplacedCount, setUnplacedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSuggestions() {
      try {
        const res = await fetch('/api/host/match/suggest', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setUnplacedCount(data.unplacedCount || 0);
        } else {
          setError('Failed to compute match suggestions.');
        }
      } catch (err) {
        setError('Error reaching server.');
      } finally {
        setLoading(false);
      }
    }
    loadSuggestions();
  }, []);

  const handleApprovePod = async (pod: SuggestedPod) => {
    setApprovingId(pod.id);
    setError(null);
    try {
      const res = await fetch('/api/host/pods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pod.name,
          arm: pod.arm,
          depositInr: pod.arm === 'deposit' ? 200 : 0,
          womenOnly: pod.isWomenOnly,
          memberIds: pod.members.map((m) => m.id),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        setError(errJson.error || 'Failed to approve pod.');
        setApprovingId(null);
        return;
      }

      // Remove approved pod from suggestions
      setSuggestions((prev) => prev.filter((p) => p.id !== pod.id));
      router.push('/host');
    } catch (err) {
      setError('Network error approving pod.');
      setApprovingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col py-4 space-y-5">
      <header className="space-y-2">
        <Link
          href="/host"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-paper-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Host Console</span>
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-paper-900">
            Suggested Pods
          </h1>
          <span className="text-xs font-mono text-wave-700 bg-wave-50 px-2 py-0.5 rounded border border-wave-200">
            Human-in-the-Loop
          </span>
        </div>
        <p className="text-xs text-paper-800 leading-relaxed">
          The algorithm proposes pods meeting all Section 6.1 hard constraints. You inspect, edit, and approve each pod before members are notified.
        </p>
      </header>

      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          Running Section 6 matching algorithms...
        </div>
      ) : suggestions.length === 0 ? (
        <div className="p-6 bg-paper-100 border border-paper-200 rounded-xl text-center space-y-2">
          <p className="text-sm font-semibold text-paper-900">
            No compatible pods ready to form.
          </p>
          <p className="text-xs text-paper-800">
            There are {unplacedCount} waitlisted candidates awaiting more compatible evenings or language partners.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((pod) => (
            <div
              key={pod.id}
              className="p-4 bg-paper-100 border border-paper-300 rounded-xl space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-paper-200 pb-2">
                <div>
                  <h2 className="font-serif font-bold text-base text-paper-900">{pod.name}</h2>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-paper-200 text-paper-800">
                      Score: {pod.score}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
                        pod.arm === 'deposit'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {pod.arm === 'deposit' ? 'Deposit Arm (₹200)' : 'Free Arm'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={approvingId === pod.id}
                  onClick={() => handleApprovePod(pod)}
                  className="px-3.5 py-1.5 bg-wave-600 hover:bg-wave-700 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{approvingId === pod.id ? 'Approving...' : 'Approve Pod'}</span>
                </button>
              </div>

              {/* Plain-Language Explanation (Section 6.3 #3 & Acceptance Criteria) */}
              <div className="p-2.5 bg-paper-50 rounded-lg border border-paper-200 text-xs">
                <span className="font-semibold text-paper-900 block mb-0.5">Why these people:</span>
                <p className="text-paper-800 italic leading-snug">
                  "{pod.explanation}"
                </p>
              </div>

              {/* Members List */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-paper-900">
                  Proposed Members ({pod.members.length}/6):
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {pod.members.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 bg-paper-50 border border-paper-200 rounded-md space-y-0.5"
                    >
                      <div className="font-semibold text-paper-900">{m.displayName}</div>
                      <div className="text-[11px] text-muted-foreground">{m.area}</div>
                      <div className="text-[10px] text-paper-800 truncate">
                        {m.interests.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Check, X, CheckCircle2, Loader2, Info } from 'lucide-react';

interface StretchPrompt {
  id: string;
  kind: 'stretch';
  level: number;
  body_en: string;
  body_kn?: string;
}

interface StretchChoice {
  id: string;
  prompt_id: string;
  skipped: boolean;
  completed_at?: string;
}

export default function StretchPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [prompts, setPrompts] = useState<StretchPrompt[]>([]);
  const [choices, setChoices] = useState<Map<string, StretchChoice>>(new Map());
  const [podId, setPodId] = useState<string | null>(null);
  const [skipNotice, setSkipNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userId = typeof window !== 'undefined' ? (localStorage.getItem('taranga_user_id') ?? 'usr-a1') : 'usr-a1';

  useEffect(() => {
    async function loadData() {
      try {
        const podRes = await fetch('/api/me/pod', { headers: { 'x-user-id': userId } });
        if (!podRes.ok) throw new Error('Failed to load pod');
        const podData = await podRes.json();
        const pId = podData.pod.id;
        setPodId(pId);

        const stretchRes = await fetch(`/api/stretch?podId=${pId}&userId=${userId}`);
        if (stretchRes.ok) {
          const sData = await stretchRes.json();
          setPrompts(sData.prompts || []);
          const map = new Map<string, StretchChoice>();
          (sData.choices || []).forEach((c: StretchChoice) => map.set(c.prompt_id, c));
          setChoices(map);
        }
      } catch {
        setError('Could not load stretch challenges.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  const handleAction = async (promptId: string, action: 'choose' | 'skip' | 'complete') => {
    if (!podId) return;
    setSubmitting(true);
    setSkipNotice(null);
    setError(null);

    try {
      const res = await fetch('/api/stretch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          podId,
          promptId,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Action failed.');
        setSubmitting(false);
        return;
      }

      if (action === 'skip') {
        // Microcopy from SPEC Section 8.3: 'No problem. Maybe another time.'
        setSkipNotice(data.skip_message || 'No problem. Maybe another time.');
      }

      // Update choices map
      setChoices((prev) => {
        const next = new Map(prev);
        const existing = next.get(promptId);
        next.set(promptId, {
          id: existing?.id || `sc-${userId}-${podId}-${promptId}`,
          prompt_id: promptId,
          skipped: action === 'skip',
          completed_at: action === 'complete' ? new Date().toISOString() : existing?.completed_at,
        });
        return next;
      });
    } catch {
      setError('Network error updating stretch card.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-wave-600" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-5 pb-16">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/pod" className="p-1 text-paper-700 hover:text-paper-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-xl font-bold text-paper-900">Stretch Cards</h1>
          <p className="text-xs text-paper-700">Gentle personal challenges for your next table</p>
        </div>
      </div>

      {/* Intro info */}
      <div className="p-3.5 bg-paper-100 border border-paper-200 rounded-xl flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-wave-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-paper-800 leading-relaxed">
          Stretch cards are quiet, optional ways to experiment with connecting at the table. Take one on if you feel ready, or skip anytime — there is no penalty or score.
        </p>
      </div>

      {/* Skip Feedback Notice */}
      {skipNotice && (
        <div className="p-3 bg-paper-100 border border-paper-300 rounded-lg text-xs text-paper-800 font-medium">
          {skipNotice}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Cards */}
      <div className="space-y-4">
        {prompts.map((prompt) => {
          const choice = choices.get(prompt.id);
          const isCompleted = !!choice?.completed_at;
          const isSkipped = choice?.skipped;
          const isChosen = choice && !choice.skipped && !choice.completed_at;

          return (
            <div
              key={prompt.id}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                isCompleted
                  ? 'bg-green-50/60 border-green-200'
                  : isSkipped
                  ? 'bg-paper-100/50 border-paper-200 opacity-70'
                  : isChosen
                  ? 'bg-wave-50/70 border-wave-300 ring-1 ring-wave-200'
                  : 'bg-paper-100 border-paper-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-paper-700">
                  Level {prompt.level} Challenge
                </span>
                {isCompleted && (
                  <span className="text-[11px] font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                )}
                {isSkipped && (
                  <span className="text-[11px] text-muted-foreground bg-paper-200 px-2 py-0.5 rounded-full">
                    Skipped
                  </span>
                )}
                {isChosen && (
                  <span className="text-[11px] font-medium text-wave-700 bg-wave-100 px-2 py-0.5 rounded-full">
                    In Progress
                  </span>
                )}
              </div>

              <p className="font-serif text-sm text-paper-900 leading-relaxed">
                &ldquo;{prompt.body_en}&rdquo;
              </p>

              {/* Action Buttons — SPEC Section 8.1: 'skip is equal in size to accept' */}
              <div className="pt-2 border-t border-paper-200/70 flex gap-2">
                {isCompleted ? (
                  <p className="text-xs text-green-800 italic">Well done on stretching yourself.</p>
                ) : isChosen ? (
                  <>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleAction(prompt.id, 'complete')}
                      className="flex-1 py-2.5 px-3 bg-wave-600 hover:bg-wave-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark Completed
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleAction(prompt.id, 'skip')}
                      className="flex-1 py-2.5 px-3 bg-paper-200 hover:bg-paper-300 text-paper-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Skip for Now
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleAction(prompt.id, 'choose')}
                      className="flex-1 py-2.5 px-3 bg-wave-600 hover:bg-wave-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Try this Challenge
                    </button>
                    {/* Equal in size to accept button */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleAction(prompt.id, 'skip')}
                      className="flex-1 py-2.5 px-3 bg-paper-200 hover:bg-paper-300 text-paper-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      Skip
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-2">
        <Link href="/pod" className="text-xs text-wave-700 hover:underline">
          Return to Pod Home
        </Link>
      </div>
    </div>
  );
}

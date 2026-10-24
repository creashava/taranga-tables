'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, PhoneCall, HeartHandshake, CheckCircle2, UserCheck, Loader2, AlertCircle } from 'lucide-react';

interface PendingScreening {
  id: string;
  userId: string;
  displayName: string;
  area: string;
  band: string;
  createdAt: string;
  kind: 'elevated_screening';
}

interface PodWithdrawal {
  id: string;
  userId: string;
  displayName: string;
  podName: string;
  leftAt: string;
  kind: 'pod_withdrawal';
}

export default function CheckinFollowupsPage() {
  const [loading, setLoading] = useState(true);
  const [screenings, setScreenings] = useState<PendingScreening[]>([]);
  const [withdrawals, setWithdrawals] = useState<PodWithdrawal[]>([]);
  const [selectedScreening, setSelectedScreening] = useState<PendingScreening | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFollowups() {
      try {
        const res = await fetch('/api/host/followups');
        if (res.ok) {
          const data = await res.json();
          setScreenings(data.pendingScreenings || []);
          setWithdrawals(data.withdrawals || []);
        }
      } catch {
        setError('Error loading follow-ups.');
      } finally {
        setLoading(false);
      }
    }
    loadFollowups();
  }, []);

  const handleRecordPhoneCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScreening || !notes.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/host/screenings/${selectedScreening.id}/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes.trim() }),
      });

      if (res.ok) {
        setScreenings((prev) => prev.filter((s) => s.id !== selectedScreening.id));
        setSelectedScreening(null);
        setNotes('');
      }
    } catch {
      alert('Error recording follow-up.');
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
    <div className="max-w-xl mx-auto p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/host" className="p-1 text-paper-700 hover:text-paper-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-xl font-bold text-paper-900">
            H7 Check-in Follow-ups
          </h1>
          <p className="text-xs text-paper-700">Warm personal phone calls and check-ins</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Elevated Screening Applicants (AT4) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-paper-700">
          <span>Elevated Check-in Follow-ups (AT4)</span>
          <span className="text-[11px] font-normal text-muted-foreground">{screenings.length} pending call</span>
        </div>

        {screenings.length === 0 ? (
          <p className="text-xs text-muted-foreground p-3.5 bg-paper-100 rounded-xl">
            No applicants awaiting check-in calls.
          </p>
        ) : (
          <div className="space-y-2.5">
            {screenings.map((s) => (
              <div
                key={s.id}
                className="p-3.5 bg-paper-100 border border-paper-200 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-wave-600" />
                    <span className="font-semibold text-paper-900">{s.displayName}</span>
                    <span className="text-[11px] font-mono uppercase px-2 py-0.5 bg-amber-100 text-amber-900 rounded">
                      Elevated Band
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{s.area}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedScreening(s);
                    setNotes('');
                  }}
                  className="px-3 py-1.5 bg-wave-600 hover:bg-wave-700 text-white rounded text-xs font-medium"
                >
                  Record Phone Call
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Record Phone Call Modal */}
      {selectedScreening && (
        <div className="p-4 bg-paper-100 border border-paper-300 rounded-xl space-y-3">
          <h3 className="font-semibold text-xs text-paper-900">
            Record Phone Call with {selectedScreening.displayName}
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            A friendly, kind call to clarify expectations and ensure the format is safe and comfortable for them. Recording this call unlocks their eligibility for pod matching (AT4).
          </p>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Host notes (e.g. comfortable with cafe setting, happy with group of 6 strangers)..."
            required
            className="w-full p-2 text-xs bg-paper-50 border border-paper-300 rounded focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedScreening(null)}
              className="px-3 py-1.5 bg-paper-200 hover:bg-paper-300 text-paper-800 rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting || !notes.trim()}
              onClick={handleRecordPhoneCall}
              className="px-3 py-1.5 bg-wave-600 hover:bg-wave-700 disabled:opacity-50 text-white rounded text-xs font-semibold"
            >
              {submitting ? 'Recording...' : 'Mark Follow-up Done'}
            </button>
          </div>
        </div>
      )}

      {/* Pod Withdrawals (AT15) */}
      <section className="space-y-3 pt-2 border-t border-paper-200">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-paper-700">
          <span>Pod Withdrawals (AT15)</span>
          <span className="text-[11px] font-normal text-muted-foreground">{withdrawals.length} members</span>
        </div>

        {withdrawals.length === 0 ? (
          <p className="text-xs text-muted-foreground p-3.5 bg-paper-100 rounded-xl">
            No pod withdrawals recorded.
          </p>
        ) : (
          <div className="space-y-2.5">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="p-3.5 bg-paper-100 border border-paper-200 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-paper-500" />
                    <span className="font-semibold text-paper-900">{w.displayName}</span>
                    <span className="text-[11px] text-muted-foreground">({w.podName})</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Withdrew: {new Date(w.leftAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-[11px] text-paper-700 bg-paper-200 px-2.5 py-1 rounded">
                  Personal check-in suggested
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

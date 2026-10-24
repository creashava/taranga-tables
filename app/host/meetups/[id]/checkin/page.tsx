'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

interface MemberCheckin {
  userId: string;
  displayName: string;
  rsvp: string;
  deposit: string;
  attended: boolean;
}

interface MeetupData {
  meetup: {
    id: string;
    seq: number;
    starts_at: string;
    ends_at: string;
    status: string;
    venue_name: string | null;
  };
  pod: {
    id: string;
    name: string;
    arm: 'free' | 'deposit';
    deposit_inr: number;
  };
  members: MemberCheckin[];
}

export default function HostCheckinPage() {
  const params = useParams();
  const router = useRouter();
  const meetupId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [data, setData] = useState<MeetupData | null>(null);
  const [lowShowTask, setLowShowTask] = useState<string | null>(null);
  const [refundNotifications, setRefundNotifications] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/host/meetups/${meetupId}/checkin`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setError('Failed to load meetup.');
        }
      } catch {
        setError('Error loading meetup data.');
      } finally {
        setLoading(false);
      }
    }
    if (meetupId) load();
  }, [meetupId]);

  const handleCheckin = async (userId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/host/meetups/${meetupId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [userId] }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to check in member.');
        setSubmitting(false);
        return;
      }

      if (json.low_show_task) {
        setLowShowTask(json.low_show_task);
      }

      // Check if refunds were triggered (AT11)
      if (json.refunds_processed && json.refunds_processed.length > 0) {
        const msg = `Auto-refunded ₹${data?.pod.deposit_inr} hold for checked-in member (ref: ${json.refunds_processed[0].ref})`;
        setRefundNotifications((prev) => [...prev, msg]);
      }

      // Update state locally
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          members: prev.members.map((m) =>
            m.userId === userId ? { ...m, attended: true, deposit: prev.pod.arm === 'deposit' ? 'refunded' : m.deposit } : m
          ),
        };
      });
    } catch {
      setError('Network error processing checkin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseMeetup = async (noShowPolicy: 'forfeit' | 'refund') => {
    if (!confirm(`Close this meetup and apply "${noShowPolicy}" policy for no-shows?`)) return;

    setClosing(true);
    setError(null);
    try {
      const res = await fetch(`/api/host/meetups/${meetupId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noShowPolicy }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to close meetup.');
        setClosing(false);
        return;
      }

      alert('Meetup closed successfully.');
      if (data?.pod.id) {
        router.push(`/host/pods/${data.pod.id}`);
      }
    } catch {
      setError('Network error closing meetup.');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-wave-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto p-4 text-center space-y-3">
        <p className="text-xs text-red-600">Meetup not found</p>
        <Link href="/host" className="text-xs text-wave-700 underline">Return to Host Console</Link>
      </div>
    );
  }

  const attendedCount = data.members.filter((m) => m.attended).length;
  const isDepositArm = data.pod.arm === 'deposit';

  return (
    <div className="max-w-md mx-auto p-4 space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href={`/host/pods/${data.pod.id}`} className="p-1 text-paper-700 hover:text-paper-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-xl font-bold text-paper-900">
            H5 Check-in Console
          </h1>
          <p className="text-xs text-paper-700">
            Table #{data.meetup.seq} • {data.pod.name}
          </p>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="p-4 bg-paper-100 border border-paper-200 rounded-xl space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-paper-800">Attendance:</span>
          <span className="font-bold text-paper-900">
            {attendedCount} / {data.members.length} members checked in
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Venue: {data.meetup.venue_name || 'Cafe Table'}
        </p>
      </div>

      {/* Low Attendance Warning (AT21) */}
      {attendedCount > 0 && attendedCount < 4 && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Minimum Table Notice (AT21)</p>
            <p className="leading-relaxed mt-0.5">
              Only {attendedCount} member{attendedCount > 1 ? 's' : ''} checked in. Tables work best with 4+ members. Follow up kindly with no-shows after closing.
            </p>
          </div>
        </div>
      )}

      {/* Auto-refund notification banner (AT11) */}
      {refundNotifications.map((msg, i) => (
        <div key={i} className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-xs text-green-800">
          <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      ))}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Large Tap Target Members List (Designed for cafe mobile use) */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-paper-700">
          Tap Member to Check In
        </h2>

        {data.members.map((member) => (
          <div
            key={member.userId}
            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
              member.attended
                ? 'bg-green-50/70 border-green-300'
                : 'bg-paper-50 border-paper-200 hover:border-wave-300'
            }`}
          >
            <div className="space-y-1">
              <span className="font-semibold text-sm text-paper-900 block">
                {member.displayName}
              </span>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="capitalize">RSVP: {member.rsvp}</span>
                {isDepositArm && (
                  <>
                    <span>•</span>
                    <span className="capitalize font-mono">
                      Hold: {member.deposit}
                    </span>
                  </>
                )}
              </div>
            </div>

            {member.attended ? (
              <span className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
                Checked In
              </span>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleCheckin(member.userId)}
                className="px-5 py-3 bg-wave-600 hover:bg-wave-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-transform active:scale-95"
              >
                Check In
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Close Meetup Section */}
      <div className="pt-4 border-t border-paper-200 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-paper-700">
          End Meetup
        </h3>
        <p className="text-xs text-muted-foreground">
          Closing marks the table complete and applies the no-show deposit policy.
        </p>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={closing}
            onClick={() => handleCloseMeetup('refund')}
            className="flex-1 py-2.5 bg-paper-200 hover:bg-paper-300 rounded text-xs font-medium text-paper-800"
          >
            Close & Refund No-Shows
          </button>
          <button
            type="button"
            disabled={closing}
            onClick={() => handleCloseMeetup('forfeit')}
            className="flex-1 py-2.5 bg-paper-200 hover:bg-paper-300 rounded text-xs font-medium text-paper-800"
          >
            Close & Forfeit No-Shows
          </button>
        </div>
      </div>
    </div>
  );
}

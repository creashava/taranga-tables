'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Plus, MapPin, Users, CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react';

interface MeetupItem {
  id: string;
  seq: number;
  starts_at: string;
  ends_at: string;
  status: string;
  venue_name: string | null;
  venue_area: string | null;
  rsvp_yes_count: number;
  attendance_count: number;
}

export default function MeetupSchedulerPage() {
  const params = useParams();
  const router = useRouter();
  const podId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [meetups, setMeetups] = useState<MeetupItem[]>([]);
  const [seq, setSeq] = useState(1);
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('18:00');
  const [durationHours, setDurationHours] = useState('2');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadMeetups() {
      try {
        const res = await fetch(`/api/host/pods/${podId}/meetups`);
        if (res.ok) {
          const data = await res.json();
          setMeetups(data.meetups || []);
          const existingSeqs = (data.meetups || []).map((m: MeetupItem) => m.seq);
          for (let i = 1; i <= 3; i++) {
            if (!existingSeqs.includes(i)) {
              setSeq(i);
              break;
            }
          }
        }
      } catch {
        setError('Error loading pod meetups.');
      } finally {
        setLoading(false);
      }
    }
    if (podId) loadMeetups();
  }, [podId]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateStr) {
      setError('Please choose a date.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const startsAt = new Date(`${dateStr}T${timeStr}:00+05:30`).toISOString();
      const endsAt = new Date(new Date(startsAt).getTime() + Number(durationHours) * 3600000).toISOString();

      const res = await fetch(`/api/host/pods/${podId}/meetups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seq,
          startsAt,
          endsAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to schedule meetup.');
        setSubmitting(false);
        return;
      }

      setSuccess(data.message || `Table ${seq} scheduled successfully.`);
      // Refresh list
      const listRes = await fetch(`/api/host/pods/${podId}/meetups`);
      if (listRes.ok) {
        const lData = await listRes.json();
        setMeetups(lData.meetups || []);
      }
    } catch {
      setError('Network error scheduling meetup.');
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
    <div className="max-w-xl mx-auto p-4 space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href={`/host/pods/${podId}`} className="p-1 text-paper-700 hover:text-paper-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-xl font-bold text-paper-900">H4 Meetup Scheduler</h1>
          <p className="text-xs text-paper-700">Schedule in-person tables 1 to 3 for this pod</p>
        </div>
      </div>

      {/* Existing Meetups List */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-paper-700">
          Scheduled Meetups
        </h2>
        {meetups.length === 0 ? (
          <p className="text-xs text-muted-foreground p-4 bg-paper-100 rounded-lg">
            No meetups scheduled yet for this pod.
          </p>
        ) : (
          <div className="space-y-2">
            {meetups.map((m) => (
              <div
                key={m.id}
                className="p-3.5 bg-paper-100 border border-paper-200 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-wave-600" />
                    <span className="font-semibold text-paper-900">Table {m.seq}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-paper-200 uppercase">
                      {m.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {new Date(m.starts_at).toLocaleDateString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {m.venue_name && (
                    <p className="text-paper-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-wave-500" />
                      {m.venue_name} ({m.venue_area})
                    </p>
                  )}
                  <div className="flex gap-3 text-[11px] text-muted-foreground pt-1">
                    <span>{m.rsvp_yes_count} Confirmed RSVPs</span>
                    <span>•</span>
                    <span>{m.attendance_count} Attended</span>
                  </div>
                </div>

                <Link
                  href={`/host/meetups/${m.id}/checkin`}
                  className="px-3 py-1.5 bg-wave-600 hover:bg-wave-700 text-white rounded text-xs font-medium"
                >
                  Check-in Console
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Schedule Form */}
      {meetups.length < 3 && (
        <section className="p-4 bg-paper-50 border border-paper-300 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-paper-900 font-semibold text-xs uppercase tracking-wider">
            <Plus className="w-4 h-4 text-wave-600" />
            <span>Schedule Next Table</span>
          </div>

          <form onSubmit={handleSchedule} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-paper-800 mb-1">
                Table Sequence
              </label>
              <select
                value={seq}
                onChange={(e) => setSeq(Number(e.target.value))}
                className="w-full p-2 text-xs bg-paper-100 border border-paper-300 rounded"
              >
                {[1, 2, 3].map((num) => (
                  <option key={num} value={num} disabled={meetups.some((m) => m.seq === num)}>
                    Table #{num} {meetups.some((m) => m.seq === num) ? '(Already scheduled)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-paper-800 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full p-2 text-xs bg-paper-100 border border-paper-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-paper-800 mb-1">
                  Start Time (IST)
                </label>
                <input
                  type="time"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  className="w-full p-2 text-xs bg-paper-100 border border-paper-300 rounded"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-paper-800 mb-1">
                Duration (Hours)
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="w-full p-2 text-xs bg-paper-100 border border-paper-300 rounded"
              >
                <option value="1.5">1.5 hours</option>
                <option value="2">2.0 hours (default)</option>
                <option value="2.5">2.5 hours</option>
              </select>
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-2.5 bg-green-50 border border-green-200 rounded text-xs text-green-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-wave-600 hover:bg-wave-700 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors"
            >
              {submitting ? 'Scheduling...' : `Confirm Table ${seq} Schedule`}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Shield, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface MeetupInfo {
  id: string;
  seq: number;
  starts_at: string;
  ends_at: string;
  status: string;
  venue_name: string | null;
  venue_address: string | null;
  venue_area: string | null;
  pod_name: string;
  arm: 'free' | 'deposit';
  deposit_inr: number;
  current_rsvp: 'yes' | 'no' | 'maybe' | null;
  deposit_status: string | null;
}

export default function TableRsvpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-wave-600" />
        </div>
      }
    >
      <TableRsvpContent />
    </Suspense>
  );
}

function TableRsvpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const meetupId = searchParams.get('meetup');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [meetup, setMeetup] = useState<MeetupInfo | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [depositAgreed, setDepositAgreed] = useState(false); // R12: never pre-ticked
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const userId = typeof window !== 'undefined' ? (localStorage.getItem('taranga_user_id') ?? 'usr-a1') : 'usr-a1';

  useEffect(() => {
    async function fetchMeetup() {
      try {
        const res = await fetch('/api/me/pod', { headers: { 'x-user-id': userId } });
        if (res.ok) {
          const data = await res.json();
          const targetMeetup = data.next_meetup;
          if (targetMeetup) {
            setMeetup({
              id: targetMeetup.id,
              seq: targetMeetup.seq,
              starts_at: targetMeetup.starts_at,
              ends_at: targetMeetup.ends_at,
              status: 'scheduled',
              venue_name: targetMeetup.venue_name,
              venue_address: targetMeetup.venue_area ? `${targetMeetup.venue_name}, ${targetMeetup.venue_area}, Mysuru` : 'Mysuru',
              venue_area: targetMeetup.venue_area,
              pod_name: data.pod.name,
              arm: data.pod.arm,
              deposit_inr: data.pod.deposit_inr || 0,
              current_rsvp: null,
              deposit_status: null,
            });
          }
        }
      } catch (err) {
        setError('Could not load meetup details.');
      } finally {
        setLoading(false);
      }
    }
    fetchMeetup();
  }, [userId, meetupId]);

  const handleRsvp = async (response: 'yes' | 'no' | 'maybe') => {
    if (!meetup) return;
    setError(null);

    // If deposit arm and yes, user must actively confirm the terms (never pre-ticked)
    if (meetup.arm === 'deposit' && response === 'yes' && meetup.deposit_inr > 0 && !depositAgreed) {
      setError('Please review and confirm the deposit terms below before RSVPing yes.');
      setSelectedResponse(response);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          meetupId: meetup.id,
          response,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit RSVP.');
        setSubmitting(false);
        return;
      }

      setSelectedResponse(response);
      if (response === 'yes') {
        setSuccessMessage(
          meetup.arm === 'deposit' && meetup.deposit_inr > 0
            ? `Your seat is reserved. A hold of ₹${meetup.deposit_inr} has been created and will be refunded upon check-in.`
            : 'Your seat is reserved. See you at the table.'
        );
      } else if (response === 'no') {
        setSuccessMessage('Thank you for letting us know. We hope to see you at the next table.');
      } else {
        setSuccessMessage('Thank you for your update. Please confirm when your schedule is clear.');
      }
    } catch {
      setError('Network error submitting RSVP.');
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

  if (!meetup) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4 text-center">
        <h1 className="font-serif text-xl text-paper-900">No Meetup Scheduled</h1>
        <p className="text-xs text-paper-700">There is currently no upcoming meetup scheduled for your pod.</p>
        <Link href="/pod" className="inline-block text-xs text-wave-700 hover:underline">
          Return to Pod Home
        </Link>
      </div>
    );
  }

  const meetupDate = new Date(meetup.starts_at);
  const formattedDate = meetupDate.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = meetupDate.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-md mx-auto p-4 space-y-5 pb-16">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/pod" className="p-1 text-paper-700 hover:text-paper-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-xl font-bold text-paper-900">
            Table {meetup.seq} Invitation
          </h1>
          <p className="text-xs text-paper-700">{meetup.pod_name}</p>
        </div>
      </div>

      {/* Meetup Details Card */}
      <div className="p-4 bg-paper-100 border border-paper-200 rounded-xl space-y-3">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-wave-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-paper-700">When</p>
            <p className="text-sm font-medium text-paper-900">{formattedDate}</p>
            <p className="text-xs text-muted-foreground">{formattedTime} IST</p>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-2 border-t border-paper-200">
          <MapPin className="w-5 h-5 text-wave-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-paper-700">Where</p>
            <p className="text-sm font-medium text-paper-900">{meetup.venue_name || 'Cafe in Mysuru'}</p>
            <p className="text-xs text-muted-foreground">{meetup.venue_address}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-2 border-t border-paper-200">
          <Shield className="w-5 h-5 text-wave-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-paper-700">What to Expect & Safety</p>
            <p className="text-xs text-paper-800 leading-relaxed mt-0.5">
              A private table in a calm public cafe. Your host will be there to welcome you. Conversation cards are available if you want them, or you can just talk naturally. No performance, no pressure.
            </p>
          </div>
        </div>
      </div>

      {/* Deposit Arm Terms (Section 8.3 & AT11) */}
      {meetup.arm === 'deposit' && meetup.deposit_inr > 0 && (
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-medium text-xs">
            <Clock className="w-4 h-4 text-amber-700" />
            <span>Refundable Table Deposit: ₹{meetup.deposit_inr}</span>
          </div>
          {/* Microcopy strictly follows Section 8.3 */}
          <p className="text-xs text-amber-950 leading-relaxed">
            This is a refundable deposit of ₹{meetup.deposit_inr}. You get it back automatically when the host checks you in. If you can&apos;t come, tell us before 24 hours of the meetup and you get it back anyway.
          </p>
          <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
            <input
              type="checkbox"
              id="deposit-agreement-toggle"
              checked={depositAgreed}
              onChange={(e) => setDepositAgreed(e.target.checked)}
              className="mt-0.5 rounded border-amber-400 text-wave-600 focus:ring-wave-500"
            />
            <span className="text-xs text-amber-900 font-medium">
              I understand the refundable deposit terms.
            </span>
          </label>
        </div>
      )}

      {/* Feedback Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-xs text-green-800">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-green-900">RSVP Confirmed</p>
            <p className="leading-relaxed">{successMessage}</p>
            <div className="pt-2 flex gap-3">
              <Link href="/pod/table/day" className="font-medium text-green-800 underline">
                View Table Day Guide
              </Link>
              <Link href="/pod" className="font-medium text-green-800 underline">
                Return to Pod
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* RSVP Action Buttons */}
      {!successMessage && (
        <div className="space-y-3 pt-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-paper-700 text-center">
            Will you attend Table {meetup.seq}?
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              id="rsvp-yes-btn"
              disabled={submitting}
              onClick={() => handleRsvp('yes')}
              className={`py-3 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                selectedResponse === 'yes'
                  ? 'bg-wave-700 text-white border-wave-700'
                  : 'bg-wave-600 hover:bg-wave-700 text-white border-transparent'
              }`}
            >
              {submitting ? '...' : 'Yes, I’ll be there'}
            </button>

            <button
              type="button"
              id="rsvp-maybe-btn"
              disabled={submitting}
              onClick={() => handleRsvp('maybe')}
              className={`py-3 px-2 rounded-lg text-xs font-medium border transition-all text-center ${
                selectedResponse === 'maybe'
                  ? 'bg-paper-300 text-paper-900 border-paper-400'
                  : 'bg-paper-100 hover:bg-paper-200 text-paper-800 border-paper-300'
              }`}
            >
              Maybe
            </button>

            <button
              type="button"
              id="rsvp-no-btn"
              disabled={submitting}
              onClick={() => handleRsvp('no')}
              className={`py-3 px-2 rounded-lg text-xs font-medium border transition-all text-center ${
                selectedResponse === 'no'
                  ? 'bg-paper-300 text-paper-900 border-paper-400'
                  : 'bg-paper-100 hover:bg-paper-200 text-paper-800 border-paper-300'
              }`}
            >
              Can’t make it
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            You can change your response up to 24 hours before the table starts.
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Users, Compass, Star, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function ClosingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nextStepChoice, setNextStepChoice] = useState<'keep_table' | 'strangers_co' | 'part_kindly' | null>(null);
  const [feltSafe, setFeltSafe] = useState<number>(5);
  const [feltIncluded, setFeltIncluded] = useState<number>(5);
  const [wouldReturn, setWouldReturn] = useState<boolean>(true);
  const [freeText, setFreeText] = useState('');
  const [shareWithHost, setShareWithHost] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [meetupId, setMeetupId] = useState<string>('m-a-3');
  const [error, setError] = useState<string | null>(null);

  const userId = typeof window !== 'undefined' ? (localStorage.getItem('taranga_user_id') ?? 'usr-a1') : 'usr-a1';

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/me/pod', { headers: { 'x-user-id': userId } });
        if (res.ok) {
          const data = await res.json();
          if (data.next_meetup) {
            setMeetupId(data.next_meetup.id);
          }
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          meetupId,
          feltSafe,
          feltIncluded,
          wouldReturn,
          freeText: freeText.trim() || undefined,
          shareWithHost,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to submit feedback.');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Network error submitting feedback.');
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
    <div className="max-w-md mx-auto p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/pod" className="p-1 text-paper-700 hover:text-paper-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-xl font-bold text-paper-900">
            Wave Closing & Feedback
          </h1>
          <p className="text-xs text-paper-700">Four weeks. One table. What comes next?</p>
        </div>
      </div>

      {/* The 3 Paths (Section 8.1 M14) */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-paper-700">
          Choose Your Next Chapter
        </h2>

        <div className="space-y-2">
          {/* Option 1: Keep the Table */}
          <button
            type="button"
            onClick={() => setNextStepChoice('keep_table')}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              nextStepChoice === 'keep_table'
                ? 'bg-wave-50 border-wave-400 ring-1 ring-wave-300'
                : 'bg-paper-100 hover:bg-paper-200 border-paper-200'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-xs text-paper-900 mb-1">
              <Users className="w-4 h-4 text-wave-600" />
              <span>Keep the Table</span>
            </div>
            <p className="text-xs text-paper-800 leading-relaxed">
              Continue meeting with your pod on your own schedule. We will share a simple WhatsApp group link so you can self-organize future tables.
            </p>
          </button>

          {/* Option 2: Join Strangers & Co */}
          <button
            type="button"
            onClick={() => setNextStepChoice('strangers_co')}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              nextStepChoice === 'strangers_co'
                ? 'bg-wave-50 border-wave-400 ring-1 ring-wave-300'
                : 'bg-paper-100 hover:bg-paper-200 border-paper-200'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-xs text-paper-900 mb-1">
              <Compass className="w-4 h-4 text-wave-600" />
              <span>Join Strangers & Co</span>
            </div>
            <p className="text-xs text-paper-800 leading-relaxed">
              Step into the broader Mysuru alumni community with occasional open tables, book swaps, and group walks.
            </p>
          </button>

          {/* Option 3: Part kindly */}
          <button
            type="button"
            onClick={() => setNextStepChoice('part_kindly')}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              nextStepChoice === 'part_kindly'
                ? 'bg-wave-50 border-wave-400 ring-1 ring-wave-300'
                : 'bg-paper-100 hover:bg-paper-200 border-paper-200'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-xs text-paper-900 mb-1">
              <Heart className="w-4 h-4 text-wave-600" />
              <span>Part Kindly</span>
            </div>
            <p className="text-xs text-paper-800 leading-relaxed">
              Complete your Wave with warm gratitude and no ongoing obligations. You can always sign up for another Wave later.
            </p>
          </button>
        </div>
      </section>

      {/* 2-minute Feedback Form */}
      <section className="p-4 bg-paper-100 border border-paper-200 rounded-xl space-y-4">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-paper-900">
            2-Minute Anonymous Feedback
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Peer feedback is strictly anonymous.
          </p>
        </div>

        {submitted ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-800">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>Thank you! Your feedback has been safely recorded.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
            {/* Felt safe */}
            <div>
              <label className="block font-medium text-paper-900 mb-1.5">
                How safe did you feel throughout the Wave? (1 to 5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFeltSafe(val)}
                    className={`flex-1 py-1.5 rounded font-medium border text-center transition-colors ${
                      feltSafe === val
                        ? 'bg-wave-600 text-white border-wave-600'
                        : 'bg-paper-50 text-paper-800 border-paper-300 hover:bg-paper-200'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Felt included */}
            <div>
              <label className="block font-medium text-paper-900 mb-1.5">
                How included did you feel at the tables? (1 to 5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFeltIncluded(val)}
                    className={`flex-1 py-1.5 rounded font-medium border text-center transition-colors ${
                      feltIncluded === val
                        ? 'bg-wave-600 text-white border-wave-600'
                        : 'bg-paper-50 text-paper-800 border-paper-300 hover:bg-paper-200'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Would return */}
            <div>
              <label className="block font-medium text-paper-900 mb-1.5">
                Would you join another Taranga Wave?
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="would_return"
                    checked={wouldReturn === true}
                    onChange={() => setWouldReturn(true)}
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="would_return"
                    checked={wouldReturn === false}
                    onChange={() => setWouldReturn(false)}
                  />
                  <span>No / Undecided</span>
                </label>
              </div>
            </div>

            {/* Free text */}
            <div>
              <label className="block font-medium text-paper-900 mb-1">
                Any reflections or suggestions?
              </label>
              <textarea
                rows={3}
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="What went well? What could be better? (Optional)..."
                className="w-full p-2 bg-paper-50 border border-paper-300 rounded text-xs text-paper-900"
              />
            </div>

            {/* Share with host consent */}
            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={shareWithHost}
                onChange={(e) => setShareWithHost(e.target.checked)}
                className="mt-0.5 rounded border-paper-300 text-wave-600 focus:ring-wave-500"
              />
              <span className="text-[11px] text-paper-800">
                Share my written reflections with my host Varun (uncheck to keep purely anonymous).
              </span>
            </label>

            {error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-wave-600 hover:bg-wave-700 text-white rounded text-xs font-semibold transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        )}
      </section>

      <div className="text-center pt-2">
        <Link href="/pod" className="text-xs text-wave-700 hover:underline">
          Return to Pod Home
        </Link>
      </div>
    </div>
  );
}

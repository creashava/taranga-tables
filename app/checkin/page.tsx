'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HeartHandshake, Phone, ArrowRight } from 'lucide-react';
import checkinConfig from '@/config/checkin.json';

export default function CheckinPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('usr-test');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [elevatedResult, setElevatedResult] = useState<{
    message: string;
    resources: Array<{ name: string; contact: string }>;
  } | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('taranga_user_id');
    if (storedId) setUserId(storedId);
  }, []);

  const handleSelectOption = (questionId: string, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate that all questions are answered
    const unanswered = checkinConfig.items.some((item) => answers[item.id] === undefined);
    if (unanswered) {
      setError('Please provide an answer for all three questions.');
      return;
    }

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          answers,
        }),
      });

      if (!res.ok) {
        setError('Error submitting check-in. Please try again.');
        return;
      }

      const data = await res.json();

      if (data.band === 'elevated') {
        // Show supportive triage screen with Tele-MANAS helpline details (AT4)
        setElevatedResult({
          message: data.helplineMessage,
          resources: data.resources,
        });
      } else {
        router.push('/waitlist');
      }
    } catch (err) {
      setError('Failed to reach server. Please try again.');
    }
  };

  if (elevatedResult) {
    return (
      <div className="flex-1 flex flex-col justify-center py-6 space-y-5 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-wave-100 flex items-center justify-center text-wave-700">
          <HeartHandshake className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-paper-900">
            We are here for you
          </h1>
          <p className="text-sm text-paper-800 leading-relaxed max-w-sm mx-auto">
            {elevatedResult.message}
          </p>
        </div>

        <div className="p-4 bg-paper-100 border border-paper-300 rounded-lg max-w-sm mx-auto text-left space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Free 24/7 Crisis & Mental Health Helplines
          </span>
          {elevatedResult.resources.map((r) => (
            <div key={r.contact} className="flex items-center justify-between text-xs">
              <span className="text-paper-900 font-medium">{r.name}:</span>
              <a
                href={`tel:${r.contact}`}
                className="font-mono font-bold text-wave-700 hover:underline flex items-center gap-1"
              >
                <Phone className="w-3 h-3" /> {r.contact}
              </a>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground pt-2 max-w-xs mx-auto">
          Our host Varun will reach out personally for a gentle check-in before any pod placement.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-between py-4">
      <header className="space-y-2 mb-4">
        <span className="text-xs uppercase tracking-widest text-wave-700 font-semibold">
          A Taranga project
        </span>
        <h1 className="font-serif text-2xl font-bold text-paper-900">Check-in</h1>
        <p className="text-xs text-paper-800 leading-relaxed">
          Three quick questions so we can look after everyone properly. This isn't a test, and we only keep a simple result, not your answers.
        </p>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 my-auto">
        {checkinConfig.items.map((item, qIdx) => (
          <fieldset key={item.id} className="space-y-2">
            <legend className="text-xs font-semibold text-paper-900">
              {qIdx + 1}. {item.prompt}
            </legend>
            <div className="grid grid-cols-1 gap-1.5">
              {item.options.map((opt) => {
                const isSelected = answers[item.id] === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                      isSelected
                        ? 'bg-wave-50 border-wave-600 text-wave-900 font-medium'
                        : 'bg-paper-100 border-paper-200 text-paper-800 hover:bg-paper-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name={item.id}
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => handleSelectOption(item.id, opt.value)}
                      className="accent-wave-600"
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

        <button
          type="submit"
          className="w-full mt-4 py-3 px-4 bg-wave-600 hover:bg-wave-700 text-white font-medium rounded-md text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Complete Check-in</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

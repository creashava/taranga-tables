'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';

interface OpenerCard {
  id: string;
  prompt: string;
  is_pivot?: boolean;
}

export default function OpenerPage() {
  const [cards, setCards] = useState<OpenerCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [podName, setPodName] = useState('Your Pod');
  const [arm, setArm] = useState<'peeve' | 'favourites' | 'none'>('peeve');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetch('/api/pod/opener')
      .then((res) => res.json())
      .then((data) => {
        if (data.cards) {
          setCards(data.cards);
          setPodName(data.pod_name || 'Your Pod');
          setArm(data.opener_arm || 'peeve');
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex items-center justify-center p-6">
        <p className="text-[var(--ink-muted)]">Loading Table Opener...</p>
      </main>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)] p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full max-w-md flex flex-col min-h-[90vh]">
        {/* Header */}
        <header className="flex items-center justify-between py-4 border-b border-[var(--line)]">
          <Link
            href="/pod"
            className="flex items-center text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] focus-ring p-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Pod Home
          </Link>
          <span className="text-xs tracking-wider uppercase font-medium text-[var(--ink-muted)]">
            Table 1 Opener
          </span>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center py-8">
          {!completed && currentCard ? (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <span className="text-xs uppercase tracking-wider text-[var(--ink-muted)]">
                  {arm === 'peeve' ? (currentCard.is_pivot ? 'The Pivot' : 'Peeve Card') : 'Favourite Card'}
                </span>
                <p className="text-xs text-[var(--ink-muted)]">
                  Card {currentIndex + 1} of {cards.length}
                </p>
              </div>

              {/* Paper Card */}
              <div
                className={`bg-[var(--card)] border border-[var(--line)] rounded-2xl p-8 shadow-sm transition-all duration-200 ${
                  currentCard.is_pivot ? 'border-l-4 border-l-[var(--accent)]' : 'border-l-4 border-l-[var(--warm)]'
                }`}
              >
                <h2 className="font-serif text-xl sm:text-2xl leading-relaxed text-[var(--ink)]">
                  "{currentCard.prompt}"
                </h2>
              </div>

              {/* Ground Rule Note */}
              <div className="bg-[var(--paper)] border border-[var(--line)] rounded-xl p-4 text-xs text-[var(--ink-muted)] text-center leading-relaxed">
                Phones go in the basket after this card. One person speaks at a time.
              </div>

              {/* Equal Size Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 min-h-[52px] px-6 rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-medium text-base hover:opacity-95 focus-ring"
                >
                  {currentIndex === cards.length - 1 ? 'Finish opener' : 'Next card'}
                </button>
                <Link
                  href="/pod"
                  className="flex-1 min-h-[52px] px-6 rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] font-medium text-base flex items-center justify-center hover:bg-[var(--paper)] focus-ring text-center"
                >
                  Done
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-8 text-center space-y-6 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[var(--success-soft)] text-[var(--success)] flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="font-serif text-2xl text-[var(--ink)]">Cards Completed</h2>
                <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
                  Put your phone into the table basket. Enjoy your time together with {podName}.
                </p>
              </div>
              <Link
                href="/pod"
                className="inline-block w-full min-h-[52px] leading-[52px] rounded-xl bg-[var(--accent)] text-[var(--accent-ink)] font-medium text-base hover:opacity-95 focus-ring text-center"
              >
                Return to Pod Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

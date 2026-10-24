'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Shield, Sparkles } from 'lucide-react';

export default function WaitlistPage() {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // In local demo, grab user name if available
    const stored = localStorage.getItem('taranga_user_displayName');
    if (stored) setUserName(stored);
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-between py-6">
      <header className="space-y-2">
        <span className="text-xs uppercase tracking-widest text-wave-700 font-semibold">
          A Taranga project
        </span>
        <h1 className="font-serif text-3xl font-bold text-paper-900 tracking-tight">
          You're on the Waitlist
        </h1>
        <p className="text-sm text-paper-800 leading-relaxed">
          {userName ? `Thank you, ${userName}. ` : ''}
          Your profile and preferences have been thoughtfully recorded for Wave 1 in Mysuru.
        </p>
      </header>

      <div className="my-8 space-y-4">
        <div className="p-5 bg-paper-100 border border-paper-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-wave-700">
            <Clock className="w-4 h-4" />
            <span>Honest Status</span>
          </div>
          <p className="text-sm text-paper-900 font-medium">
            Matching in progress by our human host
          </p>
          <p className="text-xs text-paper-800 leading-relaxed">
            We do not use fake queue counters or artificial scarcity. Our host Varun manually reviews candidate pods of 6 people to ensure at least two shared evenings, compatible languages, and balanced conversational comfort.
          </p>
        </div>

        <div className="p-4 bg-paper-100/60 border border-paper-200 rounded-lg space-y-2 text-xs text-paper-800">
          <div className="flex items-center gap-2 font-semibold text-paper-900">
            <Sparkles className="w-4 h-4 text-wave-600" />
            <span>What happens next?</span>
          </div>
          <p>
            When your pod is confirmed, you will receive an invitation email. You'll then begin slow, write-to-unlock letters with your five pod members before meeting at your first hosted cafe table.
          </p>
        </div>
      </div>

      <footer className="space-y-3 pt-4 border-t border-paper-200">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-wave-600" /> Public cafes only
          </span>
          <span>Mysuru, India</span>
        </div>
        <Link
          href="/"
          className="block w-full py-2.5 text-center text-xs font-medium text-wave-700 hover:text-wave-800 bg-paper-200/60 hover:bg-paper-200 rounded-md transition-colors"
        >
          Return to Overview
        </Link>
      </footer>
    </div>
  );
}

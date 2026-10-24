'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface ConsentItem {
  purpose: 'core_service' | 'safety_checkin' | 'whatsapp_contact' | 'content_photos';
  title: string;
  description: string;
  required: boolean;
}

const CONSENT_DEFINITIONS: ConsentItem[] = [
  {
    purpose: 'core_service',
    title: 'Pod Matching & Wave Coordination',
    description:
      'Allows us to place you in a 6-person stranger pod, deliver write-to-unlock letters, and arrange your 3 cafe tables.',
    required: true,
  },
  {
    purpose: 'safety_checkin',
    title: 'Safety & Wellbeing Follow-Up',
    description:
      'Allows our host to reach out via phone or email if you request safety support, file a report, or have an elevated check-in.',
    required: true,
  },
  {
    purpose: 'whatsapp_contact',
    title: 'Host WhatsApp Reminders',
    description:
      'Allows your host to send meeting reminders and cafe directions via WhatsApp. You can withdraw this at any time in settings.',
    required: false,
  },
  {
    purpose: 'content_photos',
    title: 'Photo & Media Consent (Optional)',
    description:
      'Allows the team to photograph pod tables for community archives. Default is no.',
    required: false,
  },
];

export default function ConsentsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('usr-test');
  const [error, setError] = useState<string | null>(null);

  // AT2: All toggles are UNTICKED by default!
  const [consents, setConsents] = useState<Record<string, boolean>>({
    core_service: false,
    safety_checkin: false,
    whatsapp_contact: false,
    content_photos: false,
  });

  useEffect(() => {
    const storedId = localStorage.getItem('taranga_user_id');
    if (storedId) setUserId(storedId);
  }, []);

  const handleToggle = (purpose: string) => {
    setConsents((prev) => ({
      ...prev,
      [purpose]: !prev[purpose],
    }));
  };

  const handleSubmit = async () => {
    setError(null);

    // Core service and safety checkin are required to participate
    if (!consents.core_service || !consents.safety_checkin) {
      setError('Please agree to core service coordination and safety check-in to continue.');
      return;
    }

    try {
      // Save each purpose separately per Section 7.1 / AT2
      for (const [purpose, granted] of Object.entries(consents)) {
        await fetch('/api/consents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            purpose,
            noticeVersion: '1.0',
            granted,
          }),
        });
      }

      router.push('/checkin');
    } catch (err) {
      setError('Failed to record consent. Please try again.');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-4">
      <header className="space-y-2 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-wave-700 font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Clear & Standalone Consent</span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-paper-900">Your Privacy Choices</h1>
        <p className="text-xs text-paper-800 leading-relaxed">
          Under India’s DPDP Act, every consent is separate, unbundled, and withdrawable. None are pre-ticked.
        </p>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-xs">
          {error}
        </div>
      )}

      <div className="space-y-3 my-auto">
        {CONSENT_DEFINITIONS.map((item) => {
          const isChecked = consents[item.purpose];
          return (
            <div
              key={item.purpose}
              onClick={() => handleToggle(item.purpose)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                isChecked
                  ? 'bg-wave-50/70 border-wave-500'
                  : 'bg-paper-100 border-paper-300 hover:bg-paper-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id={`consent-${item.purpose}`}
                  checked={isChecked}
                  onChange={() => {}} // Handled by container onClick
                  className="mt-1 accent-wave-600 rounded cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`consent-${item.purpose}`}
                      className="text-xs font-semibold text-paper-900 cursor-pointer"
                    >
                      {item.title}
                    </label>
                    {item.required && (
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">
                        (Required)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-paper-800 leading-snug">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="pt-4 border-t border-paper-200">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3 px-4 bg-wave-600 hover:bg-wave-700 text-white font-medium rounded-md text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <span>Confirm Choices & Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}

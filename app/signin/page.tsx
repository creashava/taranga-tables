'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, KeyRound } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError('Please enter the 6-digit code (Use 123456 in prototype).');
      return;
    }
    // Store authenticated email / generated ID in localStorage for prototype demo
    const userId = `usr-${Date.now().toString(36)}`;
    localStorage.setItem('taranga_user_id', userId);
    localStorage.setItem('taranga_user_email', email);

    router.push('/onboarding');
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-6">
      <div className="space-y-2 mb-8">
        <span className="text-xs uppercase tracking-widest text-wave-700 font-semibold">
          A Taranga project
        </span>
        <h1 className="font-serif text-2xl font-bold text-paper-900">
          {step === 'email' ? 'Sign in with Email' : 'Check your inbox'}
        </h1>
        <p className="text-sm text-paper-800">
          {step === 'email'
            ? 'We will send a one-time passkey to your email. No passwords needed.'
            : `We sent a 6-digit code to ${email}. (Enter 123456 for prototype demo).`}
        </p>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-xs">
          {error}
        </div>
      )}

      {step === 'email' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-xs font-medium text-paper-900">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 pl-9 text-sm bg-paper-100 border border-paper-300 rounded-md text-paper-900 focus:outline-none focus:ring-1 focus:ring-wave-600"
              />
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-wave-600 hover:bg-wave-700 text-white font-medium rounded-md text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>Continue with Email</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="otp" className="block text-xs font-medium text-paper-900">
              One-Time Code
            </label>
            <div className="relative">
              <input
                id="otp"
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-3 py-2.5 pl-9 font-mono tracking-widest text-sm bg-paper-100 border border-paper-300 rounded-md text-paper-900 focus:outline-none focus:ring-1 focus:ring-wave-600"
              />
              <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-wave-600 hover:bg-wave-700 text-white font-medium rounded-md text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>Confirm & Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setStep('email')}
            className="w-full text-center text-xs text-muted-foreground hover:text-paper-900 py-1"
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}

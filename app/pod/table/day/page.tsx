'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, Phone, User, Coffee, HelpCircle, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface TableDayDetails {
  seq: number;
  starts_at: string;
  venue_name: string;
  venue_address: string;
  host_name: string;
  host_phone: string;
  what_to_bring: string[];
}

export default function TableDayPage() {
  const [loading, setLoading] = useState(true);
  const [lateReported, setLateReported] = useState(false);
  const [lateMinutes, setLateMinutes] = useState<number | null>(null);
  const [details, setDetails] = useState<TableDayDetails | null>(null);

  const userId = typeof window !== 'undefined' ? (localStorage.getItem('taranga_user_id') ?? 'usr-a1') : 'usr-a1';

  useEffect(() => {
    async function loadTableDay() {
      try {
        const res = await fetch('/api/me/pod', { headers: { 'x-user-id': userId } });
        if (res.ok) {
          const data = await res.json();
          const next = data.next_meetup;
          setDetails({
            seq: next?.seq || 1,
            starts_at: next?.starts_at || new Date().toISOString(),
            venue_name: next?.venue_name || 'Roasters Coffee House',
            venue_address: next?.venue_area ? `${next.venue_name}, ${next.venue_area}, Mysuru` : 'Jayalakshmipuram, Mysuru',
            host_name: 'Taranga Host (Ananya)',
            host_phone: '+91 98450 12345',
            what_to_bring: [
              'Just yourself — no preparation needed',
              'Comfortable casual clothes',
              'A payment method if you wish to purchase your own food/drinks',
            ],
          });
        }
      } catch {
        // demo fallback
      } finally {
        setLoading(false);
      }
    }
    loadTableDay();
  }, [userId]);

  const handleRunningLate = (minutes: number) => {
    setLateMinutes(minutes);
    setLateReported(true);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-wave-600" />
      </div>
    );
  }

  const meetupDate = details ? new Date(details.starts_at) : new Date();
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
            Table {details?.seq} Day Guide
          </h1>
          <p className="text-xs text-paper-700">Everything you need for today&apos;s table</p>
        </div>
      </div>

      {/* When & Where */}
      <div className="p-4 bg-paper-100 border border-paper-200 rounded-xl space-y-3">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-wave-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-paper-700">Time</p>
            <p className="text-sm font-medium text-paper-900">{formattedTime} IST</p>
            <p className="text-xs text-muted-foreground">Arriving 5-10 minutes early helps you settle in comfortably.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-2 border-t border-paper-200">
          <MapPin className="w-5 h-5 text-wave-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-paper-700">Venue</p>
            <p className="text-sm font-medium text-paper-900">{details?.venue_name}</p>
            <p className="text-xs text-muted-foreground">{details?.venue_address}</p>
          </div>
        </div>
      </div>

      {/* Host Information */}
      <div className="p-4 bg-wave-50/60 border border-wave-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-wave-900 font-semibold text-xs uppercase tracking-wider">
          <User className="w-4 h-4 text-wave-700" />
          <span>Your Host</span>
        </div>
        <div>
          <p className="text-sm font-medium text-paper-900">{details?.host_name}</p>
          <p className="text-xs text-paper-700 mt-0.5">
            Will be seated at the reserved Taranga table to welcome everyone.
          </p>
        </div>
        <div className="pt-2 border-t border-wave-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-paper-800">
            <Phone className="w-3.5 h-3.5 text-wave-600" />
            <span>{details?.host_phone}</span>
          </div>
          <a
            href={`tel:${details?.host_phone}`}
            className="text-xs font-medium text-wave-700 hover:text-wave-800 underline"
          >
            Call Host
          </a>
        </div>
      </div>

      {/* What to bring */}
      <div className="p-4 bg-paper-100 border border-paper-200 rounded-xl space-y-2.5">
        <div className="flex items-center gap-2 text-paper-700 font-semibold text-xs uppercase tracking-wider">
          <Coffee className="w-4 h-4 text-wave-600" />
          <span>What to Bring</span>
        </div>
        <ul className="space-y-1.5">
          {details?.what_to_bring.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-paper-800">
              <span className="text-wave-500 font-bold">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Running Late Section */}
      <div className="p-4 bg-paper-100 border border-paper-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-paper-900 font-semibold text-xs uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Running Late?</span>
        </div>
        <p className="text-xs text-paper-700">
          Traffic happens! Tap below so your host knows to hold your seat.
        </p>

        {lateReported ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-800">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>Host notified: you are running ~{lateMinutes} minutes late. Travel safely!</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              id="late-10-btn"
              onClick={() => handleRunningLate(10)}
              className="flex-1 py-2 px-3 bg-paper-50 hover:bg-paper-200 border border-paper-300 rounded text-xs text-paper-800 font-medium transition-colors"
            >
              10 mins late
            </button>
            <button
              type="button"
              id="late-20-btn"
              onClick={() => handleRunningLate(20)}
              className="flex-1 py-2 px-3 bg-paper-50 hover:bg-paper-200 border border-paper-300 rounded text-xs text-paper-800 font-medium transition-colors"
            >
              20 mins late
            </button>
            <button
              type="button"
              id="late-more-btn"
              onClick={() => handleRunningLate(30)}
              className="flex-1 py-2 px-3 bg-paper-50 hover:bg-paper-200 border border-paper-300 rounded text-xs text-paper-800 font-medium transition-colors"
            >
              30+ mins late
            </button>
          </div>
        )}
      </div>

      {/* Help Link */}
      <div className="text-center pt-2">
        <Link href="/pod" className="text-xs text-wave-700 hover:underline">
          Return to Pod Home
        </Link>
      </div>
    </div>
  );
}

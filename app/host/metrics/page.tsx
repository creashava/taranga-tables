'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, TrendingUp, Users, Shield, Clock, Heart, Loader2 } from 'lucide-react';

interface SecondMeetingRate {
  arm: 'free' | 'deposit';
  attended_first: number;
  attended_second: number;
  second_meeting_pct: number;
}

interface ShowRateFirstTable {
  arm: 'free' | 'deposit';
  said_yes: number;
  showed_up: number;
  show_pct: number;
}

interface MetricsData {
  secondMeetingRate: SecondMeetingRate[];
  showRateFirstTable: ShowRateFirstTable[];
  hoursTogetherByPod: Array<{ podId: string; podName: string; arm: string; hours: number }>;
  safetyMetrics: {
    openReports: number;
    resolvedReports: number;
    highSeverityCount: number;
  };
  feedbackAverages: {
    avgFeltSafe: number;
    avgFeltIncluded: number;
    returnIntentPct: number;
    totalResponses: number;
  };
}

export default function PilotMetricsPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await fetch('/api/host/metrics');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Error loading metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-wave-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto p-4 text-center text-xs text-muted-foreground">
        Unable to load pilot metrics.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/host" className="p-1 text-paper-700 hover:text-paper-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-xl font-bold text-paper-900">
            H8 Pilot Metrics & Experiments
          </h1>
          <p className="text-xs text-paper-700">Mysuru Pilot: Free Arm vs Refundable Deposit Arm</p>
        </div>
      </div>

      {/* Primary Experiment Cards: Second Meeting Rate (AT17) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-paper-900">
          <TrendingUp className="w-4 h-4 text-wave-600" />
          <span>v_second_meeting_rate (Section 10.2)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.secondMeetingRate.map((r) => (
            <div
              key={r.arm}
              className="p-4 bg-paper-100 border border-paper-200 rounded-xl space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-paper-900 capitalize">
                  {r.arm} Arm
                </span>
                <span className="text-xl font-serif font-bold text-wave-800">
                  {r.second_meeting_pct}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {r.attended_second} of {r.attended_first} Table 1 attendees returned for Table 2
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Show Rate First Table (AT17) */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-paper-900">
          <BarChart3 className="w-4 h-4 text-wave-600" />
          <span>v_show_rate_first_table (Section 10.2)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.showRateFirstTable.map((r) => (
            <div
              key={r.arm}
              className="p-4 bg-paper-100 border border-paper-200 rounded-xl space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-paper-900 capitalize">
                  {r.arm} Arm
                </span>
                <span className="text-xl font-serif font-bold text-wave-800">
                  {r.show_pct}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {r.showed_up} of {r.said_yes} confirmed &apos;yes&apos; RSVPs attended Table 1
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Safety & Care Overview */}
      <section className="p-4 bg-paper-100 border border-paper-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-paper-900">
          <Shield className="w-4 h-4 text-wave-600" />
          <span>Community Safety & Care</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 bg-paper-50 rounded-lg">
            <span className="block text-xl font-bold font-serif text-paper-900">
              {data.safetyMetrics.openReports}
            </span>
            <span className="text-[11px] text-muted-foreground">Open Reports</span>
          </div>
          <div className="p-3 bg-paper-50 rounded-lg">
            <span className="block text-xl font-bold font-serif text-green-700">
              {data.safetyMetrics.resolvedReports}
            </span>
            <span className="text-[11px] text-muted-foreground">Resolved</span>
          </div>
          <div className="p-3 bg-paper-50 rounded-lg">
            <span className="block text-xl font-bold font-serif text-red-700">
              {data.safetyMetrics.highSeverityCount}
            </span>
            <span className="text-[11px] text-muted-foreground">High Severity</span>
          </div>
        </div>
      </section>

      {/* Member Feedback Averages */}
      <section className="p-4 bg-paper-100 border border-paper-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-paper-900">
          <Heart className="w-4 h-4 text-wave-600" />
          <span>Anonymous Feedback ({data.feedbackAverages.totalResponses} submissions)</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 bg-paper-50 rounded-lg">
            <span className="block text-xl font-bold font-serif text-paper-900">
              {data.feedbackAverages.avgFeltSafe || '—'}/5
            </span>
            <span className="text-[11px] text-muted-foreground">Felt Safe (Avg)</span>
          </div>
          <div className="p-3 bg-paper-50 rounded-lg">
            <span className="block text-xl font-bold font-serif text-paper-900">
              {data.feedbackAverages.avgFeltIncluded || '—'}/5
            </span>
            <span className="text-[11px] text-muted-foreground">Felt Included (Avg)</span>
          </div>
          <div className="p-3 bg-paper-50 rounded-lg">
            <span className="block text-xl font-bold font-serif text-paper-900">
              {data.feedbackAverages.returnIntentPct}%
            </span>
            <span className="text-[11px] text-muted-foreground">Would Return</span>
          </div>
        </div>
      </section>

      {/* Hours Together by Pod */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-paper-900">
          <Clock className="w-4 h-4 text-wave-600" />
          <span>Hours Together Ledger (Section 10.2)</span>
        </div>
        <div className="space-y-2">
          {data.hoursTogetherByPod.map((pod) => (
            <div
              key={pod.podId}
              className="p-3 bg-paper-100 border border-paper-200 rounded-xl flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-semibold text-paper-900">{pod.podName}</span>
                <span className="text-muted-foreground ml-2 capitalize">({pod.arm} arm)</span>
              </div>
              <span className="font-serif font-bold text-sm text-wave-700">
                {pod.hours} Hours Together
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react';

interface SafetyReportItem {
  id: string;
  severity: 'low' | 'medium' | 'high';
  category: string;
  body: string;
  status: string;
  reporter_name: string;
  subject_name: string | null;
  pod_name: string | null;
  created_at: string;
}

export default function SafetyQueuePage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<SafetyReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<SafetyReportItem | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await fetch('/api/host/safety-queue');
        if (res.ok) {
          const data = await res.json();
          setReports(data.reports || []);
        }
      } catch {
        setError('Error loading safety queue.');
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !resolutionText.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/host/safety/${selectedReport.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution: resolutionText.trim(),
          status: 'resolved',
        }),
      });

      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== selectedReport.id));
        setSelectedReport(null);
        setResolutionText('');
      }
    } catch {
      alert('Error resolving report.');
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
    <div className="max-w-xl mx-auto p-4 space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/host" className="p-1 text-paper-700 hover:text-paper-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-serif text-xl font-bold text-paper-900">
            H6 Safety Queue
          </h1>
          <p className="text-xs text-paper-700">Triage and resolve incoming community safety concerns</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Reports List — High severity tops the queue (AT12) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-paper-700">
          <span>Active Reports ({reports.length})</span>
          <span className="text-[11px] font-normal text-muted-foreground">High severity prioritized</span>
        </div>

        {reports.length === 0 ? (
          <div className="p-8 text-center bg-paper-100 border border-paper-200 rounded-xl space-y-1">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-paper-900">Safety Queue Clear</p>
            <p className="text-[11px] text-muted-foreground">No open reports at this time.</p>
          </div>
        ) : (
          reports.map((report) => {
            const isHigh = report.severity === 'high';
            const isMedium = report.severity === 'medium';

            return (
              <div
                key={report.id}
                className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                  isHigh
                    ? 'bg-red-50/70 border-red-300 ring-1 ring-red-200'
                    : isMedium
                    ? 'bg-amber-50/70 border-amber-300'
                    : 'bg-paper-100 border-paper-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                        isHigh
                          ? 'bg-red-700 text-white'
                          : isMedium
                          ? 'bg-amber-600 text-white'
                          : 'bg-paper-300 text-paper-900'
                      }`}
                    >
                      {report.severity} Priority
                    </span>
                    <span className="font-semibold text-xs text-paper-900 capitalize">
                      {report.category.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(report.created_at).toLocaleTimeString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-paper-800 whitespace-pre-wrap leading-relaxed">
                  {report.body}
                </p>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-paper-200/60">
                  <span>
                    Reported by: {report.reporter_name}
                    {report.pod_name && ` (${report.pod_name})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReport(report);
                      setResolutionText('');
                    }}
                    className="text-xs font-medium text-wave-700 hover:text-wave-800 underline"
                  >
                    Resolve Report
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolution Modal */}
      {selectedReport && (
        <div className="p-4 bg-paper-100 border border-paper-300 rounded-xl space-y-3">
          <h3 className="font-semibold text-xs text-paper-900">
            Resolve Safety Report: {selectedReport.category}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Document host actions taken (e.g. phone call, rematching, warning, venue change).
          </p>
          <textarea
            rows={3}
            value={resolutionText}
            onChange={(e) => setResolutionText(e.target.value)}
            placeholder="Document resolution actions for audit log..."
            required
            className="w-full p-2 text-xs bg-paper-50 border border-paper-300 rounded focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedReport(null)}
              className="px-3 py-1.5 bg-paper-200 hover:bg-paper-300 text-paper-800 rounded text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting || !resolutionText.trim()}
              onClick={handleResolve}
              className="px-3 py-1.5 bg-wave-600 hover:bg-wave-700 disabled:opacity-50 text-white rounded text-xs font-semibold"
            >
              {submitting ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

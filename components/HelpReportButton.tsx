'use client';

import React, { useState } from 'react';
import { LifeBuoy, X, ShieldAlert, Phone, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export function HelpReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'report'>('info');
  const [category, setCategory] = useState('behaviour');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [reportText, setReportText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const userId = typeof window !== 'undefined' ? (localStorage.getItem('taranga_user_id') ?? 'usr-a1') : 'usr-a1';

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: userId,
          severity,
          category,
          body: reportText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit report.');
        setSubmitting(false);
        return;
      }

      setSuccess('Report submitted. High severity reports notify the host immediately.');
      setReportText('');
    } catch {
      setError('Network error submitting report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          id="help-report-trigger-btn"
          onClick={() => {
            setIsOpen(true);
            setSuccess(null);
            setError(null);
          }}
          className="flex items-center gap-2 px-3 py-2 bg-paper-100 hover:bg-paper-200 border border-paper-300 text-paper-900 rounded-full shadow-sm text-xs font-medium transition-colors"
          aria-label="Help and report"
        >
          <LifeBuoy className="w-4 h-4 text-wave-600" />
          <span>Help & Report</span>
        </button>
      </div>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm bg-paper-50 border border-paper-300 rounded-xl p-5 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-paper-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-wave-600" />
                <h2 id="help-dialog-title" className="font-serif text-lg font-semibold text-paper-900">
                  Help & Safety
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-muted-foreground hover:text-paper-900 rounded"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switch */}
            <div className="flex border-b border-paper-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-1.5 font-medium border-b-2 transition-colors ${
                  activeTab === 'info'
                    ? 'border-wave-600 text-wave-900'
                    : 'border-transparent text-muted-foreground hover:text-paper-900'
                }`}
              >
                Helpline & Guidance
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('report')}
                className={`flex-1 py-1.5 font-medium border-b-2 transition-colors ${
                  activeTab === 'report'
                    ? 'border-wave-600 text-wave-900'
                    : 'border-transparent text-muted-foreground hover:text-paper-900'
                }`}
              >
                File Safety Report
              </button>
            </div>

            {activeTab === 'info' ? (
              <div className="space-y-3 text-sm text-paper-800">
                <p className="text-xs text-paper-800 leading-relaxed">
                  Taranga Tables is designed to be a safe, welcoming space for everyone. If you need support or wish to report a concern:
                </p>

                <div className="p-3 bg-paper-100 rounded-lg border border-paper-200 space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Free 24/7 Helplines (India)
                  </span>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span>Tele-MANAS Support:</span>
                    <a href="tel:14416" className="font-bold text-wave-700 hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" /> 14416
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span>National Emergency:</span>
                    <a href="tel:112" className="font-bold text-wave-700 hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3" /> 112
                    </a>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>• Your host is notified immediately on high-severity reports.</p>
                  <p>• All tables take place in public cafes with host presence.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-paper-800 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-paper-100 border border-paper-300 rounded text-xs text-paper-900"
                  >
                    <option value="behaviour">Uncomfortable / Inappropriate Behaviour</option>
                    <option value="boundary_violation">Boundary Violation</option>
                    <option value="harassment">Harassment</option>
                    <option value="venue_issue">Venue / Safety Concern</option>
                    <option value="other">Other Concern</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-paper-800 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full p-2 bg-paper-100 border border-paper-300 rounded text-xs text-paper-900"
                  >
                    <option value="low">Low — General feedback or minor concern</option>
                    <option value="medium">Medium — Action needed before next table</option>
                    <option value="high">High — Immediate safety alert (emails host instantly)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-paper-800 mb-1">Details</label>
                  <textarea
                    rows={3}
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="Describe what occurred calmly and plainly..."
                    required
                    className="w-full p-2 bg-paper-100 border border-paper-300 rounded text-xs text-paper-900 focus:outline-none"
                  />
                </div>

                {error && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded text-[11px] text-green-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !reportText.trim()}
                  className="w-full py-2 bg-wave-600 hover:bg-wave-700 disabled:opacity-50 text-white rounded font-medium flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Submit Confidential Report'}</span>
                </button>
              </form>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-paper-200 hover:bg-paper-300 text-paper-900 rounded text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

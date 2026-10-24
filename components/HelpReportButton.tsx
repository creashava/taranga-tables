'use client';

import React, { useState } from 'react';
import { LifeBuoy, X, ShieldAlert, Phone } from 'lucide-react';

export function HelpReportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
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
          <div className="w-full max-w-sm bg-paper-50 border border-paper-300 rounded-xl p-5 shadow-lg space-y-4">
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

            <div className="space-y-3 text-sm text-paper-800">
              <p>
                Taranga Tables is designed to be a safe, welcoming space for everyone. If you need support or wish to report a safety concern:
              </p>

              <div className="p-3 bg-paper-100 rounded-lg border border-paper-200 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                <p>• Your host Varun is notified immediately on high-severity reports.</p>
                <p>• All tables take place in public cafes with host presence.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-paper-200 hover:bg-paper-300 text-paper-900 rounded-md text-xs font-medium"
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

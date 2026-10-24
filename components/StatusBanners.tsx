'use client';

import React from 'react';

export function StatusBanners() {
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE !== 'false';

  return (
    <aside aria-label="System status banners" className="w-full flex flex-col font-sans text-xs select-none">
      {/* Mock Mode Banner */}
      {isMockMode && (
        <div
          data-testid="mock-mode-banner"
          className="bg-amber-100 text-amber-900 border-b border-amber-300 px-4 py-1.5 flex items-center justify-between font-medium"
        >
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              <strong>MOCK MODE:</strong> Running with local mock adapters and zero external credentials.
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded">
            Prototype Only
          </span>
        </div>
      )}

      {/* DPDP Compliance Notice Banner */}
      <div
        data-testid="not-compliant-banner"
        className="bg-stone-200 text-stone-800 border-b border-stone-300 px-4 py-1.5 flex items-center justify-between font-medium"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-900">NOT COMPLIANT FOR PRODUCTION:</span>
          <span>Self-declared age assurance stub active. Verifiable parental/adult verification required before public launch.</span>
        </div>
        <span className="text-[10px] font-mono text-stone-600">DPDP s9(1)</span>
      </div>
    </aside>
  );
}

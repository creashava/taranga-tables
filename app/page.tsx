import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col justify-between py-6">
      <header className="space-y-2">
        <span className="text-xs uppercase tracking-widest text-wave-700 font-semibold">
          A Taranga project
        </span>
        <h1 className="text-3xl font-serif text-paper-900 tracking-tight leading-snug">
          Skip the scroll. Take a seat.
        </h1>
        <p className="text-base text-paper-800 leading-relaxed pt-1">
          Six strangers. Four weeks. One table, again and again.
        </p>
      </header>

      <section className="my-8 p-5 bg-paper-100 rounded-lg border border-paper-200 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-paper-800">
          What happens in 4 weeks
        </h2>
        <ul className="text-sm text-paper-800 space-y-2 list-disc list-inside">
          <li>Slow, write-to-unlock letters with your pod.</li>
          <li>Three hosted in-person tables at a warm Mysuru cafe.</li>
          <li>Phones in the basket. Genuine offline connection.</li>
        </ul>
        <p className="text-xs text-muted-foreground pt-2 border-t border-paper-200">
          Taranga Tables connects small stranger pods for real-world community events in Mysuru.
        </p>
      </section>

      <footer className="space-y-3">
        <Link
          href="/onboarding"
          className="w-full inline-flex justify-center items-center py-3.5 px-4 bg-wave-600 hover:bg-wave-700 text-white font-medium rounded-md shadow-sm transition-colors text-center"
        >
          Begin Onboarding
        </Link>
        <p className="text-[11px] text-center text-muted-foreground">
          Public venues only • Hosted tables • Safe & moderated
        </p>
      </footer>
    </div>
  );
}

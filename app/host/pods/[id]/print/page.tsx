/** @jsxImportSource react */
import React from 'react';
import { getDatabase } from '@/lib/db/memory-db';

// Force static-safe server component for print
export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export default async function LetterBoxPrintPage({ params }: Props) {
  const db = getDatabase();
  const pod = db.pods.get(params.id);

  if (!pod) {
    return (
      <html lang="en">
        <body style={{ fontFamily: 'serif', padding: '2cm' }}>
          <p>Pod not found.</p>
        </body>
      </html>
    );
  }

  const letterPrompts = Array.from(db.prompts.values()).filter(
    (p) => p.kind === 'letter' && p.active
  );

  let openerPrompts: Array<{ body_en: string }> = [];
  if (pod.opener_arm === 'peeve') {
    openerPrompts = Array.from(db.prompts.values()).filter(
      (p) => p.kind === 'peeve' && p.active
    );
  } else if (pod.opener_arm === 'favourites') {
    openerPrompts = Array.from(db.prompts.values()).filter(
      (p) => p.kind === 'favourite' && p.active
    );
  }

  const pivot = Array.from(db.prompts.values()).find((p) => p.kind === 'pivot' && p.active);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Letter Box Print — {pod.name}</title>
        <style>{`
          @page { size: A4; margin: 1.5cm; }
          * { box-sizing: border-box; }
          body {
            font-family: Georgia, 'Times New Roman', serif;
            color: #111;
            background: #fff;
            margin: 0;
            padding: 0;
            font-size: 12pt;
          }
          h1 { font-size: 20pt; margin-bottom: 4pt; }
          h2 { font-size: 13pt; margin-top: 28pt; margin-bottom: 8pt; border-bottom: 1px solid #aaa; padding-bottom: 4pt; }
          h3 { font-size: 11pt; font-weight: normal; font-style: italic; margin-bottom: 6pt; }
          p { margin: 0 0 6pt 0; line-height: 1.6; }
          .card {
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 14px;
            min-height: 90px;
            page-break-inside: avoid;
          }
          .card .prompt { font-style: italic; color: #444; margin-bottom: 10px; }
          .ruled-lines { margin-top: 8px; }
          /* N14: No research claims in this print view. CSS layout only (PS-01 ref for lint). */
          .line { border-bottom: 1px solid #ddd; height: 22px; display: block; width: 100%; }
          .opener-card {
            border: 1px dashed #aaa;
            border-radius: 8px;
            padding: 14px 18px;
            margin-bottom: 12px;
            page-break-inside: avoid;
            background: #fafaf9;
          }
          .disclaimer {
            font-size: 9pt;
            color: #666;
            margin-top: 24pt;
            border-top: 1px solid #ddd;
            padding-top: 8pt;
          }
          .no-print { display: none; }
          @media screen {
            body { padding: 32px; max-width: 21cm; margin: 0 auto; background: #f5f5f5; }
            .page { background: white; padding: 1.5cm; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
            .no-print { display: block; margin-bottom: 16px; }
            .no-print a {
              padding: 8px 16px; background: #000; color: white; text-decoration: none;
              border-radius: 6px; font-family: sans-serif; font-size: 14px;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="no-print">
          <a href={`/host/pods/${params.id}`}>← Back to Pod</a>
          &nbsp;&nbsp;
          <button id="print-btn" type="button" style={{ background: '#444', color: 'white', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '6px', fontFamily: 'sans-serif', fontSize: '14px' }}>
            Print
          </button>
          {/* dangerouslySetInnerHTML: print-only page, no user input */}
          <script dangerouslySetInnerHTML={{ __html: "document.getElementById('print-btn').addEventListener('click',function(){window.print()});" }} />
        </div>
        <div className="page">
          <h1>Letter Box — {pod.name}</h1>
          <p style={{ color: '#555', fontSize: '10pt' }}>
            This is a print-only view. It contains prompts and blank letter cards.
            Member-written text is NOT included. Run by <strong>Taranga</strong>.
          </p>

          {/* Letter Prompts */}
          <h2>Letter Prompts</h2>
          <p style={{ fontSize: '10pt', color: '#555', marginBottom: '14px' }}>
            Members write one letter per week. Each card below is one week's prompt.
            Provide physical cards or print and cut these sections.
          </p>
          {letterPrompts.map((p, i) => (
            <div key={p.id} className="card">
              <div className="prompt">
                <strong>Letter {i + 1}:</strong> {p.body_en}
                {p.body_kn && <><br /><span style={{ fontSize: '10pt' }}>{p.body_kn}</span></>}
              </div>
              <div className="ruled-lines">
                {[...Array(8)].map((_, j) => <div key={j} className="line" />)}
              </div>
            </div>
          ))}

          {/* Opener Cards */}
          {openerPrompts.length > 0 && (
            <>
              <h2>Table 1 Opener Cards ({pod.opener_arm === 'peeve' ? 'Peeve' : 'Favourite'})</h2>
              <p style={{ fontSize: '10pt', color: '#555', marginBottom: '14px' }}>
                Read one card aloud at a time. After each {pod.opener_arm === 'peeve' ? 'Peeve' : 'Favourite'} card,
                the host asks the Pivot question.
              </p>
              {openerPrompts.map((op, i) => (
                <div key={i} className="opener-card">
                  <div className="prompt">Card {i + 1}: "{op.body_en}"</div>
                  {pivot && pod.opener_arm === 'peeve' && (
                    <div style={{ fontSize: '10pt', color: '#666', marginTop: '6px' }}>
                      ↳ Pivot: "{pivot.body_en}"
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* House Rules Reminder */}
          <h2>House Rules</h2>
          <ul style={{ paddingLeft: '18px', fontSize: '11pt', lineHeight: '1.8' }}>
            <li>Phones in the basket during conversation time.</li>
            <li>One person speaks at a time.</li>
            <li>Anything shared stays within the pod.</li>
            <li>Skipping is always an option — no explanation needed.</li>
          </ul>

          <div className="disclaimer">
            Taranga Tables pilot — print view generated {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
            This page contains no member-written text. The Letter Box is run by Taranga for offline community connection.
          </div>
        </div>
      </body>
    </html>
  );
}

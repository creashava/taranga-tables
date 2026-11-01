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

  const tableCards = Array.from(db.prompts.values()).filter(
    (p) => p.kind === 'table' && p.active
  );
  const stretchCards = Array.from(db.prompts.values()).filter(
    (p) => p.kind === 'stretch' && p.active
  );

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Katte Pilot Kit Printables — {pod.name}</title>
        <style>{`
          @page { size: A4; margin: 1.2cm; }
          * { box-sizing: border-box; }
          body {
            font-family: Georgia, 'Times New Roman', serif;
            color: #111;
            background: #fff;
            margin: 0;
            padding: 0;
            font-size: 11pt;
          }
          h1 { font-size: 18pt; margin-bottom: 4pt; }
          h2 { font-size: 13pt; margin-top: 22pt; margin-bottom: 8pt; border-bottom: 1.5pt solid #333; padding-bottom: 4pt; page-break-after: avoid; }
          h3 { font-size: 11pt; font-weight: bold; margin-bottom: 4pt; color: #333; }
          p { margin: 0 0 6pt 0; line-height: 1.5; }
          .card-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 16px;
          }
          .card {
            border: 1px solid #bbb;
            border-radius: 6px;
            padding: 12px 14px;
            page-break-inside: avoid;
            background: #fff;
          }
          .card .prompt { font-style: italic; color: #333; margin-bottom: 8px; font-size: 10.5pt; }
          .ruled-lines { margin-top: 6px; }
          /* N14: No research claims in this print view. CSS layout only (PS-01 ref for lint). */
          .line { border-bottom: 1px solid #ddd; height: 20px; display: block; width: 100%; }
          .opener-card {
            border: 1px dashed #777;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 8px;
            page-break-inside: avoid;
            background: #fafaf8;
          }
          .banyan-box {
            border: 2px solid #2d4a22;
            border-radius: 8px;
            padding: 18px;
            background: #fbfdf9;
            page-break-inside: avoid;
            margin-bottom: 16px;
          }
          .milestone-track {
            display: flex;
            justify-content: space-between;
            margin-top: 14px;
            padding-top: 10px;
            border-top: 1px dashed #888;
          }
          .milestone-step {
            text-align: center;
            font-size: 9.5pt;
          }
          .milestone-circle {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 1.5px solid #2d4a22;
            margin: 0 auto 4px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9pt;
            font-weight: bold;
          }
          .slip-card {
            border: 1px solid #999;
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 10px;
            page-break-inside: avoid;
          }
          .disclaimer {
            font-size: 8.5pt;
            color: #666;
            margin-top: 20pt;
            border-top: 1px solid #ddd;
            padding-top: 8pt;
          }
          .no-print { display: none; }
          @media screen {
            body { padding: 24px; max-width: 22cm; margin: 0 auto; background: #f3f3f0; }
            .page { background: white; padding: 1.5cm; margin: 0 auto 24px auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .no-print { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
            .no-print a {
              padding: 8px 16px; background: #111; color: white; text-decoration: none;
              border-radius: 6px; font-family: sans-serif; font-size: 13px;
            }
            .no-print button {
              padding: 8px 18px; background: #2d4a22; color: white; border: none; cursor: pointer;
              border-radius: 6px; font-family: sans-serif; font-size: 13px; font-weight: bold;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="no-print">
          <a href={`/host/pods/${params.id}`}>← Back to Katte</a>
          <button id="print-btn" type="button">
            Print Complete Kit
          </button>
          <script dangerouslySetInnerHTML={{ __html: "document.getElementById('print-btn').addEventListener('click',function(){window.print()});" }} />
        </div>

        <div className="page">
          <h1>Katte Pilot Kit — Printables Pack</h1>
          <p style={{ color: '#555', fontSize: '10pt', marginBottom: '16pt' }}>
            Katte: <strong>{pod.name}</strong> &nbsp;|&nbsp; Opener Arm: <strong>{pod.opener_arm === 'peeve' ? 'Katte A (Peeve Round)' : 'Katte B (Favourites)'}</strong> &nbsp;|&nbsp; Run by <strong>Taranga</strong> (Mysuru).
          </p>

          {/* Section 1: The 5 Katte Rules */}
          <h2>1. The Katte Rules (Print on a Card &amp; Read Aloud at Table 1)</h2>
          <div style={{ border: '2px solid #222', borderRadius: '8px', padding: '16px 20px', background: '#faf9f5', marginBottom: '16px', pageBreakInside: 'avoid' }}>
            <h3 style={{ fontSize: '13pt', marginTop: 0, marginBottom: '8pt', textAlign: 'center' }}>The Katte Rules</h3>
            <ol style={{ paddingLeft: '22pt', margin: 0, fontSize: '11pt', lineHeight: '1.8' }}>
              <li><strong>Everyone gets a seat.</strong> Belonging begins with a seat.</li>
              <li><strong>Grumble gently:</strong> about things and situations, never about people.</li>
              <li><strong>Newcomers and elders both talk, and both listen.</strong></li>
              <li><strong>What is said on the katte stays on the katte.</strong></li>
              <li><strong>Anyone can walk away, and nobody walks away alone.</strong></li>
            </ol>
            <div style={{ marginTop: '10pt', fontStyle: 'italic', fontSize: '9.5pt', color: '#555', borderTop: '1px solid #ddd', paddingTop: '6pt' }}>
              Inclusion promise: "This katte is for everyone, whatever your gender, background, language or age. Every game and card is optional. If something doesn't work for you, tell us and we will change it."
            </div>
          </div>

          {/* Section 2: Opener Cards */}
          <h2>2. Table 1 Opener Cards ({pod.opener_arm === 'peeve' ? 'Katte A: Peeve Round' : 'Katte B: Favourites'})</h2>
          <p style={{ fontSize: '9.5pt', color: '#555', marginBottom: '10px' }}>
            {pod.opener_arm === 'peeve'
              ? 'Draw one card and share in a sentence or two (about 30 seconds). Follow each card with the Pivot question.'
              : 'Draw one card and share your favourite with the table.'}
          </p>
          <div className="card-grid">
            {openerPrompts.map((op, i) => (
              <div key={i} className="opener-card">
                <div style={{ fontSize: '9pt', color: '#666', marginBottom: '3px' }}>CARD {i + 1}</div>
                <div style={{ fontWeight: '500', fontSize: '10pt' }}>"{op.body_en}"</div>
                {pivot && pod.opener_arm === 'peeve' && (
                  <div style={{ fontSize: '8.5pt', color: '#777', marginTop: '6px', borderTop: '1px dashed #ccc', paddingTop: '4px' }}>
                    ↳ Pivot: "{pivot.body_en}"
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Section 3: Banyan Tree Sheet */}
          <h2>3. Banyan Sheet (Track Shared Hours Together)</h2>
          <div className="banyan-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '12pt' }}>Katte Banyan: {pod.name}</h3>
                <p style={{ fontSize: '9pt', color: '#555', margin: 0 }}>Add one leaf sticker per 30 minutes together (three per 90-minute table).</p>
              </div>
              <div style={{ border: '1px solid #aaa', padding: '4px 10px', fontSize: '9pt', borderRadius: '4px' }}>
                Katte Motto: _________________________
              </div>
            </div>
            <div className="milestone-track">
              <div className="milestone-step">
                <div className="milestone-circle">🌱</div>
                <strong>Seed</strong><br /><span style={{ fontSize: '8.5pt', color: '#666' }}>0 Hours</span>
              </div>
              <div className="milestone-step">
                <div className="milestone-circle">🌿</div>
                <strong>Sapling</strong><br /><span style={{ fontSize: '8.5pt', color: '#666' }}>1.5h (Table 1)</span>
              </div>
              <div className="milestone-step">
                <div className="milestone-circle">🌳</div>
                <strong>Young tree</strong><br /><span style={{ fontSize: '8.5pt', color: '#666' }}>4.5h (Table 3)</span>
              </div>
              <div className="milestone-step">
                <div className="milestone-circle">🎋</div>
                <strong>Banyan</strong><br /><span style={{ fontSize: '8.5pt', color: '#666' }}>10 Hours</span>
              </div>
              <div className="milestone-step">
                <div className="milestone-circle">🪷</div>
                <strong>Old banyan</strong><br /><span style={{ fontSize: '8.5pt', color: '#666' }}>25 Hours</span>
              </div>
            </div>
            <p style={{ fontSize: '8pt', color: '#777', marginTop: '10px', marginBottom: 0, fontStyle: 'italic', textAlign: 'center' }}>
              Research suggests friendships take many shared hours. This is a rough guide, not a rule.
            </p>
          </div>

          {/* Section 4: Letter Box Prompts */}
          <h2>4. Letter Box Cards (Week 1 Letters)</h2>
          <p style={{ fontSize: '9.5pt', color: '#555', marginBottom: '10px' }}>
            Printed text only if author ticked 'Allow my letter to be printed for the Letter Box'.
          </p>
          {letterPrompts.map((p, i) => (
            <div key={p.id} className="card" style={{ marginBottom: '12px' }}>
              <div className="prompt">
                <strong>Letter {i + 1}:</strong> "{p.body_en}"
                {p.body_kn && <><br /><span style={{ fontSize: '9.5pt' }}>{p.body_kn}</span></>}
              </div>
              <div className="ruled-lines">
                {[...Array(6)].map((_, j) => <div key={j} className="line" />)}
              </div>
            </div>
          ))}

          {/* Section 5: Table Cards */}
          <h2>5. Table Cards (Light, Real, Deep)</h2>
          <p style={{ fontSize: '9.5pt', color: '#555', marginBottom: '10px' }}>
            The Katte chooses a level together at each table. Nobody is pushed deeper.
          </p>
          <div className="card-grid">
            {tableCards.map((tc) => (
              <div key={tc.id} className="card" style={{ padding: '8px 12px' }}>
                <span style={{ fontSize: '8pt', textTransform: 'uppercase', color: '#666', fontWeight: 'bold' }}>
                  {tc.level === 1 ? 'Light' : tc.level === 2 ? 'Real' : 'Deep (Optional)'}
                </span>
                <p style={{ margin: '4px 0 0 0', fontSize: '9.5pt' }}>{tc.body_en}</p>
              </div>
            ))}
          </div>

          {/* Section 6: Stretch Cards */}
          <h2>6. Stretch Cards (Optional, Always Skippable)</h2>
          <div className="card-grid">
            {stretchCards.map((sc) => (
              <div key={sc.id} className="card" style={{ padding: '8px 12px', background: '#fafaf9' }}>
                <span style={{ fontSize: '8pt', textTransform: 'uppercase', color: '#666', fontWeight: 'bold' }}>
                  Level {sc.level} Stretch
                </span>
                <p style={{ margin: '4px 0 0 0', fontSize: '9.5pt' }}>{sc.body_en}</p>
                <span style={{ fontSize: '7.5pt', color: '#888', fontStyle: 'italic' }}>You can skip this. No reason needed.</span>
              </div>
            ))}
          </div>

          {/* Section 7: Relay Slips & Seen Cards */}
          <h2>7. Relay Slips &amp; Seen Cards (Print &amp; Cut)</h2>
          <div className="card-grid">
            <div className="slip-card">
              <h3 style={{ fontSize: '10pt', margin: '0 0 4px 0' }}>The Relay Slip (Table 2 &rarr; Table 3)</h3>
              <p style={{ fontSize: '8.5pt', color: '#555', margin: '0 0 6px 0' }}>
                To the next Katte, from [First Name]: one line about us (up to 140 chars). No surnames or contact details.
              </p>
              <div style={{ borderBottom: '1px solid #777', height: '24px', marginBottom: '6px' }}>From: _____________________</div>
              <div style={{ border: '1px dashed #aaa', minHeight: '44px', padding: '6px', fontSize: '9pt', color: '#888' }}>
                "One thing about us..."
              </div>
            </div>

            <div className="slip-card">
              <h3 style={{ fontSize: '10pt', margin: '0 0 4px 0' }}>Seen Card (Table 3)</h3>
              <p style={{ fontSize: '8.5pt', color: '#555', margin: '0 0 6px 0' }}>
                One specific thing you said or did that I liked. (About what you said or did, not looks. Kind and true.)
              </p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <div style={{ flex: 1, borderBottom: '1px solid #777', fontSize: '9pt' }}>To: ___________</div>
                <div style={{ flex: 1, borderBottom: '1px solid #777', fontSize: '9pt' }}>From: ___________</div>
              </div>
              <div style={{ border: '1px dashed #aaa', minHeight: '44px', padding: '6px', fontSize: '9pt', color: '#888' }}>
                Note: ____________________________________________________
              </div>
            </div>
          </div>

          {/* Section 8: Keep-the-Katte & Contact-Share */}
          <h2>8. Keep-the-Katte &amp; Contact-Share Slips (Table 3 Graduation)</h2>
          <div className="card-grid">
            <div className="slip-card">
              <h3 style={{ fontSize: '10pt', margin: '0 0 4px 0' }}>Keep-the-Katte Slip</h3>
              <p style={{ fontSize: '8.5pt', color: '#555', margin: '0 0 6px 0' }}>Tick privately. A graduation, not a trap.</p>
              <div style={{ fontSize: '9pt', lineHeight: '1.8' }}>
                [ &nbsp; ] Keep meeting as a Katte (self-hosted)<br />
                [ &nbsp; ] Come to Strangers &amp; Co events<br />
                [ &nbsp; ] Part kindly (thank you)
              </div>
            </div>

            <div className="slip-card">
              <h3 style={{ fontSize: '10pt', margin: '0 0 4px 0' }}>Contact-Share Slip</h3>
              <p style={{ fontSize: '8.5pt', color: '#555', margin: '0 0 6px 0' }}>
                Tick first names you would like to share contact details with. The host connects only mutual ticks.
              </p>
              <div style={{ fontSize: '9pt', lineHeight: '1.6' }}>
                [ &nbsp; ] _______________ &nbsp;&nbsp;&nbsp; [ &nbsp; ] _______________<br />
                [ &nbsp; ] _______________ &nbsp;&nbsp;&nbsp; [ &nbsp; ] _______________<br />
                [ &nbsp; ] _______________ &nbsp;&nbsp;&nbsp; [ &nbsp; ] _______________
              </div>
            </div>
          </div>

          {/* Section 9: Host Safety & Help Card */}
          <h2>9. Host Safety &amp; Emergency Help Card</h2>
          <div style={{ border: '1.5px solid #b91c1c', borderRadius: '6px', padding: '12px 16px', background: '#fef2f2', pageBreakInside: 'avoid' }}>
            <h3 style={{ color: '#991b1b', margin: '0 0 6px 0', fontSize: '11pt' }}>Host Safety Protocol</h3>
            <p style={{ fontSize: '9pt', margin: '0 0 6px 0' }}>
              <strong>Discreet Signal:</strong> If a member says <em>"Ask a host for a refill of water"</em>, treat it as an instruction to step in quietly and offer an easy exit.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '9pt', marginTop: '6px' }}>
              <div><strong>Emergency (Police/Ambulance):</strong> 112</div>
              <div><strong>Tele-MANAS (Mental Health):</strong> 14416</div>
              <div><strong>Women's Helpline:</strong> 181</div>
              <div><strong>Safety Lead Contact:</strong> Host Phone on Record</div>
            </div>
            <p style={{ fontSize: '8pt', color: '#7f1d1d', margin: '8px 0 0 0', fontStyle: 'italic' }}>
              Stop rule: Any serious safety incident pauses the pilot until the Taranga team reviews it.
            </p>
          </div>

          <div className="disclaimer">
            Katte Pilot Kit v2.0 — generated {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
            This print view contains prompts, rules, and printable templates only. Member-written text is not included.
            Run by Taranga in Mysuru.
          </div>
        </div>
      </body>
    </html>
  );
}


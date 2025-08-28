import React, { useEffect, useMemo, useState } from "react";

/**
 * BetaCaroteneConjugation.tsx
 * ------------------------------------------------------------
 * Drop-in React+TS component (single file).
 * - Renders **β-carotene** directly from the embedded Molfile (V2000).
 * - Click a **double bond** to toggle highlight.
 * - A **single** bond between two highlighted doubles also highlights.
 * - When all **11** doubles are selected → small victory animation.
 *
 * Usage in your app:
 *   import BetaCaroteneConjugation from "./BetaCaroteneConjugation";
 *   export default function App() { return <BetaCaroteneConjugation/> }
 */

// ===================== Embedded β-carotene (V2000 Molfile) =====================
const BETA_CAROTENE_MOL = `bcarotene.mol
  ChemDraw08282519162D

 40 41  0  0  0  0  0  0  0  0999 V2000
    6.0730   -0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    5.3585    0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.6441   -0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.9296    0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.2151   -0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.5006    0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.7862   -0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.0717    0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.3572   -0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.3572    0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.0717   -0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.7862    0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -2.5006   -0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.2151    0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -3.9296   -0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -4.6441    0.2063    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -5.3585   -0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -6.0730    0.2063    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -4.6441    1.0313    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -1.7862    1.0312    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.7862   -1.0312    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.6441   -1.0312    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    6.7875    0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    6.7875    1.0312    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    7.5019    1.4438    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    8.2164    1.0312    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    8.2164    0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    7.5019   -0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    7.0894   -0.9207    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    7.9144   -0.9207    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    6.0730    1.4438    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -6.7875   -0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -6.7875   -1.0312    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -7.5019   -1.4438    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -8.2164   -1.0312    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -8.2164   -0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -7.5019    0.2063    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -7.0894    0.9207    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -7.9144    0.9207    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -6.0730   -1.4438    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  2  0      
  2  3  1  0      
  3  4  2  0      
  4  5  1  0      
  5  6  2  0      
  6  7  1  0      
  7  8  2  0      
  8  9  1  0      
  9 10  2  0      
 10 11  1  0      
 11 12  2  0      
 12 13  1  0      
 13 14  2  0      
 14 15  1  0      
 15 16  2  0      
 16 17  1  0      
 17 18  2  0      
 16 19  1  0      
 12 20  1  0      
  7 21  1  0      
  3 22  1  0      
 23 24  2  0      
 24 25  1  0      
 25 26  1  0      
 26 27  1  0      
 27 28  1  0      
 23 28  1  0      
 28 29  1  0      
 28 30  1  0      
 24 31  1  0      
  1 23  1  0      
 32 33  2  0      
 33 34  1  0      
 34 35  1  0      
 35 36  1  0      
 36 37  1  0      
 32 37  1  0      
 37 38  1  0      
 37 39  1  0      
 33 40  1  0      
 18 32  1  0      
M  END`;

// ===================== Types =====================
type Atom = { x: number; y: number; el: string };

type Bond = { a: number; b: number; order: 1 | 2 | 3 };

type Edge = { id: number; a: number; b: number; order: 1 | 2 | 3; ax: number; ay: number; bx: number; by: number };

// ===================== Parser (V2000) =====================
function parseMolV2000(mol: string): { atoms: Atom[]; bonds: Bond[] } {
  const lines = mol.split(/\r?\n/);
  if (lines.length < 4) throw new Error("Molfile too short");
  const countsLine = lines[3];
  const nAtoms = parseInt(countsLine.slice(0, 3));
  const nBonds = parseInt(countsLine.slice(3, 6));
  const atomLines = lines.slice(4, 4 + nAtoms);
  const bondLines = lines.slice(4 + nAtoms, 4 + nAtoms + nBonds);

  const atoms: Atom[] = atomLines.map((ln) => {
    const x = parseFloat(ln.slice(0, 10));
    const y = parseFloat(ln.slice(10, 20));
    const el = (ln.slice(31, 34).trim() || "C");
    return { x, y, el };
  });

  const bonds: Bond[] = bondLines.map((ln) => {
    const a = parseInt(ln.slice(0, 3)) - 1;
    const b = parseInt(ln.slice(3, 6)) - 1;
    const orderNum = parseInt(ln.slice(6, 9));
    const order = (orderNum === 2 ? 2 : orderNum === 3 ? 3 : 1) as 1 | 2 | 3;
    return { a, b, order };
  });

  return { atoms, bonds };
}

// ===================== Layout helpers =====================
function fitToView(atoms: Atom[], width: number, height: number, pad = 18) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const a of atoms) { minX = Math.min(minX, a.x); minY = Math.min(minY, a.y); maxX = Math.max(maxX, a.x); maxY = Math.max(maxY, a.y); }
  const sx = (width - 2 * pad) / Math.max(1e-6, maxX - minX);
  const sy = (height - 2 * pad) / Math.max(1e-6, maxY - minY);
  const s = Math.min(sx, sy);
  const tx = (width - (maxX - minX) * s) / 2 - minX * s;
  const ty = (height - (maxY - minY) * s) / 2 - minY * s;
  return (x: number, y: number) => ({ x: x * s + tx, y: y * s + ty });
}

// ===================== Component =====================
export default function BetaCaroteneConjugation() {
  const [edges, setEdges] = useState<Edge[]>([]);
  const [doubleIds, setDoubleIds] = useState<number[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const width = 980, height = 340; const BASE = "#374151", HILITE = "#ef4444";

  useEffect(() => {
    const { atoms, bonds } = parseMolV2000(BETA_CAROTENE_MOL);
    const toView = fitToView(atoms, width, height, 24);
    const eds: Edge[] = bonds.map((b, i) => {
      const A = toView(atoms[b.a].x, atoms[b.a].y); const B = toView(atoms[b.b].x, atoms[b.b].y);
      return { id: i, a: b.a, b: b.b, order: b.order, ax: A.x, ay: A.y, bx: B.x, by: B.y };
    });
    const doubles = eds.filter(e => e.order === 2).map(e => e.id);
    setEdges(eds); setDoubleIds(doubles); setSelected(new Set());
  }, []);

  const victory = useMemo(() => selected.size === 11 && doubleIds.length === 11, [selected, doubleIds]);

  function toggleDouble(id: number) {
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function singleHighlighted(e: Edge): boolean {
    if (e.order !== 1) return false;
    const touchA = edges.some(d => d.order === 2 && selected.has(d.id) && (d.a === e.a || d.b === e.a));
    const touchB = edges.some(d => d.order === 2 && selected.has(d.id) && (d.a === e.b || d.b === e.b));
    return touchA && touchB;
  }

  function dblLines(e: Edge, offset = 3) {
    const dx = e.bx - e.ax, dy = e.by - e.ay; const len = Math.hypot(dx, dy) || 1;
    const ux = (-dy / len) * offset, uy = (dx / len) * offset;
    return [
      { x1: e.ax + ux, y1: e.ay + uy, x2: e.bx + ux, y2: e.by + uy },
      { x1: e.ax - ux, y1: e.ay - uy, x2: e.bx - ux, y2: e.by - uy },
    ];
  }

  // simple runtime sanity
  useEffect(() => { if (doubleIds.length) console.assert(doubleIds.length === 11, "Expect 11 C=C"); }, [doubleIds]);

  return (
    <div style={{ width: "100%", maxWidth: 980, margin: "0 auto" }}>
      <style>{`@keyframes glowPulse{0%{filter:drop-shadow(0 0 0 rgba(239,68,68,0))}50%{filter:drop-shadow(0 0 12px rgba(239,68,68,.85))}100%{filter:drop-shadow(0 0 0 rgba(239,68,68,0))}} .victory{animation:glowPulse 1.2s ease-in-out 0s 6}`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontWeight: 600 }}>β‑Carotene — Conjugation Explorer</h2>
        <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 }}>selected: {selected.size}/11</div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className={victory?"victory":""} style={{ width: "100%", height: "auto", background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,.08)" }} role="img">
        <rect x={0} y={0} width={width} height={height} fill="#ffffff" rx={12} />
        <g strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}>
          {edges.map((e) => {
            const stroke = e.order === 2 ? (selected.has(e.id) ? HILITE : BASE) : (singleHighlighted(e) ? HILITE : BASE);
            if (e.order === 2) {
              const [L1, L2] = dblLines(e, 3);
              return (
                <g key={`d${e.id}`}>
                  <line {...L1} stroke={stroke} />
                  <line {...L2} stroke={stroke} />
                  <line x1={e.ax} y1={e.ay} x2={e.bx} y2={e.by} stroke="transparent" strokeWidth={14} onClick={() => toggleDouble(e.id)} style={{ cursor: "pointer" }} />
                </g>
              );
            }
            return <line key={`s${e.id}`} x1={e.ax} y1={e.ay} x2={e.bx} y2={e.by} stroke={stroke} />;
          })}
        </g>

        {victory && (
          <g>
            <text x={width/2} y={28} textAnchor="middle" fontSize={16} fill={HILITE} fontWeight={700}>Full conjugated path revealed!</text>
            {Array.from({ length: 36 }, (_, i) => (
              <circle key={`k${i}`} cx={20 + Math.random() * (width - 40)} cy={24 + Math.random() * (height - 60)} r={Math.random() * 2 + 1} fill={i % 2 ? HILITE : "#10b981"} opacity={0.8} />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

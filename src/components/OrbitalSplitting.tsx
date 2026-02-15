import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * OrbitalSplitting.tsx — SIMPLE, CLEAN, TESTED
 *
 * Four p orbitals in a row. Click anywhere on an orbital to toggle its phase:
 *   unset → top in-phase (white) → bottom in-phase (white).
 * After the first click, a site never returns to unset via toggle (it flips between top and bottom).
 * When the global pattern matches a valid MO phase pattern for N=4,
 * that energy level is revealed on the ladder with a short animation, and a
 * mini "cartoon" for that level appears next to the rung (like the thesis diagram).
 *
 * Valid patterns (overall sign doesn't matter):
 *   k=1: + + + +      (lowest, π1)
 *   k=2: + + – –      (π2)
 *   k=3: + – – +      (π3*)
 *   k=4: + – + –      (highest, π4*)
 */

type OrbitalSplittingProps = {
  width?: number;   // ladder SVG width (viewBox width)
  height?: number;  // ladder SVG height (viewBox height)
};

const N = 4; // fixed to four orbitals (butadiene-like)

// Hückel energies for N=4 with α = 0, β = -1 (only ordering/spacing matters)
function energiesN4(beta = -1): { k: number; E: number }[] {
  const out = Array.from({ length: N }, (_, i) => {
    const k = i + 1;
    const E = 2 * beta * Math.cos((k * Math.PI) / (N + 1));
    return { k, E };
  });
  return out; // ordered lowest→highest for β<0
}

// Canonical sign patterns for N=4 (overall sign doesn’t matter)
const CANON = new Map<number, number[]>([
  [1, [ 1,  1,  1,  1]],
  [2, [ 1,  1, -1, -1]],
  [3, [ 1, -1, -1,  1]],
  [4, [ 1, -1,  1, -1]],
]);

function sameUpToGlobalSign(a: number[], b: number[]): boolean {
  const same = a.every((v, i) => v === b[i]);
  const neg  = a.every((v, i) => v === -b[i]);
  return same || neg;
}

function matchLevel(phases: number[]): number | null {
  if (phases.some((p) => p === 0)) return null; // require explicit choices first
  for (const [k, pat] of CANON) if (sameUpToGlobalSign(phases, pat)) return k;
  return null;
}

export default function OrbitalSplitting({ width = 360, height = 300 }: OrbitalSplittingProps) {
  const energies = useMemo(() => energiesN4(-1), []);
  const homo = 2, lumo = 3; // for 4 π e⁻

  const [phases, setPhases] = useState<number[]>([0, 0, 0, 0]); // 0 = unset
  const [unlocked, setUnlocked] = useState<boolean[]>([false, false, false, false]);
  const [recent, setRecent] = useState<number | null>(null);

  const y = (E: number) => {
    const minE = Math.min(...energies.map((e) => e.E));
    const maxE = Math.max(...energies.map((e) => e.E));
    const pad = 24;
    return pad + (maxE - E) * ((height - 2 * pad) / (maxE - minE));
  };

  // Determine if current phases match an MO; unlock in an effect (avoids setState in render)
  const kMatch = useMemo(() => matchLevel(phases), [phases]);
  useEffect(() => {
    if (kMatch && !unlocked[kMatch - 1]) {
      setUnlocked((prev) => {
        if (prev[kMatch - 1]) return prev;
        const next = [...prev];
        next[kMatch - 1] = true;
        return next;
      });
      setRecent(kMatch);
    }
  }, [kMatch, unlocked]);

  const toggleSite = (idx: number) => {
    setPhases((prev) => {
      const next = [...prev];
      // New rule: once a site is chosen, it never returns to 0 (unset) via toggle.
      // Initial: 0 → +1; thereafter: +1 ↔ -1 on each click.
      next[idx] = prev[idx] === 0 ? 1 : -prev[idx];
      return next;
    });
  };

  const reset = () => {
    setPhases([0, 0, 0, 0]);
    setUnlocked([false, false, false, false]);
    setRecent(null);
  };

  /** Small SVG of four p-orbitals with clickable lobes */
  const OrbitalSVG = () => {
    const W = 420, H = 220;
    const margin = 40;
    const step = (W - 2 * margin) / (N - 1);
    const y0 = H / 2;
    const rx = 18, ry = 30; // ellipse shape — clean, readable "orbital"
    const fillPlus = "#ffffff"; // white = in-phase
    const fillMinus = "#1f2937"; // gray-800 = out-of-phase
    const stroke = "#111827"; // gray-900 outline

    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto block"
      >
        {/* backbone line (nodal plane) */}
        <line x1={margin - 20} x2={W - margin + 20} y1={y0} y2={y0} stroke="#cbd5e1" strokeWidth={1} pointerEvents="none" />

        {phases.map((p, i) => {
          const x = margin + i * step;
          return (
            <g key={i} onClick={() => toggleSite(i)} className="group cursor-pointer select-none" pointerEvents="all">
              {/* top lobe */}
              <ellipse
                cx={x}
                cy={y0 - ry}
                rx={rx}
                ry={ry}
                fill={p === 0 ? "transparent" : p === 1 ? fillPlus : fillMinus}
                stroke={stroke}
                className="cursor-pointer"
                pointerEvents="all"
              />
              {/* bottom lobe */}
              <ellipse
                cx={x}
                cy={y0 + ry}
                rx={rx}
                ry={ry}
                fill={p === 0 ? "transparent" : p === -1 ? fillPlus : fillMinus}
                stroke={stroke}
                className="cursor-pointer"
                pointerEvents="all"
              />

              {/* inter-site node indicator */}
              {i < phases.length - 1 && (
                <g>
                  <line x1={x} x2={x + step} y1={y0} y2={y0} stroke="#cbd5e1" strokeDasharray="2 4" pointerEvents="none" />
                  {phases[i] !== 0 && phases[i + 1] !== 0 && phases[i] !== phases[i + 1] && (
                    <text x={x + step / 2} y={y0 - 8} textAnchor="middle" className="fill-amber-600 text-[10px]" pointerEvents="none">node</text>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  // Layout constants for the ladder section (single declaration to avoid duplicate identifiers)
  const CARTOON_SPACE = 64; // px, reserved space to the right of rungs for mini cartoons
  const RUNG_LEFT = 60;     // px, left x for rung

  return (
    <div className="w-full flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">π/π* Phase Match (4 orbitals)</h2>
        <button onClick={reset} className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-sm hover:bg-slate-900">Reset</button>
      </div>

      {/* Side-by-side: Orbitals (left) | Ladder (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Orbital picker (nice-looking lobes) */}
        <div className="rounded-2xl shadow p-4 bg-white border border-slate-200">
          <div className="text-lg font-medium">Click lobes to set phase</div>
          <div className="text-sm text-slate-600">Click an orbital to toggle: unset → top in-phase (white) → bottom in-phase (white), then it flips between top and bottom (no return to unset).</div>

          <div className="mt-2">
            <OrbitalSVG />
          </div>

          <div className="mt-2 flex items-center justify-between text-sm">
            <div>Pattern: <span className="font-mono">{phases.map((v) => (v === 0 ? "·" : v === 1 ? "+" : "–")).join("")}</span></div>
            <div>Unlocked: {unlocked.filter(Boolean).length}/4</div>
          </div>

          <AnimatePresence>
            {recent && (
              <motion.div
                key={`snap-${recent}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"
              >
                Snapped! You unlocked <span className="font-semibold">{recent <= 2 ? `π${recent}` : `π${recent}*`}</span>.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ladder (rungs hidden until unlocked) */}
        <div className="rounded-2xl shadow p-4 bg-white border border-slate-200">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-lg font-medium">Energy ladder (N = 4)</div>
            </div>
            <div className="text-xs text-slate-500">rungs appear when unlocked</div>
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            className="mt-3 w-full h-auto block"
          >
            {/* axis */}
            <line x1={48} x2={48} y1={12} y2={height - 12} stroke="#64748b" strokeWidth={1} />
            <text x={16} y={16} className="fill-slate-600 text-[10px]">E</text>

            {energies.map(({ k, E }) => {
              const isHOMO = k === homo;
              const isLUMO = k === lumo;
              const color = E <= 0 ? "#ef4444" : "#3b82f6"; // HOMO red, LUMO blue (consistency)
              const on = unlocked[k - 1];
              const rungRight = width - 24 - CARTOON_SPACE;
              return (
                <g key={k}>
                  <AnimatePresence>
                    {on && (
                      <motion.line
                        initial={{ opacity: 0, x1: (RUNG_LEFT + rungRight) / 2, x2: (RUNG_LEFT + rungRight) / 2, y1: y(E), y2: y(E) }}
                        animate={{ opacity: 1, x1: RUNG_LEFT, x2: rungRight, y1: y(E), y2: y(E) }}
                        transition={{ duration: 0.45 }}
                        stroke={color}
                        strokeWidth={isHOMO || isLUMO ? 3 : 2}
                      />
                    )}
                  </AnimatePresence>

                  {/* labels + cartoon appear only when rung is unlocked */}
                  {on && (
                    <>
                      <text x={10} y={y(E) + 3} className="fill-slate-700 text-[10px]">{k <= 2 ? `π${k}` : `π${k}\u202F*`}</text>
                      {isHOMO && <text x={rungRight - 30} y={y(E) - 6} className="fill-slate-800 text-[11px] font-semibold">HOMO</text>}
                      {isLUMO && <text x={rungRight - 30} y={y(E) - 6} className="fill-slate-800 text-[11px] font-semibold">LUMO</text>}

                      {/* mini cartoon of the canonical phase pattern for this level */}
                      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} transform={`translate(${rungRight + 8}, ${y(E)})`}>
                        {(() => {
                          const pat = CANON.get(k)!;
                          const rx2 = 4, ry2 = 6, step2 = 12, stroke2 = "#111827";
                          return (
                            <g>
                              {pat.map((sign, j) => (
                                <g key={j}>
                                  <ellipse cx={j * step2} cy={-ry2 - 1} rx={rx2} ry={ry2} fill={sign === 1 ? "#ffffff" : "#111827"} stroke={stroke2} />
                                  <ellipse cx={j * step2} cy={ry2 + 1} rx={rx2} ry={ry2} fill={sign === -1 ? "#ffffff" : "#111827"} stroke={stroke2} />
                                </g>
                              ))}
                            </g>
                          );
                        })()}
                      </motion.g>
                    </>
                  )}

                  {/* victory flash when this is the most recent */}
                  {recent === k && (
                    <motion.rect
                      x={56}
                      y={y(E) - 6}
                      width={width - 80}
                      height={12}
                      rx={6}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 0.25, scale: 1 }}
                      transition={{ duration: 0.6 }}
                      fill="#f59e0b"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          <div className="mt-2 text-xs text-slate-600">Valid targets: <span className="font-semibold">++++</span> (lowest), <span className="font-semibold">++––</span>, <span className="font-semibold">+––+</span>, <span className="font-semibold">+-+-</span> (highest). Overall sign doesn’t matter.</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------
   Minimal self-tests (dev)
   ------------------------ */
// These simple assertions run in dev (Vite: import.meta.env.DEV) and help ensure
// the phase-matching logic stays correct. They do not affect production.
if (import.meta.env.DEV) {
  const expect = (name: string, cond: boolean) => {
    console.assert(cond, `OrbitalSplitting self-test failed: ${name}`);
  };
  const t = (pattern: number[], expected: number | null) =>
    expect(`${pattern.join("")}->${expected}`, matchLevel(pattern) === expected);

  // Canonical + global sign twin patterns
  t([ 1,  1,  1,  1], 1);
  t([-1, -1, -1, -1], 1);
  t([ 1,  1, -1, -1], 2);
  t([-1, -1,  1,  1], 2);
  t([ 1, -1, -1,  1], 3);
  t([-1,  1,  1, -1], 3);
  t([ 1, -1,  1, -1], 4);
  t([-1,  1, -1,  1], 4);

  // Non-matches
  t([ 1,  1,  1, -1], null);
  t([ 1,  1, -1,  1], null);
  t([ 0,  0,  0,  0], null); // unset state should never unlock
  t([ 0,  1,  1,  1], null);
  t([ 1,  0,  1,  1], null);
  t([ 1,  1,  0,  1], null);
  t([ 1,  1,  1,  0], null);

  // Extra sanity checks
  const es = energiesN4(-1).map((e) => e.E);
  const strictlyAscending = es.every((v, i, a) => i === 0 || a[i - 1] < v);
  expect("energies are strictly ascending for β<0", strictlyAscending);
  expect("sign equivalence helper works", sameUpToGlobalSign([1,1,1,1], [-1,-1,-1,-1]) === true);
  expect("CANON has 4 patterns", CANON.size === 4);
}

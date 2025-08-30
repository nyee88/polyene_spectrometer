import { useMemo, useState } from "react";
import BetaCaroteneConjugation from "./BetaCaroteneConjugation"; // <-- exact casing

// Interactive Conjugated Alkene Spectrometer
// Single-file React app. Uses SVG for both the molecule view and the UV-Vis spectrum.
// Tailwind is loaded via CDN in index.html.

// --- Helper math ---
function gaussian(x: number, mu: number, sigma: number) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z);
}

// Map conjugation length (number of double bonds, n) -> approximate lambda_max (nm)
// Pedagogical fit: starts in deep UV and red-shifts into visible as n increases.
function lambdaMaxFromN(n: number) {
  // Baseline ~180 nm for n=1, ~290 nm at n=2–3, ~450–650 nm by n=8–12
  const lin = 180 + 28 * (n - 1);
  const accel = 10 * Math.pow(Math.max(0, n - 3), 1.3);
  return Math.min(760, lin + accel);
}

// Map wavelength (nm) to an approximate sRGB string for the visible range; falls back to gray in UV
function wavelengthToRGB(wavelength: number) {
  if (wavelength < 380 || wavelength > 740) return "#888888";
  const w = wavelength;
  let r = 0, g = 0, b = 0;
  if (w >= 380 && w < 440) {
    r = -(w - 440) / (440 - 380); g = 0; b = 1;
  } else if (w >= 440 && w < 490) {
    r = 0; g = (w - 440) / (490 - 440); b = 1;
  } else if (w >= 490 && w < 510) {
    r = 0; g = 1; b = -(w - 510) / (510 - 490);
  } else if (w >= 510 && w < 580) {
    r = (w - 510) / (580 - 510); g = 1; b = 0;
  } else if (w >= 580 && w < 645) {
    r = 1; g = -(w - 645) / (645 - 580); b = 0;
  } else if (w >= 645 && w <= 740) {
    r = 1; g = 0; b = 0;
  }
  const gamma = 0.8;
  const factor = (w < 420) ? 0.3 + 0.7 * (w - 380) / (420 - 380)
                : (w > 700) ? 0.3 + 0.7 * (740 - w) / (740 - 700)
                : 1.0;
  const to255 = (v: number) =>
    Math.round(255 * Math.pow(Math.max(0, Math.min(1, v * factor)), gamma));
  return `rgb(${to255(r)}, ${to255(g)}, ${to255(b)})`;
}

// Convert wavelength (nm) to photon energy (eV)
function eVfromNm(lambda: number){
  return 1240 / Math.max(1e-6, lambda);
}

// ──────────────────────────────────────────────────────────────────────────────
// HOMO–LUMO PANEL
// ──────────────────────────────────────────────────────────────────────────────
function HomoLumoPanel({ lambda }: { lambda: number }) {
  const Eg = eVfromNm(lambda);
  const width = 920, height = 150;
  const m = { left: 28, right: 24, top: 16, bottom: 16 };

  const EgMin = 1240 / 760; // ~1.63 eV
  const EgMax = 1240 / 200; // ~6.20 eV
  const tGap = Math.max(0, Math.min(1, (Eg - EgMin) / (EgMax - EgMin)));
  const innerW = width - m.left - m.right - 16;
  const innerH = height - m.top - m.bottom;

  const boxX = m.left + 8;
  const boxY = m.top;

  const barW = 110;
  const sw = 2.4;
  const x1 = boxX + 26;
  const x2 = x1 + barW;

  const centerY = boxY + innerH / 2;
  const sep = 40 + 70 * tGap; // 40..110 px
  const topPad = 14, botPad = 14;
  let yHOMO = centerY + sep / 2;
  let yLUMO = centerY - sep / 2;
  yLUMO = Math.max(boxY + topPad, yLUMO);
  yHOMO = Math.min(boxY + innerH - botPad, yHOMO);

  const labelRectW = 160;
  const axisX = Math.max(boxX + 14, x1 - 12);
  const xArrow = (x1 + x2) / 2; // arrow centered over the level ticks
  const labelRectX = Math.min(boxX + innerW - 8 - labelRectW, xArrow + 8);
  const labelCenterX = labelRectX + labelRectW / 2;
  const borderW = Math.min(innerW, Math.max(260, labelRectX + labelRectW + 16 - boxX));
  const energyLabelX = Math.max(boxX + 10, axisX - 12);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[150px]">
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="#e11d48" />
        </marker>
        <marker id="axisHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill="#0f172a" />
        </marker>
      </defs>

      {/* Panel box */}
      <rect x={boxX} y={boxY} width={borderW} height={innerH} rx={10} fill="none" stroke="#cbd5e1" />

      {/* Energy axis as arrow */}
      <line x1={axisX} y1={yHOMO + 18} x2={axisX} y2={yLUMO - 18} stroke="#0f172a" strokeWidth={1.4} markerEnd="url(#axisHead)" />
      <text x={energyLabelX} y={(yHOMO + yLUMO)/2} className="text-[11px] fill-slate-700" textAnchor="middle" transform={`rotate(-90 ${energyLabelX},${(yHOMO + yLUMO)/2})`}>Energy (eV)</text>

      {/* HOMO and LUMO levels */}
      <line x1={x1} y1={yHOMO} x2={x2} y2={yHOMO} stroke="#0f172a" strokeWidth={sw} />
      <line x1={x1} y1={yLUMO} x2={x2} y2={yLUMO} stroke="#0f172a" strokeWidth={sw} />
      <text x={(x1 + x2) / 2} y={yHOMO + 12} textAnchor="middle" className="text-[11px] fill-slate-800">HOMO</text>
      <text x={(x1 + x2) / 2} y={yLUMO - 6} textAnchor="middle" className="text-[11px] fill-slate-800">LUMO</text>

      {/* Transition arrow */}
      <line x1={xArrow} y1={yHOMO} x2={xArrow} y2={yLUMO} stroke="#e11d48" strokeWidth={2} markerEnd="url(#arrowhead)" />

      {/* Labels */}
      <rect x={labelRectX} y={(yLUMO + yHOMO)/2 - 18} width={labelRectW} height={36} rx={8} className="fill-white" />
      <text x={labelCenterX} y={(yLUMO + yHOMO)/2 - 2} textAnchor="middle" className="text-[12px] font-semibold fill-rose-600">Eg ≈ {Eg.toFixed(2)} eV</text>
      <text x={labelCenterX} y={(yLUMO + yHOMO)/2 + 12} textAnchor="middle" className="text-[11px] fill-slate-700">λ<tspan baselineShift="sub" fontSize="10px">max</tspan> ≈ {Math.round(lambda)} nm</text>
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// MOLECULE VIEW (minimalist polyene)
// ──────────────────────────────────────────────────────────────────────────────
function MoleculeView({ n }: { n: number }) {
  const atoms = 2 * n; // number of carbons in the conjugated path
  const width = 880, height = 120; // viewBox size
  const marginX = 40;
  const innerW = width - marginX * 2;
  const spacing = Math.min(32, innerW / Math.max(1, atoms - 1));
  const startX = (width - spacing * (atoms - 1)) / 2; // center the chain
  const yMid = height / 2;
  const amp = 16; // zig-zag amplitude

  // Precompute atom positions
  const pts = Array.from({ length: atoms }, (_, i) => {
    const x = startX + i * spacing;
    const y = yMid + (i % 2 === 0 ? -amp : amp);
    return { x, y };
  });

  // Build SVG paths for bonds (double if bond index is odd: 1,3,5,...)
  const bonds: Array<{ x1: number; y1: number; x2: number; y2: number; double: boolean }>= [];
  for (let i = 0; i < atoms - 1; i++) {
    const p1 = pts[i], p2 = pts[i + 1];
    bonds.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, double: (i % 2 === 0) });
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[120px]">
      {bonds.map((b, idx) => {
        const dx = b.x2 - b.x1, dy = b.y2 - b.y1;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len; // unit normal for double bond offset
        const off = 3; // px separation for double bonds
        return (
          <g key={idx}>
            <line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke="#0f172a" strokeWidth={2.2} />
            {b.double && (
              <line x1={b.x1 + nx * off} y1={b.y1 + ny * off} x2={b.x2 + nx * off} y2={b.y2 + ny * off}
                    stroke="#0f172a" strokeWidth={2.2} />
            )}
          </g>
        );
      })}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.6} fill="#0f172a" />
      ))}
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// UV–VIS SPECTRUM
// ──────────────────────────────────────────────────────────────────────────────
function SpectrumChart({ n }: { n: number }) {
  const width = 920, height = 460;
  const m = { top: 20, right: 20, bottom: 96, left: 64 };
  const plotW = width - m.left - m.right;
  const plotH = height - m.top - m.bottom;

  const xMin = 200, xMax = 800;
  const visMin = 380, visMax = 740;

  const lambdaMax = lambdaMaxFromN(n);
  const sigma = 20 + 2.5 * n; // broader bands as conjugation increases (qualitative)
  const aMax = 0.75; // headroom for labels

  const data = useMemo(() => {
    const step = 2; // nm
    const arr: Array<{ x: number; y: number }> = [];
    for (let x = xMin; x <= xMax; x += step) {
      arr.push({ x, y: aMax * gaussian(x, lambdaMax, sigma) });
    }
    return arr;
  }, [lambdaMax, sigma]);

  const xScale = (x: number) => m.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const yScale = (y: number) => m.top + (1 - y) * plotH;

  const pathD = useMemo(() => data.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(d.x)},${yScale(d.y)}`).join(" "), [data]);

  const ticksX = [200, 300, 400, 500, 600, 700, 800];
  const ticksY = [0, 0.25, 0.5, 0.75, 1.0];

  const labelW = 140;
  const xL = xScale(lambdaMax);
  const labelX = Math.max(m.left, Math.min(m.left + plotW - labelW, xL - labelW / 2));
  const labelYRect = Math.max(m.top + 4, yScale(aMax) - 28);
  const labelYText = labelYRect + 16;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[460px]">
      <defs>
        <linearGradient id="visGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={wavelengthToRGB(visMin)} />
          <stop offset="14%" stopColor={wavelengthToRGB(420)} />
          <stop offset="29%" stopColor={wavelengthToRGB(460)} />
          <stop offset="43%" stopColor={wavelengthToRGB(500)} />
          <stop offset="57%" stopColor={wavelengthToRGB(540)} />
          <stop offset="71%" stopColor={wavelengthToRGB(580)} />
          <stop offset="86%" stopColor={wavelengthToRGB(620)} />
          <stop offset="100%" stopColor={wavelengthToRGB(visMax)} />
        </linearGradient>
        <clipPath id="plotArea">
          <rect x={m.left} y={m.top} width={plotW} height={plotH} rx={8} ry={8} />
        </clipPath>
      </defs>

      {/* Panel box around UV–Vis chart */}
      <rect x={m.left - 44} y={m.top - 10} width={plotW + 88} height={plotH + 20} rx={10} fill="none" stroke="#cbd5e1" />

      {/* Axes */}
      <line x1={m.left} y1={m.top + plotH} x2={m.left + plotW} y2={m.top + plotH} stroke="#0f172a" strokeWidth={2.0} />
      {ticksX.map((t, i) => (
        <g key={i}>
          <line x1={xScale(t)} y1={m.top + plotH} x2={xScale(t)} y2={m.top + plotH + 6} stroke="#0f172a" />
          <text x={xScale(t)} y={m.top + plotH + 22} textAnchor="middle" className="fill-slate-800 text-[13px]">{t}</text>
        </g>
      ))}
      <text x={m.left + plotW / 2} y={height - 8} textAnchor="middle" className="fill-slate-900 text-[14px] font-medium">Wavelength (nm)</text>

      <line x1={m.left} y1={m.top} x2={m.left} y2={m.top + plotH} stroke="#0f172a" strokeWidth={2.0} />
      {ticksY.map((t, i) => (
        <g key={i}>
          <line x1={m.left - 6} y1={yScale(t)} x2={m.left} y2={yScale(t)} stroke="#0f172a" />
          <text x={m.left - 10} y={yScale(t) + 3} textAnchor="end" className="fill-slate-800 text-[13px]">{t.toFixed(2)}</text>
        </g>
      ))}
      <text x={m.left - 34} y={m.top + plotH / 2} textAnchor="middle" className="fill-slate-900 text-[14px] font-medium" transform={`rotate(-90 ${m.left - 34},${m.top + plotH / 2})`}>Absorbance (a.u.)</text>

      {/* Visible spectrum bar */}
      <rect x={xScale(visMin)} y={m.top + plotH + 32} width={xScale(visMax) - xScale(visMin)} height={16} fill="url(#visGrad)" rx={6} />
      <text x={xScale(visMin) - 6} y={m.top + plotH + 44} className="fill-slate-700 text-[9px]" textAnchor="end">UV</text>
      <text x={xScale(visMax) + 6} y={m.top + plotH + 44} className="fill-slate-700 text-[9px]">IR</text>

      {/* Peak & λmax */}
      <g clipPath="url(#plotArea)">
        <line x1={xScale(lambdaMax)} y1={m.top} x2={xScale(lambdaMax)} y2={m.top + plotH} stroke="#e11d48" strokeDasharray="4,4" strokeOpacity={0.55} />
        <path d={pathD} fill="none" stroke="#0ea5e9" strokeWidth={3} />
        <path d={`${pathD} L ${m.left + plotW},${m.top + plotH} L ${m.left},${m.top + plotH} Z`} fill="rgba(14,165,233,0.12)" />
      </g>

      <rect x={labelX} y={labelYRect} width={labelW} height={24} rx={6} className="fill-white" />
      <text x={labelX + labelW / 2} y={labelYText} textAnchor="middle" className="fill-rose-600 text-[12px] font-semibold">λ<tspan baselineShift="sub" fontSize="10px">max</tspan> ≈ {Math.round(lambdaMax)} nm</text>
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// APP — single-column article with inline tools
// ──────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [n, setN] = useState(4); // number of conjugated double bonds
  const lambdaMax = useMemo(() => lambdaMaxFromN(n), [n]);

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        {/* Title + byline */}
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Interactive Conjugated Alkene Spectrometer</h1>
          <p className="text-sm text-slate-600">By Nathan</p>
        </header>

        {/* Intro text */}
        <section className="space-y-4 leading-relaxed">
          <p>Your phone screen lights up, but a grocery bag doesn't. Both are plastics!</p>
          <p>
            Increasing the length of the conjugated π-system lowers the HOMO–LUMO gap,
            shifting λ<sub>max</sub> to longer wavelength (lower energy).
          </p>
        </section>

        {/* Molecule tool inline */}
        <section className="rounded-2xl bg-white shadow p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Minimalist polyene (2n carbons)</h2>
            <span className="text-xs text-slate-500">Double bonds shown as parallel lines</span>
          </div>
          <MoleculeView n={n} />
          <div>
            <label htmlFor="nSlider" className="block text-sm font-medium mb-1">Conjugation (n)</label>
            <input
              id="nSlider"
              type="range"
              min={1}
              max={12}
              step={1}
              value={n}
              onChange={(e) => setN(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-500"><span>1</span><span>12</span></div>
          </div>
        </section>

        {/* Spectrum tool inline */}
        <section className="rounded-2xl bg-white shadow p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Simulated UV–Vis absorption</h2>
            <span className="text-xs text-slate-500">Bathochromic (red) shift as n increases</span>
          </div>
          <HomoLumoPanel lambda={lambdaMax} />
          <SpectrumChart n={n} />
        </section>

        {/* β-Carotene section */}
        <section className="rounded-2xl bg-white shadow p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">β-Carotene Conjugation</h2>
            <span className="text-xs text-slate-500">From polyenes to carotenoids</span>
          </div>
          <BetaCaroteneConjugation />
        </section>

        {/* Closing line */}
        <p className="text-sm text-slate-700">
          The growing π-conjugation narrows the HOMO–LUMO gap, decreasing transition energy and shifting absorption into the visible — linking structure to color.
        </p>
      </main>

      {/* Minimal runtime checks in console (sanity tests) */}
      <script suppressHydrationWarning>{`
        (function(){
          try {
            var ok1 = (${lambdaMaxFromN(2)} < ${lambdaMaxFromN(6)});
            console.assert(ok1, 'Test: lambdaMaxFromN should red-shift with n');
            var e1 = ${eVfromNm(620).toFixed(2)}; var e2 = ${eVfromNm(310).toFixed(2)};
            console.assert(e1 < e2, 'Test: photon energy decreases with wavelength');
            var prod = ${eVfromNm(500).toFixed(2)} * 500;
            console.assert(Math.abs(prod - 1240) < 10, 'Test: eVfromNm*lambda ≈ 1240');
          } catch (e) {}
        })();
      `}</script>
    </div>
  );
}

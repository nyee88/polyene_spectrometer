import React from "react";

/* =============================================================================
   WavelengthColor (inline copy used by this explorer)
   ========================================================================== */
type WavelengthColorProps = {
  minNM?: number;
  maxNM?: number;
  visibleMin?: number;
  visibleMax?: number;
  tickStep?: number;
  tickScope?: "visible" | "full";
  barHeight?: number;
  width?: number;
  padding?: number;
  cornerRadius?: number;
  title?: string;
  caption?: React.ReactNode;
  fontFamily?: string;
  fontSize?: number;
  className?: string;
  showUVIR?: boolean;
  labelUV?: string;
  labelIR?: string;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const ticks = (minNM: number, maxNM: number, step: number): number[] => {
  const start = Math.ceil(minNM / step) * step;
  const out: number[] = [];
  for (let t = start; t <= maxNM; t += step) out.push(t);
  if (out[0] !== minNM) out.unshift(minNM);
  if (out[out.length - 1] !== maxNM) out.push(maxNM);
  return out;
};
function wavelengthToSRGB(nm: number): { r: number; g: number; b: number } {
  let r = 0, g = 0, b = 0, factor = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; g = 0; b = 1; }
  else if (nm >= 440 && nm < 490) { r = 0; g = (nm - 440) / 50; b = 1; }
  else if (nm >= 490 && nm < 510) { r = 0; g = 1; b = -(nm - 510) / 20; }
  else if (nm >= 510 && nm < 580) { r = (nm - 510) / 70; g = 1; b = 0; }
  else if (nm >= 580 && nm < 645) { r = 1; g = -(nm - 645) / 65; b = 0; }
  else if (nm >= 645 && nm <= 780) { r = 1; g = 0; b = 0; }

  if (nm >= 380 && nm < 420) factor = 0.3 + 0.7 * (nm - 380) / 40;
  else if (nm >= 420 && nm < 701) factor = 1;
  else if (nm >= 701 && nm <= 780) factor = 0.3 + 0.7 * (780 - nm) / 80;

  const gamma = 0.8;
  const to255 = (c: number) =>
    Math.round(255 * Math.pow(Math.max(0, c) * Math.max(0, factor), gamma));
  return { r: to255(r), g: to255(g), b: to255(b) };
}
const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map(v => v.toString(16).padStart(2, "0")).join("")}`;
const nmToColor = (nm: number) => {
  const { r, g, b } = wavelengthToSRGB(nm);
  return rgbToHex(r, g, b);
};

// label culling (keep ticks, hide overlapping labels)
function cullTicksBySpacing(
  ticksArr: number[],
  toX: (nm: number) => number,
  minDx: number
) {
  const out: number[] = [];
  let last = -Infinity;
  for (const t of ticksArr) {
    const x = toX(t);
    if (x - last >= minDx) { out.push(t); last = x; }
  }
  return out;
}

function WavelengthColor({
  minNM = 350,
  maxNM = 750,
  visibleMin = 400,
  visibleMax = 700,
  tickStep = 50,
  tickScope = "visible",
  barHeight = 36,
  width = 720,
  padding = 16,
  cornerRadius = 6,
  title = "Wavelength and perceived color",
  caption,
  fontFamily = "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
  fontSize = 12,
  className,
  showUVIR = true,

}: WavelengthColorProps) {
  const nmMin = Math.min(minNM, maxNM);
  const nmMax = Math.max(minNM, maxNM);
  const visMin = clamp(Math.min(visibleMin, visibleMax), nmMin, nmMax);
  const visMax = clamp(Math.max(visibleMin, visibleMax), nmMin, nmMax);

  const pad = padding;
  const titleH = title ? 22 : 0;
  const innerW = width - pad * 2;
  const barY = pad + titleH;
  const axisGapBelow = 12;
  const svgHeight = pad + titleH + barHeight + axisGapBelow + pad;

  const idBase = React.useId();
  const gradId = `${idBase}-visGrad`;
  const clipId = `${idBase}-clip`;
  const patId = `${idBase}-stripe`;

  const toX = (nm: number) => pad + ((nm - nmMin) / (nmMax - nmMin)) * innerW;
  const xUV0 = toX(nmMin);
  const xVis0 = toX(visMin);
  const xVis1 = toX(visMax);
  const xIR1 = toX(nmMax);

  const tickMin = tickScope === "full" ? nmMin : visMin;
  const tickMax = tickScope === "full" ? nmMax : visMax;
  const tickVals = ticks(tickMin, tickMax, tickStep);

  const fullTickLeft = pad + cornerRadius;
  const fullTickRight = pad + innerW - cornerRadius;
  const visTickLeft = xVis0;
  const visTickRight = xVis1;

  const stops: { offset: number; color: string }[] = [];
  for (let nm = visMin; nm <= visMax; nm += 5) {
    const off = ((nm - visMin) / (visMax - visMin)) * 100;
    stops.push({ offset: off, color: nmToColor(nm) });
  }

  // compute labels to show
  const labelMinDx = 44;
  const labelToX = (t: number) => {
    const left = tickScope === "full" ? fullTickLeft : visTickLeft;
    const right = tickScope === "full" ? fullTickRight : visTickRight;
    const min = tickScope === "full" ? minNM : visMin;
    const max = tickScope === "full" ? maxNM : visMax;
    return left + ((t - min) / (max - min)) * (right - left);
  };
  const labeledTicks = cullTicksBySpacing(tickVals, labelToX, labelMinDx);

  return (
    <figure className={className} aria-label="Wavelength bar with UV, visible, and IR regions">
      <svg
        role="img"
        width={width}
        height={svgHeight}
        viewBox={`0 0 ${width} ${svgHeight}`}
        aria-labelledby={`${idBase}-title ${idBase}-desc`}
        className="select-none"
      >
        <title id={`${idBase}-title`}>{title}</title>
        <desc id={`${idBase}-desc`}>
          Axis from {minNM} to {maxNM} nm. UV/IR are hatched; visible {visMin}–{visMax} nm is a gradient. Ticks shown in {tickScope} range.
        </desc>
        <defs>
          <pattern id={patId} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#0f172a0D" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#6b7280" strokeWidth="1" opacity="0.28" shapeRendering="crispEdges" />
            <line x1="3" y1="0" x2="3" y2="6" stroke="#6b7280" strokeWidth="1" opacity="0.28" shapeRendering="crispEdges" />
          </pattern>
          <clipPath id={clipId}>
            <rect x={pad} y={barY} width={innerW} height={barHeight} rx={cornerRadius} />
          </clipPath>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            {stops.map((s, i) => (
              <stop key={i} offset={`${s.offset}%`} stopColor={s.color} />
            ))}
          </linearGradient>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          {showUVIR && xVis0 > xUV0 && (
            <rect x={xUV0} y={barY} width={xVis0 - xUV0} height={barHeight} fill={`url(#${patId})`} />
          )}
          <rect x={xVis0} y={barY} width={xVis1 - xVis0} height={barHeight} fill={`url(#${gradId})`} />
          {showUVIR && xIR1 > xVis1 && (
            <rect x={xVis1} y={barY} width={xIR1 - xVis1} height={barHeight} fill={`url(#${patId})`} />
          )}
        </g>

        {/* tick marks */}
        {tickVals.map((t) => {
          const left = tickScope === "full" ? fullTickLeft : visTickLeft;
          const right = tickScope === "full" ? fullTickRight : visTickRight;
          const min = tickScope === "full" ? minNM : visMin;
          const max = tickScope === "full" ? maxNM : visMax;
          const x = left + ((t - min) / (max - min)) * (right - left);
          return <line key={`tick-${t}`} x1={x} x2={x} y1={barY + barHeight} y2={barY + barHeight + 6} stroke="#111827" strokeWidth={1} />;
        })}

        {/* labels (culled) */}
        {labeledTicks.map((t) => (
          <text key={`label-${t}`} x={labelToX(t)} y={barY + barHeight + 18} fontFamily={fontFamily} fontSize={fontSize} textAnchor="middle" fill="#111827">
            {t} nm
          </text>
        ))}
      </svg>

      {caption ? <figcaption className="mt-1">{caption}</figcaption> : null}
    </figure>
  );
}

/* =============================================================================
   Color science helpers (CIE 1931 2° CMFs + D65 + Beer–Lambert)
   ========================================================================== */
const WL = Array.from({ length: 31 }, (_, i) => 400 + i * 10);
const CMF_X = [0.01431,0.04351,0.13438,0.28390,0.34828,0.33620,0.29080,0.19536,0.09564,0.03201,0.00490,0.00930,0.06327,0.16550,0.29040,0.43345,0.59450,0.76210,0.91630,1.02630,1.06220,1.00260,0.85445,0.64240,0.44790,0.28350,0.16490,0.08740,0.04677,0.02270,0.01136];
const CMF_Y = [0.000396,0.00121,0.00400,0.01160,0.02300,0.03800,0.06000,0.09098,0.13902,0.20802,0.32300,0.50300,0.71000,0.86200,0.95400,0.99500,0.99500,0.95200,0.87000,0.75700,0.63100,0.50300,0.38100,0.26500,0.17500,0.10700,0.06100,0.03200,0.01700,0.00820,0.00410];
const CMF_Z = [0.06785,0.20740,0.64560,1.38560,1.74710,1.77210,1.66920,1.28760,0.81300,0.46518,0.27200,0.15820,0.07825,0.04216,0.02030,0.00875,0.00390,0.00210,0.00165,0.00110,0.00078,0.00057,0.00042,0.00030,0.00021,0.00015,0.00010,0.00005,0.00003,0.000015,0.000008];
const D65 = [82.75,91.49,93.43,86.68,104.86,117.01,117.81,114.86,115.92,108.81,109.35,107.80,104.79,107.69,104.41,104.05,100.00,96.33,95.79,88.69,90.02,89.60,87.70,83.29,83.70,80.03,80.21,82.28,78.28,69.72,71.61];

function interp1(xArr: number[], yArr: number[], x: number): number {
  if (x <= xArr[0]) return yArr[0];
  if (x >= xArr[xArr.length - 1]) return yArr[yArr.length - 1];
  let i = 0; while (i < xArr.length - 1 && xArr[i + 1] < x) i++;
  const x0 = xArr[i], x1 = xArr[i + 1];
  const y0 = yArr[i], y1 = yArr[i + 1];
  const t = (x - x0) / (x1 - x0);
  return y0 + t * (y1 - y0);
}
function integrateXYZ(visibleMin: number, visibleMax: number, T: (nm: number) => number) {
  const step = 5;
  let X = 0, Y = 0, Z = 0, Xw = 0, Yw = 0, Zw = 0;
  for (let nm = visibleMin; nm <= visibleMax; nm += step) {
    const s = interp1(WL, D65, nm);
    const xbar = interp1(WL, CMF_X, nm);
    const ybar = interp1(WL, CMF_Y, nm);
    const zbar = interp1(WL, CMF_Z, nm);
    const t = T(nm);
    X += s * t * xbar; Y += s * t * ybar; Z += s * t * zbar;
    Xw += s * xbar; Yw += s * ybar; Zw += s * zbar;
  }
  if (Yw > 0) {
    const k = 1 / Yw;
    X *= k; Y *= k; Z *= k;
  }
  return { X, Y, Z };
}
function xyzToLinearSRGB(X: number, Y: number, Z: number) {
  const r =  3.2406 * X + -1.5372 * Y + -0.4986 * Z;
  const g = -0.9689 * X +  1.8758 * Y +  0.0415 * Z;
  const b =  0.0557 * X + -0.2040 * Y +  1.0570 * Z;
  return { r, g, b };
}
function compand(v: number) {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1/2.4) - 0.055;
}

/* =============================================================================
   AbsorptionSpectrum (presentational)
   ========================================================================== */
function AbsorptionSpectrum({
  minNM, maxNM, visibleMin, visibleMax, width, padding,
  centerA, fwhmA, a0A,
  twoPeaks, centerB, fwhmB, a0B,
  onMoveCenter
}: {
  minNM: number; maxNM: number; visibleMin: number; visibleMax: number; width: number; padding: number;
  centerA: number; fwhmA: number; a0A: number;
  twoPeaks: boolean; centerB: number; fwhmB: number; a0B: number;
  onMoveCenter: (which: 'A'|'B', nm: number) => void;
}) {
  const nmMin = Math.min(minNM, maxNM);
  const nmMax = Math.max(minNM, maxNM);
  const innerW = width - padding * 2;

  const toX = (nm: number) => padding + ((nm - nmMin) / (nmMax - nmMin)) * innerW;
  const toNM = (x: number) => nmMin + ((x - padding) / innerW) * (nmMax - nmMin);

  const sigmaA = React.useMemo(() => (fwhmA > 0 ? fwhmA / (2 * Math.sqrt(2 * Math.log(2))) : 1), [fwhmA]);
  const sigmaB = React.useMemo(() => (twoPeaks && fwhmB > 0 ? fwhmB / (2 * Math.sqrt(2 * Math.log(2))) : 1), [twoPeaks, fwhmB]);
  const gA = (nm: number) => Math.exp(-0.5 * Math.pow((nm - centerA) / sigmaA, 2));
  const gB = (nm: number) => Math.exp(-0.5 * Math.pow((nm - centerB) / sigmaB, 2));

  const peakH = 64;
  const peakBaseY = peakH;
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  const scale = (a0:number) => Math.min(1, Math.max(0, a0 / 2));
  const pathFor = (g: (nm:number)=>number, sc:number) => {
    const step = 2;
    let d = `M ${toX(nmMin)} ${peakBaseY}`;
    for (let nm = nmMin; nm <= nmMax; nm += step) {
      const x = toX(nm);
      const y = peakBaseY - g(nm) * peakH * sc;
      d += ` L ${x} ${y}`;
    }
    d += ` L ${toX(nmMax)} ${peakBaseY} Z`;
    return d;
  };

  const pathA = React.useMemo(() => pathFor(gA, scale(a0A)), [centerA, sigmaA, a0A]);
  const pathB = React.useMemo(() => (twoPeaks ? pathFor(gB, scale(a0B)) : ""), [twoPeaks, centerB, sigmaB, a0B]);

  // Perceived color via D65 + CMFs + Beer–Lambert; slight saturation lift for legibility
  const perceivedHex = React.useMemo(() => {
    const T = (nm: number) => {
      const A = a0A * gA(nm) + (twoPeaks ? a0B * gB(nm) : 0);
      return Math.pow(10, -A); // transmittance
    };
    const { X, Y, Z } = integrateXYZ(Math.max(visibleMin, 400), Math.min(visibleMax, 700), T);
    let { r, g, b } = xyzToLinearSRGB(X, Y, Z);
    r = Math.max(0, r); g = Math.max(0, g); b = Math.max(0, b);
    // quick HSL bump
    const toHsl = (R: number, G: number, B: number) => {
      const max = Math.max(R, G, B), min = Math.min(R, G, B);
      const l = (max + min) / 2; const d = max - min;
      if (d === 0) return { h: 0, s: 0, l };
      const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      let h = 0;
      switch (max) { case R: h = (G - B) / d + (G < B ? 6 : 0); break;
                     case G: h = (B - R) / d + 2; break;
                     case B: h = (R - G) / d + 4; break; }
      h /= 6; return { h, s, l };
    };
    const fromHsl = (h:number,s:number,l:number)=>{
      const hue2rgb=(p:number,q:number,t:number)=>{
        if(t<0) t+=1; if(t>1) t-=1;
        if(t<1/6) return p+(q-p)*6*t;
        if(t<1/2) return q;
        if(t<2/3) return p+(q-p)*(2/3-t)*6;
        return p;
      };
      if(s===0) return {r:l,g:l,b:l};
      const q=l<0.5? l*(1+s): l+s-l*s; const p=2*l-q;
      return { r:hue2rgb(p,q,h+1/3), g:hue2rgb(p,q,h), b:hue2rgb(p,q,h-1/3) };
    };
    const hsl = toHsl(r,g,b);
    if (hsl.s > 0.02) {
      const s2 = Math.min(1, hsl.s * 1.25);
      const l2 = Math.max(0, Math.min(1, hsl.l * 0.98));
      const rgb2 = fromHsl(hsl.h, s2, l2); r = rgb2.r; g = rgb2.g; b = rgb2.b;
    }
    const R = compand(r), G = compand(g), B = compand(b);
    const toHex = (v:number)=> Math.round(Math.min(255, Math.max(0, v*255))).toString(16).padStart(2,'0');
    return `#${toHex(R)}${toHex(G)}${toHex(B)}`;
  }, [centerA, fwhmA, a0A, twoPeaks, centerB, fwhmB, a0B, visibleMin, visibleMax]);

  // Drag to move the nearest peak
  const [dragging, setDragging] = React.useState(false);
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    updateFromEvent(e);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => { if (dragging) updateFromEvent(e); };
  const onPointerUp   = (e: React.PointerEvent<SVGSVGElement>) => {
    setDragging(false);
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };
  const updateFromEvent = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect(); if (!rect) return;
    const x = e.clientX - rect.left;
    const nm = Math.min(nmMax, Math.max(nmMin, toNM(x)));
    if (!twoPeaks) {
      onMoveCenter('A', nm);
    } else {
      const dA = Math.abs(x - toX(centerA));
      const dB = Math.abs(x - toX(centerB));
      const which = dB < dA ? 'B' : 'A';
      onMoveCenter(which, nm);
    }
  };

  return (
    <div>
      <svg
        ref={svgRef}
        role="img"
        width={width}
        height={64}
        viewBox={`0 0 ${width} ${64}`}
        className="select-none touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        aria-label="Draggable absorption peaks over wavelength"
      >
        <rect x={0} y={0} width={width} height={64} fill="none" />
        <path d={pathA} fill="rgba(59,130,246,0.25)" stroke="rgba(59,130,246,0.7)" strokeWidth={1.5} />
        <text x={toX(centerA)} y={Math.max(12, peakBaseY - scale(a0A) * peakH - 4)} textAnchor="middle" fontSize={10} fill="#334155">
          {Math.round(centerA)} nm
        </text>
        {twoPeaks && (
          <>
            <path d={pathB} fill="rgba(244,63,94,0.25)" stroke="rgba(244,63,94,0.7)" strokeWidth={1.5} />
            <text x={toX(centerB)} y={Math.max(12, peakBaseY - scale(a0B) * peakH - 4)} textAnchor="middle" fontSize={10} fill="#7f1d1d">
              {Math.round(centerB)} nm
            </text>
          </>
        )}
      </svg>

      <div className="mt-1">
        <WavelengthColor minNM={minNM} maxNM={maxNM} visibleMin={visibleMin} visibleMax={visibleMax} tickStep={50} tickScope="visible" width={width} title="" />
      </div>

      {/* Perceived color panel */}
      <div className="mt-3 inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="h-8 w-12 rounded-lg border border-slate-300" style={{ backgroundColor: perceivedHex }} aria-label="Perceived color swatch" />
        <div className="text-sm text-slate-700"><strong>Perceived color</strong></div>
      </div>
    </div>
  );
}

/* =============================================================================
   AbsorptionExplorer (stateful parent) — DEFAULT EXPORT (single!)
   ========================================================================== */
export default function AbsorptionExplorer({
  minNM = 350, maxNM = 750, visibleMin = 400, visibleMax = 700, width = 720, padding = 16,
}: {
  minNM?: number; maxNM?: number; visibleMin?: number; visibleMax?: number; width?: number; padding?: number;
}) {
  const [centerA, setCenterA] = React.useState<number>(550);
  const [fwhmA, setFwhmA]   = React.useState<number>(30);
  const [a0A, setA0A]       = React.useState<number>(0.8);

  const [twoPeaks, setTwoPeaks] = React.useState<boolean>(false);
  const [centerB, setCenterB] = React.useState<number>(620);
  const [fwhmB, setFwhmB]   = React.useState<number>(40);
  const [a0B, setA0B]       = React.useState<number>(0.6);

  return (
    <div className="w-full">
      <AbsorptionSpectrum
        minNM={minNM} maxNM={maxNM} visibleMin={visibleMin} visibleMax={visibleMax} width={width} padding={padding}
        centerA={centerA} fwhmA={fwhmA} a0A={a0A}
        twoPeaks={twoPeaks} centerB={centerB} fwhmB={fwhmB} a0B={a0B}
        onMoveCenter={(which, nm) => (which === 'A' ? setCenterA(nm) : setCenterB(nm))}
      />

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="md:col-span-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={twoPeaks} onChange={(e)=>setTwoPeaks(e.target.checked)} />
          <span>Dual peak</span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-600">Width — Peak A</span>
          <input type="range" min={8} max={120} step={1} value={fwhmA} onChange={(e)=> setFwhmA(parseInt(e.target.value,10))} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-600">Peak height — Peak A</span>
          <input type="range" min={0} max={2} step={0.01} value={a0A} onChange={(e)=>setA0A(parseFloat(e.target.value))} />
        </label>

        {twoPeaks && (
          <>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-600">Width — Peak B</span>
              <input type="range" min={8} max={120} step={1} value={fwhmB} onChange={(e)=> setFwhmB(parseInt(e.target.value,10))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-slate-600">Peak height — Peak B</span>
              <input type="range" min={0} max={2} step={0.01} value={a0B} onChange={(e)=>setA0B(parseFloat(e.target.value))} />
            </label>
          </>
        )}

        <div className="hidden md:flex items-end justify-end text-xs text-slate-500 md:col-span-2">
          Tip: click/drag near a peak to select and move it.
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Colors are qualitative. Spectrum: CIE 1931 2° CMFs with D65 illuminant; reflectance via Beer–Lambert absorbance.
        A small saturation lift is applied for teaching clarity.
      </p>
    </div>
  );
}

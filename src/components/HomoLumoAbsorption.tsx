import React from "react";

/**
 * HomoLumoAbsorption
 * - Left: HOMO/LUMO diagram with draggable bars
 * - Right: simplified absorption viewer (single Gaussian peak, no controls)
 *   Peak center λ is driven by ΔE via λ ≈ 1240 / ΔE. Perceived color shown.
 */

/* ===============================
 * Shared utilities (module scope)
 * =============================== */
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const eVToNm = (ev: number) => 1240 / ev;
const nmToEV = (nm: number) => 1240 / nm;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const invLerp = (a: number, b: number, v: number) => clamp((v - a) / (b - a), 0, 1);

/** Avoid overlapping tick labels; keep all tick marks. */
function cullTicksBySpacing(
  ticks: number[],
  toX: (nm: number) => number,
  minDx: number
) {
  const out: number[] = [];
  let lastX = -Infinity;
  for (const t of ticks) {
    const x = toX(t);
    if (x - lastX >= minDx) {
      out.push(t);
      lastX = x;
    }
  }
  return out;
}

export default function HomoLumoAbsorption({
  width = 720,
  className,
  initialGapEV = 3.24, // ~496 nm
  minGapEV = 1.4, // ~885 nm (IR)
  maxGapEV = 3.5, // ~354 nm (UV)
  caption = (
    <span className="text-xs text-slate-600">
      Drag the <strong>HOMO</strong> (highest filled level) or <strong>LUMO</strong> (next empty
      level) bars to change ΔE. Electrons normally occupy the HOMO; absorbing light can promote
      one to the LUMO. The gap sets the absorption wavelength (λ ≈ 1240/ΔE); the spectrum and
      perceived color update accordingly.
    </span>
  ),
}: {
  width?: number;
  className?: string;
  initialGapEV?: number;
  minGapEV?: number;
  maxGapEV?: number;
  caption?: React.ReactNode;
}) {
  // ---- Tweakables (so you can manually adjust quickly) ----
  const levelStroke = 2; // HOMO/LUMO line thickness
  const deltaStroke = 1.6; // ΔE line thickness
  const labelFont = 13; // HOMO/LUMO label font size
  const arrowFont = 34; // electron arrow size
  const arrowDX = 9; // half-spacing between ↑ and ↓ (px)
  const labelOffLum = -10; // LUMO label vertical offset from line (px)
  const labelOffHom = 24; // HOMO label vertical offset from line (px)
  const levelHalf = 51; // bar half-width (px)
  const leftYOffset = -8; // shifts the entire HOMO/LUMO panel up (px)
  const centerBias = 22; // pushes initial center downward so HOMO starts closer to bottom

  // ---- Layout ----
  const w = width;
  const pad = 16;
  const leftH = 184; // compact height for the HOMO/LUMO panel (smaller box)

  // Left/right panel widths
  const leftW = Math.max(170, Math.min(200, Math.floor(w * 0.25))); // energy diagram
  const gutter = 12;
  const rightW = Math.max(320, w - pad * 2 - leftW - gutter); // spectrum gets the rest

  // Vertical bounds within the left panel
  const axisTop = pad;
  const axisBot = leftH - 46;
  const midY = (axisTop + axisBot) / 2;

  // Bounds for dragging (define before initial positions)
  const yMin = axisTop + 8;  // top guardrail for levels
  const yMax = axisBot - 8;  // bottom guardrail for levels

  // Map ΔE (eV) ↔ pixel separation (use bounds-consistent range)
  const minGapPx = 24;                 // prevent collapse/inversion
  const maxGapPx = yMax - yMin;        // fully reachable given the guardrails

  // Initial y-positions from initial ΔE (ensure both levels start within bounds)
  const t0 = invLerp(minGapEV, maxGapEV, initialGapEV);
  const gap0 = clamp(lerp(minGapPx, maxGapPx, t0), minGapPx, maxGapPx);
  const center0 = clamp(
    midY + centerBias,
    yMin + gap0 / 2,
    yMax - gap0 / 2
  );
  const [lumY, setLumY] = React.useState(center0 - gap0 / 2);
  const [homY, setHomY] = React.useState(center0 + gap0 / 2);

  // Drag state
  const [dragging, setDragging] = React.useState<null | "HOMO" | "LUMO">(null);
  const svgRef = React.useRef<SVGSVGElement | null>(null);

  // Current gap & λ
  const gapPx = clamp(homY - lumY, minGapPx, maxGapPx);
  const tGap = invLerp(minGapPx, maxGapPx, gapPx);
  const gapEV = lerp(minGapEV, maxGapEV, tGap);
  const lambda = clamp(eVToNm(gapEV), 300, 900); // nm (clamped for display)

  // (bounds defined above: yMin/yMax)

  // Center X for the left panel
  const deX = pad + leftW * 0.6;

  // Level extents — centered around ΔE
  const levelLeft = deX - levelHalf;
  const levelRight = deX + levelHalf;

  // Pointer helpers
  function eventToSvgY(e: React.PointerEvent) {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    return e.clientY - rect.top;
  }
  function onPointerDown(which: "HOMO" | "LUMO") {
    return (e: React.PointerEvent) => {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      setDragging(which);
    };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const y = clamp(eventToSvgY(e), yMin, yMax);
    if (dragging === "LUMO") setLumY(Math.min(y, homY - minGapPx));
    else setHomY(Math.max(y, lumY + minGapPx));
  }
  function onPointerUp(e: React.PointerEvent) {
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    setDragging(null);
  }

  // Right panel props
  const nmMin = 350,
    nmMax = 750,
    visMin = 400,
    visMax = 700;

  // ΔE label pill — auto-placed to avoid overlapping the electron arrows
  const deLabelW = 120;
  const deLabelH = 28;
  const svgRight = leftW + pad;
  let deLabelX = levelRight + 18; // try right side first
  if (deLabelX + deLabelW > svgRight) deLabelX = deX - deLabelW - 18; // if overflow, put left
  const deLabelY = (homY + lumY) / 2 - deLabelH / 2;
  // keep pill within bounds, and center ΔE line under it
  deLabelX = Math.max(4, Math.min(deLabelX, svgRight - deLabelW - 4));
  const deCenterX = deLabelX + deLabelW / 2;
  const deLineX = clamp(deCenterX, pad + 4, svgRight - 4);

  return (
    <figure className={className}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        {/* LEFT: Energy diagram */}
        <div className="rounded-lg ring-1 ring-slate-200/70 bg-gradient-to-b from-slate-50/70 to-white/70 backdrop-blur-sm p-2 shadow-sm">
          <svg
            ref={svgRef}
            role="img"
            width={leftW + pad}
            height={leftH}
            viewBox={`0 0 ${leftW + pad} ${leftH}`}
            className="select-none"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            aria-label="HOMO–LUMO diagram with draggable levels"
          >
            <g transform={`translate(0, ${leftYOffset})`}>
              {/* LUMO level */}
              <line x1={levelLeft} y1={lumY} x2={levelRight} y2={lumY} stroke="#0ea5e9" strokeWidth={levelStroke} />
              <text x={deX} y={lumY + labelOffLum} fontSize={labelFont} textAnchor="middle" fill="#0ea5e9">
                LUMO
              </text>
              <rect
                x={levelLeft - 12}
                y={lumY - 10}
                width={levelRight - levelLeft + 24}
                height={20}
                fill="transparent"
                style={{ cursor: "ns-resize" }}
                onPointerDown={onPointerDown("LUMO")}
              />

              {/* HOMO level */}
              <line x1={levelLeft} y1={homY} x2={levelRight} y2={homY} stroke="#ef4444" strokeWidth={levelStroke} />
              <text x={deX} y={homY + labelOffHom} fontSize={labelFont} textAnchor="middle" fill="#ef4444">
                HOMO
              </text>
              <rect
                x={levelLeft - 12}
                y={homY - 10}
                width={levelRight - levelLeft + 24}
                height={20}
                fill="transparent"
                style={{ cursor: "ns-resize" }}
                onPointerDown={onPointerDown("HOMO")}
              />

              {/* Single vertical ΔE marker */}
              <line x1={deLineX} y1={lumY} x2={deLineX} y2={homY} stroke="#334155" strokeWidth={deltaStroke} />
              <line x1={deLineX - 6} y1={lumY} x2={deLineX + 6} y2={lumY} stroke="#334155" strokeWidth={deltaStroke} />
              <line x1={deLineX - 6} y1={homY} x2={deLineX + 6} y2={homY} stroke="#334155" strokeWidth={deltaStroke} />

              {/* ΔE label pill */}
              <g transform={`translate(${deLabelX}, ${deLabelY})`}>
                <rect width={deLabelW} height={deLabelH} rx={6} fill="#f8fafc" stroke="#cbd5e1" />
                <text x={deLabelW / 2} y={18} fontSize={12} textAnchor="middle" fill="#334155">
                  ΔE = {gapEV.toFixed(2)} eV
                </text>
              </g>

              {/* Electrons on HOMO (↑↓) — side-by-side, centered */}
              <g style={{ pointerEvents: "none" }}>
                <text
                  x={deX - arrowDX}
                  y={homY}
                  fontSize={arrowFont}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  alignmentBaseline="middle"
                  fill="#0f172a"
                >
                  ↑
                </text>
                <text
                  x={deX + arrowDX}
                  y={homY}
                  fontSize={arrowFont}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  alignmentBaseline="middle"
                  fill="#0f172a"
                >
                  ↓
                </text>
              </g>
            </g>
          </svg>
        </div>

        {/* RIGHT: Simplified Absorption viewer (single peak, no UI) */}
        <div style={{ width: rightW }} className="shrink-0">
          <AbsorptionMini
            minNM={nmMin}
            maxNM={nmMax}
            visibleMin={visMin}
            visibleMax={visMax}
            width={rightW}
            centerNM={lambda}
            fwhmNM={68}
            peakA0={1.3}
          />
        </div>
      </div>

      <figcaption className="mt-1">{caption}</figcaption>
    </figure>
  );
}

/* ===============================
 * AbsorptionMini (single peak, view-only)
 * =============================== */
function AbsorptionMini({
  minNM = 350,
  maxNM = 750,
  visibleMin = 400,
  visibleMax = 700,
  width = 720,
  padding = 16,
  centerNM = 550,
  fwhmNM = 30,
  peakA0 = 0.8,
}: {
  minNM?: number;
  maxNM?: number;
  visibleMin?: number;
  visibleMax?: number;
  width?: number;
  padding?: number;
  centerNM?: number;
  fwhmNM?: number;
  peakA0?: number;
}) {
  const nmMin = Math.min(minNM, maxNM);
  const nmMax = Math.max(minNM, maxNM);
  const innerW = width - padding * 2;
  const toX = React.useCallback(
    (nm: number) => padding + ((nm - nmMin) / (nmMax - nmMin)) * innerW,
    [innerW, nmMax, nmMin, padding]
  );

  const sigma = React.useMemo(
    () => (fwhmNM > 0 ? fwhmNM / (2 * Math.sqrt(2 * Math.log(2))) : 1),
    [fwhmNM]
  );
  const g = React.useCallback((nm: number) => Math.exp(-0.5 * Math.pow((nm - centerNM) / sigma, 2)), [centerNM, sigma]);
  const peakH = 64;
  const peakBaseY = peakH;

  const scale = (a0: number) => Math.min(1, Math.max(0, a0 / 2));
  const pathA = React.useMemo(() => {
    const sc = scale(peakA0);
    const step = 2;
    let d = `M ${toX(nmMin)} ${peakBaseY}`;
    for (let nm = nmMin; nm <= nmMax; nm += step) {
      const x = toX(nm);
      const y = peakBaseY - g(nm) * peakH * sc;
      d += ` L ${x} ${y}`;
    }
    d += ` L ${toX(nmMax)} ${peakBaseY} Z`;
    return d;
  }, [g, nmMax, nmMin, peakA0, peakBaseY, peakH, toX]);

  // Perceived color via D65 + CMFs + Beer–Lambert
  const perceivedHex = React.useMemo(() => {
    const T = (nm: number) => Math.pow(10, -(peakA0 * g(nm)));
    const { X, Y, Z } = integrateXYZ(Math.max(visibleMin, 400), Math.min(visibleMax, 700), T);
    let { r, g: gg, b } = xyzToLinearSRGB(X, Y, Z);
    r = Math.max(0, r);
    gg = Math.max(0, gg);
    b = Math.max(0, b);

    // slight saturation lift for clarity
    const toHsl = (R: number, G: number, B: number) => {
      const max = Math.max(R, G, B),
        min = Math.min(R, G, B);
      const l = (max + min) / 2;
      const d = max - min;
      if (d === 0) return { h: 0, s: 0, l };
      const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      let h = 0;
      switch (max) {
        case R:
          h = (G - B) / d + (G < B ? 6 : 0);
          break;
        case G:
          h = (B - R) / d + 2;
          break;
        case B:
          h = (R - G) / d + 4;
          break;
      }
      h /= 6;
      return { h, s, l };
    };
    const fromHsl = (h: number, s: number, l: number) => {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      if (s === 0) return { r: l, g: l, b: l };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const { r: R, g: G, b: B } = {
        r: hue2rgb(p, q, h + 1 / 3),
        g: hue2rgb(p, q, h),
        b: hue2rgb(p, q, h - 1 / 3),
      };
      return { r: R, g: G, b: B };
    };
    const hsl = toHsl(r, gg, b);
    if (hsl.s > 0.02) {
      const s2 = Math.min(1, hsl.s * 1.25);
      const l2 = Math.max(0, Math.min(1, hsl.l * 0.98));
      const rgb2 = fromHsl(hsl.h, s2, l2);
      r = rgb2.r;
      gg = rgb2.g;
      b = rgb2.b;
    }
    const R = compand(r),
      G = compand(gg),
      B = compand(b);
    const toHex = (v: number) => Math.round(Math.min(255, Math.max(0, v * 255))).toString(16).padStart(2, "0");
    return `#${toHex(R)}${toHex(G)}${toHex(B)}`;
  }, [peakA0, visibleMin, visibleMax, g]);

  return (
    <div className="w-full">
      {/* Spectrum (view-only) */}
      <svg role="img" width={width} height={64} viewBox={`0 0 ${width} ${64}`} className="select-none touch-none">
        <rect x={0} y={0} width={width} height={64} fill="none" />
        <path d={pathA} fill="rgba(59,130,246,0.25)" stroke="rgba(59,130,246,0.7)" strokeWidth={1.5} />
        <text x={toX(centerNM)} y={Math.max(12, peakBaseY - (peakA0 / 2) * peakH - 4)} textAnchor="middle" fontSize={10} fill="#334155">
          {Math.round(centerNM)} nm
        </text>
      </svg>

      <div className="mt-0">
        <WavelengthColor
          minNM={minNM}
          maxNM={maxNM}
          visibleMin={visibleMin}
          visibleMax={visibleMax}
          tickStep={50}
          tickScope="visible"
          width={width}
          padding={8}
          title=""
        />
      </div>

      {/* Perceived color panel (centered under spectrum) */}
      <div className="mt-2 flex justify-center" style={{ width }}>
        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <div
            className="h-8 w-12 rounded-lg border border-slate-300"
            style={{ backgroundColor: perceivedHex }}
            aria-label="Perceived color swatch"
          />
          <div className="text-sm text-slate-700">
            <strong>Perceived color</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===============================
 * WavelengthColor (inline copy)
 * =============================== */
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
};
function ticks(minNM: number, maxNM: number, step: number): number[] {
  const start = Math.ceil(minNM / step) * step;
  const out: number[] = [];
  for (let t = start; t <= maxNM; t += step) out.push(t);
  if (out[0] !== minNM) out.unshift(minNM);
  if (out[out.length - 1] !== maxNM) out.push(maxNM);
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
  const axisY = barY + barHeight;
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

  // Label culling to avoid overlap
  const labelMinDx = 44; // px
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
          Axis from {minNM} to {maxNM} nm. UV/IR are hatched; visible {visMin}–{visMax} nm is a gradient.
          Ticks shown in {tickScope} range.
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

        {/* Tick marks for all values */}
        {tickVals.map((t) => {
          const left = tickScope === "full" ? fullTickLeft : visTickLeft;
          const right = tickScope === "full" ? fullTickRight : visTickRight;
          const min = tickScope === "full" ? minNM : visMin;
          const max = tickScope === "full" ? maxNM : visMax;
          const x = left + ((t - min) / (max - min)) * (right - left);
          return <line key={`tick-${t}`} x1={x} x2={x} y1={axisY} y2={axisY + 6} stroke="#111827" strokeWidth={1} />;
        })}

        {/* Labels for the culled set only */}
        {labeledTicks.map((t) => (
          <text key={`label-${t}`} x={labelToX(t)} y={axisY + 18} fontFamily={fontFamily} fontSize={fontSize} textAnchor="middle" fill="#111827">
            {t} nm
          </text>
        ))}
      </svg>

      {caption ? <figcaption className="mt-1">{caption}</figcaption> : null}
    </figure>
  );
}

/* ===============================
 * Color science helpers + nm→sRGB
 * =============================== */
function wavelengthToSRGB(nm: number): { r: number; g: number; b: number } {
  let r = 0,
    g = 0,
    b = 0,
    factor = 0;
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / 60;
    g = 0;
    b = 1;
  } else if (nm >= 440 && nm < 490) {
    r = 0;
    g = (nm - 440) / 50;
    b = 1;
  } else if (nm >= 490 && nm < 510) {
    r = 0;
    g = 1;
    b = -(nm - 510) / 20;
  } else if (nm >= 510 && nm < 580) {
    r = (nm - 510) / 70;
    g = 1;
    b = 0;
  } else if (nm >= 580 && nm < 645) {
    r = 1;
    g = -(nm - 645) / 65;
    b = 0;
  } else if (nm >= 645 && nm <= 780) {
    r = 1;
    g = 0;
    b = 0;
  }
  if (nm >= 380 && nm < 420) factor = 0.3 + (0.7 * (nm - 380)) / 40;
  else if (nm >= 420 && nm < 701) factor = 1;
  else if (nm >= 701 && nm <= 780) factor = 0.3 + (0.7 * (780 - nm)) / 80;
  const gamma = 0.8;
  const to255 = (c: number) => Math.round(255 * Math.pow(Math.max(0, c) * Math.max(0, factor), gamma));
  return { r: to255(r), g: to255(g), b: to255(b) };
}
const rgbToHex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
function nmToColor(nm: number) {
  const { r, g, b } = wavelengthToSRGB(nm);
  return rgbToHex(r, g, b);
}

// CIE tables (400–700 nm sampled at 10 nm) and D65
const WL = Array.from({ length: 31 }, (_, i) => 400 + i * 10);
const CMF_X = [
  0.01431, 0.04351, 0.13438, 0.2839, 0.34828, 0.3362, 0.2908, 0.19536, 0.09564, 0.03201, 0.0049, 0.0093, 0.06327, 0.1655,
  0.2904, 0.43345, 0.5945, 0.7621, 0.9163, 1.0263, 1.0622, 1.0026, 0.85445, 0.6424, 0.4479, 0.2835, 0.1649, 0.0874, 0.04677,
  0.0227, 0.01136,
];
const CMF_Y = [
  0.000396, 0.00121, 0.004, 0.0116, 0.023, 0.038, 0.06, 0.09098, 0.13902, 0.20802, 0.323, 0.503, 0.71, 0.862, 0.954, 0.995, 0.995,
  0.952, 0.87, 0.757, 0.631, 0.503, 0.381, 0.265, 0.175, 0.107, 0.061, 0.032, 0.017, 0.0082, 0.0041,
];
const CMF_Z = [
  0.06785, 0.2074, 0.6456, 1.3856, 1.7471, 1.7721, 1.6692, 1.2876, 0.813, 0.46518, 0.272, 0.1582, 0.07825, 0.04216, 0.0203, 0.00875,
  0.0039, 0.0021, 0.00165, 0.0011, 0.00078, 0.00057, 0.00042, 0.0003, 0.00021, 0.00015, 0.0001, 0.00005, 0.00003, 0.000015, 0.000008,
];
const D65 = [
  82.75, 91.49, 93.43, 86.68, 104.86, 117.01, 117.81, 114.86, 115.92, 108.81, 109.35, 107.8, 104.79, 107.69, 104.41, 104.05, 100,
  96.33, 95.79, 88.69, 90.02, 89.6, 87.7, 83.29, 83.7, 80.03, 80.21, 82.28, 78.28, 69.72, 71.61,
];

function interp1(xArr: number[], yArr: number[], x: number): number {
  if (x <= xArr[0]) return yArr[0];
  if (x >= xArr[xArr.length - 1]) return yArr[yArr.length - 1];
  let i = 0;
  while (i < xArr.length - 1 && xArr[i + 1] < x) i++;
  const x0 = xArr[i],
    x1 = xArr[i + 1];
  const y0 = yArr[i],
    y1 = yArr[i + 1];
  const t = (x - x0) / (x1 - x0);
  return y0 + t * (y1 - y0);
}
function integrateXYZ(visibleMin: number, visibleMax: number, T: (nm: number) => number) {
  const step = 5;
  let X = 0,
    Y = 0,
    Z = 0,
    Yw = 0;
  for (let nm = visibleMin; nm <= visibleMax; nm += step) {
    const s = interp1(WL, D65, nm);
    const xbar = interp1(WL, CMF_X, nm);
    const ybar = interp1(WL, CMF_Y, nm);
    const zbar = interp1(WL, CMF_Z, nm);
    const t = T(nm);
    X += s * t * xbar;
    Y += s * t * ybar;
    Z += s * t * zbar;
    Yw += s * ybar;
  }
  if (Yw > 0) {
    const k = 1 / Yw;
    X *= k;
    Y *= k;
    Z *= k;
  }
  return { X, Y, Z };
}
function xyzToLinearSRGB(X: number, Y: number, Z: number) {
  const r = 3.2406 * X + -1.5372 * Y + -0.4986 * Z;
  const g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  const b = 0.0557 * X + -0.204 * Y + 1.057 * Z;
  return { r, g, b };
}
function compand(v: number) {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

/* ===============================
 * Lightweight runtime checks (dev)
 * =============================== */
(() => {
    console.assert(clamp(5, 0, 4) === 4, "clamp upper bound");
    console.assert(clamp(-1, 0, 4) === 0, "clamp lower bound");
    console.assert(Math.round(eVToNm(2.48)) === 500, "eV→nm ~500 nm @ 2.48 eV");
    const evFrom620 = Math.round(nmToEV(620) * 100) / 100; // ~2.00 eV
    console.assert(evFrom620 === 2.0, "nm→eV ~2.00 eV @ 620 nm");
    console.assert(invLerp(0, 10, 0) === 0 && invLerp(0, 10, 10) === 1, "invLerp endpoints");
    console.assert(Math.round(eVToNm(nmToEV(500))) === 500, "eV↔nm roundtrip @ 500 nm");
    const testTicks = [400, 450, 500, 550, 600, 650, 700];
    const identityX = (nm: number) => nm;
    const culled = cullTicksBySpacing(testTicks, identityX, 60);
    console.assert(culled.length < testTicks.length, "label culling drops some labels when crowded");
})();

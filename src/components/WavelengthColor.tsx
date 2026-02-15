import React from "react";

export type WavelengthColorProps = {
  // Axis range (UV/IR sides get whatever space is outside the visible window)
  minNM?: number;        // default 350
  maxNM?: number;        // default 750

  // Visible window
  visibleMin?: number;   // default 400
  visibleMax?: number;   // default 700

  // Ticks
  tickStep?: number;     // default 50
  tickScope?: "visible" | "full"; // default "visible"

  // Layout
  barHeight?: number;    // default 36
  width?: number;        // default 720
  padding?: number;      // default 16
  cornerRadius?: number; // default 6

  // Labels/styling
  title?: string;        // optional SVG title
  caption?: React.ReactNode; // rendered as an HTML figcaption below the SVG
  fontFamily?: string;
  fontSize?: number;
  className?: string;

  // UV/IR rendering
  showUVIR?: boolean;    // default true
  labelUV?: string;      // default "UV"
  labelIR?: string;      // default "IR"
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function ticks(minNM: number, maxNM: number, step: number): number[] {
  const start = Math.ceil(minNM / step) * step;
  const out: number[] = [];
  for (let t = start; t <= maxNM; t += step) out.push(t);
  if (out[0] !== minNM) out.unshift(minNM);
  if (out[out.length - 1] !== maxNM) out.push(maxNM);
  return out;
}

// Approximate nm → sRGB (visible only)
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

export default function WavelengthColor({
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
  labelUV = "UV",
  labelIR = "IR",
}: WavelengthColorProps) {
  // order & clamp
  const nmMin = Math.min(minNM, maxNM);
  const nmMax = Math.max(minNM, maxNM);
  const visMin = clamp(Math.min(visibleMin, visibleMax), nmMin, nmMax);
  const visMax = clamp(Math.max(visibleMin, visibleMax), nmMin, nmMax);
  const nmRange = Math.max(1, nmMax - nmMin);

  const pad = padding;
  const titleH = title ? 22 : 0;
  const innerW = width - pad * 2;
  const barY = pad + titleH;
  const axisY = barY + barHeight;
  const axisGapBelow = 12;
  // Leave bottom margin for optional figcaption (outside the SVG)
  const svgHeight = pad + titleH + barHeight + axisGapBelow + pad;

  const idBase = React.useId();
  const gradId = `${idBase}-visGrad`;
  const clipId = `${idBase}-clip`;
  const patId = `${idBase}-stripe`;

  // mappers
  const toX = (nm: number) => pad + ((nm - nmMin) / nmRange) * innerW;
  const xUV0 = toX(nmMin);
  const xVis0 = toX(visMin);
  const xVis1 = toX(visMax);
  const xIR1 = toX(nmMax);

  // ticks (full vs visible)
  const tickMin = tickScope === "full" ? nmMin : visMin;
  const tickMax = tickScope === "full" ? nmMax : visMax;
  const tickVals = ticks(tickMin, tickMax, tickStep);

  // Map ticks so end ticks visually touch rounded ends when using full scope
  const fullTickLeft = pad + cornerRadius;
  const fullTickRight = pad + innerW - cornerRadius;
  const visTickLeft = xVis0;
  const visTickRight = xVis1;

  // visible gradient stops
  const stops: { offset: number; color: string }[] = [];
  for (let nm = visMin; nm <= visMax; nm += 5) {
    const off = ((nm - visMin) / (visMax - visMin)) * 100;
    stops.push({ offset: off, color: nmToColor(nm) });
  }

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
          Axis from {nmMin} to {nmMax} nm. UV/IR are hatched; visible {visMin}–{visMax} nm is a gradient. Ticks shown in {tickScope} range.
        </desc>

        <defs>
          {/* hatch pattern (used for both UV and IR for consistency) */}
          <pattern id={patId} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="#0f172a0D" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="#6b7280" strokeWidth="1" opacity="0.28" shapeRendering="crispEdges" />
            <line x1="3" y1="0" x2="3" y2="6" stroke="#6b7280" strokeWidth="1" opacity="0.28" shapeRendering="crispEdges" />
          </pattern>

          {/* clip keeps rounded corners clean */}
          <clipPath id={clipId}>
            <rect x={pad} y={barY} width={innerW} height={barHeight} rx={cornerRadius} />
          </clipPath>

          {/* visible gradient */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            {stops.map((s, i) => (
              <stop key={i} offset={`${s.offset}%`} stopColor={s.color} />
            ))}
          </linearGradient>
        </defs>

        {/* bar regions */}
        <g clipPath={`url(#${clipId})`}>
          {showUVIR && xVis0 > xUV0 && (
            <rect x={xUV0} y={barY} width={xVis0 - xUV0} height={barHeight} fill={`url(#${patId})`} />
          )}
          <rect x={xVis0} y={barY} width={xVis1 - xVis0} height={barHeight} fill={`url(#${gradId})`} />
          {showUVIR && xIR1 > xVis1 && (
            <rect x={xVis1} y={barY} width={xIR1 - xVis1} height={barHeight} fill={`url(#${patId})`} />
          )}
        </g>

        {/* inside labels for UV/IR (no numeric wavelengths there) */}
        {showUVIR && xVis0 > xUV0 && (
          <text
            x={(xUV0 + xVis0) / 2}
            y={barY + barHeight / 2 + 4}
            textAnchor="middle"
            fontFamily={fontFamily}
            fontSize={fontSize}
            fill="#374151"
            opacity={0.9}
          >
            {labelUV}
          </text>
        )}
        {showUVIR && xIR1 > xVis1 && (
          <text
            x={(xVis1 + xIR1) / 2}
            y={barY + barHeight / 2 + 4}
            textAnchor="middle"
            fontFamily={fontFamily}
            fontSize={fontSize}
            fill="#374151"
            opacity={0.9}
          >
            {labelIR}
          </text>
        )}

        {/* ticks & labels */}
        {tickVals.map((t) => {
          const left = tickScope === "full" ? fullTickLeft : visTickLeft;
          const right = tickScope === "full" ? fullTickRight : visTickRight;
          const min = tickScope === "full" ? nmMin : visMin;
          const max = tickScope === "full" ? nmMax : visMax;
          const x = left + ((t - min) / (max - min)) * (right - left);
          return (
            <g key={t}>
              <line x1={x} x2={x} y1={axisY} y2={axisY + 6} stroke="#111827" strokeWidth={1} />
              <text
                x={x}
                y={axisY + 18}
                fontFamily={fontFamily}
                fontSize={fontSize}
                textAnchor="middle"
                fill="#111827"
              >
                {t} nm
              </text>
            </g>
          );
        })}
      </svg>

      {/* HTML caption (supports ReactNode) */}
      {caption ? <figcaption className="mt-1">{caption}</figcaption> : null}
    </figure>
  );
}


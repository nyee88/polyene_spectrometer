import React from "react";

export type WavelengthColorProps = {
  /** Visible spectrum start, in nm */
  minNM?: number; // default 400
  /** Visible spectrum end, in nm */
  maxNM?: number; // default 700
  /** Distance between tick labels, in nm */
  tickStep?: number; // default 50
  /** Height of the color bar, in px */
  barHeight?: number; // default 36
  /** Overall width, in px */
  width?: number; // default 720
  /** Overall padding around the SVG content, in px */
  padding?: number; // default 16
  /** Optional title displayed above the bar */
  title?: string; // e.g., "Wavelength and perceived color (approximation)"
  /** Font family to use for labels */
  fontFamily?: string; // default UI sans stack
  /** Font size for labels (px) */
  fontSize?: number; // default 12
  /** Whether to render the continuous gradient bar */
  showGradient?: boolean; // default true
  /** Optional className for outer wrapper */
  className?: string;
  /** Corner radius of the bar (0 = square ends) */
  cornerRadius?: number; // default 6
};

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function ticks(minNM: number, maxNM: number, step: number): number[] {
  const start = Math.ceil(minNM / step) * step;
  const arr: number[] = [];
  for (let t = start; t <= maxNM; t += step) arr.push(t);
  if (arr[0] !== minNM) arr.unshift(minNM);
  if (arr[arr.length - 1] !== maxNM) arr.push(maxNM);
  return arr;
}

// Approximate nm → sRGB (Dan Bruton–style)
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
  const to255 = (c: number) => Math.round(255 * Math.pow(Math.max(0, c) * Math.max(0, factor), gamma));
  return { r: to255(r), g: to255(g), b: to255(b) };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, "0")).join("")}`;
}

function nmToColor(nm: number): string {
  const { r, g, b } = wavelengthToSRGB(nm);
  return rgbToHex(r, g, b);
}

export default function WavelengthColor({
  minNM = 400,
  maxNM = 700,
  tickStep = 50,
  barHeight = 36,
  width = 720,
  padding = 16,
  title = "Wavelength and perceived color (approximation)",
  fontFamily = "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
  fontSize = 12,
  showGradient = true,
  className,
  cornerRadius = 6,
}: WavelengthColorProps) {
  const pad = padding;
  const titleHeight = title ? 22 : 0;
  const innerWidth = width - pad * 2;
  const barY = pad + titleHeight;
  const axisY = barY + barHeight; // ticks flush with bar
  const axisGapBelow = 12; // room for numbers
  const totalHeight = pad + titleHeight + barHeight + axisGapBelow + pad;

  const nmMin = clamp(minNM, 380, 760);
  const nmMax = clamp(maxNM, 380, 760);
  const nmRange = nmMax - nmMin;

  const idBase = React.useId();
  const gradId = `${idBase}-spectralGrad`;

  const tickVals = ticks(nmMin, nmMax, tickStep);

  // Map ticks so edge ticks visually touch rounded bar ends
  const tickMapLeft  = pad + cornerRadius;
  const tickMapRight = pad + innerWidth - cornerRadius;
  const tickMapWidth = tickMapRight - tickMapLeft;

  // Build gradient stops every 5 nm
  const stops: { offset: number; color: string }[] = [];
  for (let nm = nmMin; nm <= nmMax; nm += 5) {
    stops.push({ offset: ((nm - nmMin) / nmRange) * 100, color: nmToColor(nm) });
  }

  return (
    <figure className={className} aria-label="Wavelength and perceived color diagram">
      <svg
        role="img"
        width={width}
        height={totalHeight}
        viewBox={`0 0 ${width} ${totalHeight}`}
        aria-labelledby={`${idBase}-title ${idBase}-desc`}
        className="select-none"
      >
        <title id={`${idBase}-title`}>{title}</title>
        <desc id={`${idBase}-desc`}>
          Gradient bar from {nmMin} to {nmMax} nm with tick marks every {tickStep} nm.
        </desc>

        {/* Spectral gradient bar */}
        {showGradient && (
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              {stops.map((s, i) => (
                <stop key={i} offset={`${s.offset}%`} stopColor={s.color} />
              ))}
            </linearGradient>
          </defs>
        )}
        <rect
          x={pad}
          y={barY}
          width={innerWidth}
          height={barHeight}
          fill={showGradient ? `url(#${gradId})` : "#ddd"}
          rx={cornerRadius}
        />

        {/* Axis ticks and labels (flush with bar) */}
        {tickVals.map((t) => {
          const x = tickMapLeft + ((t - nmMin) / nmRange) * tickMapWidth;
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
    </figure>
  );
}

// Optional named helpers if you want them elsewhere
export { nmToColor, wavelengthToSRGB };

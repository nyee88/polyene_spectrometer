// src/App.tsx
import BetaCaroteneConjugation from "./BetaCaroteneConjugation";
import WavelengthColor from "./components/WavelengthColor";

export default function App() {
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
          <p>
            What makes organic compounds like sugar and flour white,
            while pigments like chlorophyll and carotenoids create the rich greens
            of plants and the striking colors of autumn? And what does that have to do with building a solar cell?
          </p>
          <p>
            In this lesson, we'll explore how certain features in the structure of organic molecules can create vivid colors
            and allow them to carry electrical charge.
            <br />
            <br />
            <strong>But first — a quick refresher on how we perceive color:</strong>
          </p>

          {/* Wavelength diagram placed immediately after the sentence above */}
          <WavelengthColor minNM={400} maxNM={700} tickStep={50} width={720} />

          <p>
            Increasing the length of the conjugated π-system lowers the HOMO–LUMO gap,
            shifting λ<sub>max</sub> to longer wavelength (lower energy).
          </p>
        </section>

        {/* β-Carotene section (kept) */}
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
    </div>
  );
}

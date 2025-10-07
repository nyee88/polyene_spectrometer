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
        <section className="space-y-4 leading- text-justify hyphens-auto">
          <p>
            What makes some organic compounds like sugar and flour white,
            while chlorophyll and carotenoids create the rich greens of plants and the striking colors of autumn? And what does that have to do with building a solar cell?
            <br />
            <br />
            In this lesson, we'll explore how certain features of organic molecules can create vivid colors and allow them to carry electrical charge.
            <br />
            <br />
            But first – a quick refresher on what determines the colors we perceive in everyday objects:
            <br />
            <br />
            The color we perceive corresponds to the wavelength of light that reaches our eyes. Visible light spans wavelengths 
            from about 400 nm (violet) to 700 nm (red) while wavelengths outside this range (like ultraviolet and infrared rays 
            from the sun) are invisible to us. 
          </p>

          {/* Wavelength diagram placed immediately after the sentence above */}
          <WavelengthColor
            minNM={350}
            maxNM={750}
            visibleMin={400}
            visibleMax={700}
            tickStep={50}
            tickScope="visible"
            width={720}
          />
          <p className="text-xs text-slate-600 mt-1">
            <strong>Figure 1.</strong> The visible spectrum - perceived color vs. wavelength (approximate).
          </p>

          <p>
            Figure 1 shows the visible spectrum and the colors associated with each wavelength. 
            Things that emit light – think screens, lightbulbs, and fireflies – will appear the color associated with wavelengths they emit.
            So a pixel on an OLED TV that emits light at 450 nm will appear blue. If it emits at 650 nm it will appear red. 
            The wavelength of light emitted is what reaches our eyes – simple enough. 
            But what about objects that don't emit light, like a red apple or green leaf, or most everyday things we see?
            In such cases, it is still true that the color we perceive is determined by the wavelength of light that reaches our eyes.
            The difference is that the source of the light is external (like the sun or a light bulb). Objects absorb certain wavelengths 
            of light and reflect or transmit others. Objects that reflect all wavelengths appear white, 
            ones that absorb all wavelengths appear black, and ones that transmit all wavelengths of light (e.g. water) appear transparent.
            Colored objects absorb some wavelengths and reflect others. A red apple appears red because it absorbs most
            wavelengths of visible light <em>except</em> those corresponding to red (~650 nm), which is reflected and what reaches our eyes. 
            A green leaf appears green because it absorbs most wavelengths <em>except</em> those corresponding to green (~550 nm). Later we'll look 
            at how the structure of organic molecules determines which wavelengths get absorbed and which ones we see. 

            <br />
            <br />
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

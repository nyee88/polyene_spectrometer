import BetaCaroteneConjugation from "./BetaCaroteneConjugation";
import WavelengthColor from "./components/WavelengthColor";
import AbsorptionExplorer from "./components/AbsorptionExplorer";
import HomoLumoAbsorption from "./components/HomoLumoAbsorption";
// NEW:
import OrbitalSplitting from "./components/OrbitalSplitting";

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
        <section className="space-y-4 leading-relaxed text-justify hyphens-auto">
          <p>
            Why are some organic compounds like sugar and flour white,
            while others like chlorophyll and carotenoids create the rich greens of plants and the striking colors of autumn? And what does that have to do with building a solar cell?
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
            <strong>Figure 1.</strong> The visible spectrum – perceived color vs. wavelength (approximate).
          </p>

          <p>
            Figure 1 shows the visible spectrum and the colors associated with each wavelength.
            Things that emit light – think screens, lightbulbs, and fireflies – will appear the color associated with wavelengths they emit.
            So a pixel on an OLED TV that emits light at 450 nm will appear blue. If it emits at 650 nm it will appear red.
            <br />
            <br />
            The wavelength of light emitted is what reaches our eyes – simple enough.
            But what about most everyday objects that don't emit light, like a red apple or green leaf?
            <br />
            <br />
            In such cases, the color we perceive is still determined by the wavelength of light that reaches our eyes. It's just that its
            journey is different. The light first comes from an external source (like the sun or a light bulb)
            and then reflects back to your eyes. Only those wavelengths that are not absorbed or transmitted are reflected back to your eyes.
            <br />
            <br />
            Objects that reflect all wavelengths look white,
            ones that absorb all wavelengths look black, and ones that transmit all wavelengths of light (e.g. water) look transparent.
            <br />
            <br />
            Colored objects absorb some wavelengths and reflect others. A red apple appears red because it absorbs most
            wavelengths of visible light <em>except</em> those corresponding to red (in the ~650 nm region), which is reflected and what reaches our eyes.
            A green leaf appears green because it absorbs most wavelengths <em>except</em> those corresponding to green (in the ~550 nm region).
            <br />
            <br />
            Later we'll look at how the structure of organic molecules determines which wavelengths get absorbed and which ones we see.
            <br />
            <br />
            To get a better feel for this, the interactive tool below shows the visible spectrum again,
            with adjustable absorption bands so you can see how shifting them changes the color we perceive.
          </p>

          {/* Absorption Explorer goes here (must not be inside a <p>) */}
          <AbsorptionExplorer width={720} />

          <p>
            But what determines the position of the absorption bands? 
            <br />
            <br />
            It depends on which wavelengths of light are absorbed by the outermost electrons in a molecule. When a photon with just the right energy hits the molecule, 
            an electron can absorb it and jump to a higher level.  
            <br />
            <br />
            If the photon’s energy doesn’t match the gap, 
            it passes through or reflects off. This is why only certain wavelengths are absorbed. 
            <br />
            <br />
            You can think of it like resonance: a swing only builds momentum when pushed at the right rhythm.
            A tuning fork vibrates when it’s hit with sound at a very specific frequency
            Similarly, a molecule only absorbs light at the frequencies that match its energy gaps.
            <br />
            <br />
            In the demonstration below, you can drag the highest occupied molecular orbital (HOMO - this is where the most energetic electrons reside)
            and the lowest unoccupied molecular orbital (LUMO - this is where the electrons in the HOMO jump to once it absorbs photons with matching energy) 
            and see how the absorption spectrum changes.
          </p>

          {/* ← INSERTED: HOMO–LUMO + linked absorption */}
          <HomoLumoAbsorption width={720} />
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
  <p className="text-slate-800 font-medium">What did you notice?</p>
  <p className="mt-2 text-slate-700">
    As you narrowed the gap between the HOMO and LUMO on the slider, how did the
    absorption wavelength change?
  </p>

  {/* Reveal answer */}
  <details className="mt-3">
    <summary className="cursor-pointer text-slate-700 font-medium">
      Show the pattern I should see
    </summary>
    <div className="mt-2 space-y-2 text-slate-700">
      <p>
        The absorption wavelength gets <em>longer</em> when the energy gap gets
        <em> smaller</em>. That’s because photon energy and wavelength are inversely related:
        <span className="whitespace-nowrap"> E = hν = hc/λ, </span>
        so <span className="whitespace-nowrap">λ ∝ 1/E</span>. 
        (Quick check: <span className="whitespace-nowrap">λ(nm) ≈ 1240 / E(eV)</span>.)
      </p>
      <ul className="list-disc pl-6 text-slate-700 text-sm">
        <li>Big gap → high-energy photons → shorter λ (violet/UV).</li>
        <li>Small gap → lower-energy photons → longer λ (red/NIR).</li>
      </ul>
      <p className="text-slate-700">
        Next question: <strong>what molecular features shrink that gap?</strong>
        Let’s start with a single double bond.
      </p>
    </div>
  </details>
</section>


        {/* NEW: Orbital splitting game (between HomoLumoAbsorption and β-carotene) */}
        <section className="rounded-2xl bg-white shadow p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">π/π* Phase Match</h2>
            <span className="text-xs text-slate-500">Click to set phase; unlock the ladder</span>
          </div>
          <OrbitalSplitting width={720} height={320} />
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

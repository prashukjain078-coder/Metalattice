import { useEffect, useRef } from "react"
import Lenis from "lenis"
import MetalFrameCross from "./components/originkit/MetalFrameCross"
import WobblingLatticeSphere from "./components/originkit/WobblingLatticeSphere"
import { GlowButton } from './components/ui/GlowButton'

const features = [
  { t: "Rigid by design", d: "Every part is a hard-edged, chamfered frame that catches light like real metal." },
  { t: "Assembled in motion", d: "Arms extend, hold and retract on a loop. Nothing is a static image." },
  { t: "One continuous lattice", d: "The sphere under the page runs across both sections without a seam." },
]

export default function App() {
  const crossRef = useRef<HTMLDivElement>(null)
  const sphereRef = useRef<HTMLDivElement>(null)

  // Lenis smooth scroll + 60fps Cursor Reactivity for both OriginKit elements
  useEffect(() => {
    const lenis = new Lenis({ anchors: true })

    // Normalized mouse coordinates (-1 to 1) with smooth lerp damping
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    let id = requestAnimationFrame(function raf(t) {
      lenis.raf(t)

      // Smooth interpolation (damping factor 0.06 for heavy metallic feel)
      mouse.x += (mouse.targetX - mouse.x) * 0.06
      mouse.y += (mouse.targetY - mouse.y) * 0.06

      // Cursor reactivity for MetalFrameCross (magnetic shift + 3D perspective tilt)
      if (crossRef.current) {
        const moveX = mouse.x * 28
        const moveY = mouse.y * 28
        const rotX = -mouse.y * 14
        const rotY = mouse.x * 14
        crossRef.current.style.transform = `perspective(1000px) translate3d(${moveX}px, ${moveY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg)`
      }

      // Cursor reactivity for WobblingLatticeSphere (deep counter-parallax + subtle rotation)
      if (sphereRef.current) {
        const moveX = -mouse.x * 36
        const moveY = -mouse.y * 24
        const rotX = mouse.y * 8
        const rotY = -mouse.x * 8
        sphereRef.current.style.transform = `perspective(1200px) translate3d(${moveX}px, ${moveY}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg)`
      }

      id = requestAnimationFrame(raf)
    })

    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener("mousemove", handleMouseMove)
      lenis.destroy()
    }
  }, [])

  return (
    <div className="relative overflow-x-hidden bg-white text-black antialiased selection:bg-black selection:text-white">
      {/* Subtle architectural vertical guide lines in background */}
      <div className="pointer-events-none fixed inset-0 z-0 mx-auto flex max-w-[88vw] justify-between border-x border-black/[0.04]">
        <div className="h-full w-px bg-black/[0.03]" />
        <div className="h-full w-px bg-black/[0.03]" />
      </div>

      {/* One sphere centred on the seam: top half shows in section 1, bottom half in section 2. */}
      <div className="pointer-events-auto absolute inset-x-0 top-[100vh] z-0 h-[140vh] -translate-y-1/2">
        <div ref={sphereRef} className="h-full w-full will-change-transform">
          <WobblingLatticeSphere
            background="transparent"
            baseColor="#222222"
            size={170}
            advanced={{
              nodeColor: "#111111",
              haloColor: "#999999",
              gridColor: "#999999",
              bandOpacity: 0,
              coreGlow: 8,
            }}
            style={{ minWidth: 0, minHeight: 0 }}
          />
        </div>
      </div>

      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between border-b border-black/[0.06] bg-white/60 px-[6vw] py-5 backdrop-blur-md">
        <a href="#top" className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.14em]">
          <span className="inline-block h-2 w-2 bg-black" />
          Metalattice
        </a>
        <nav className="ml-auto mr-8 hidden gap-8 text-sm font-medium text-black/60 md:flex">
          <a href="#features" className="transition-colors hover:text-black">Features</a>
          <a href="#about" className="transition-colors hover:text-black">About</a>
        </nav>
        <a
          href="#features"
          className="rounded-full border border-black px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] transition-all duration-300 hover:bg-black hover:text-white hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
        >
          Get started
        </a>
      </header>

      {/* Hero Section */}
      <section id="top" className="pointer-events-none relative z-10 min-h-screen">
        <div className="pointer-events-auto absolute right-[8vw] top-[34%] aspect-square w-[84vw] -translate-y-1/2 md:right-[5vw] md:top-[54%] md:w-[min(30vw,460px)]">
          <div ref={crossRef} className="h-full w-full will-change-transform">
            <MetalFrameCross background="transparent" distance={9} style={{ minWidth: 0, minHeight: 0 }} />
          </div>
        </div>

        <div className="pointer-events-auto absolute bottom-[8vh] left-[6vw] z-20 max-w-[580px] md:bottom-[12vh]">
          <h1 className="mb-5 text-[clamp(42px,6.2vw,88px)] font-bold leading-[0.98] tracking-[-0.03em]">
            Structure,<br />forged in light.
          </h1>
          <p className="mb-8 max-w-[420px] text-base leading-relaxed text-black/65">
            Metalattice is a framework of chrome and geometry. Built to be looked at.
          </p>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
          >
            Explore the lattice
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="pointer-events-none relative z-10 flex min-h-screen flex-col px-[6vw] pb-12 pt-[18vh]">
        <h2 className="pointer-events-auto text-center text-[clamp(32px,4vw,56px)] font-bold tracking-[-0.02em]">
          Built on a lattice
        </h2>

        <div className="pointer-events-none flex flex-1 items-center justify-center pt-[18vh]">
          <div className="pointer-events-auto">
            <GlowButton href="#about" className="mlb-lg">
              MATERIALIZE
            </GlowButton>
          </div>
        </div>

        <div className="pointer-events-auto mt-auto grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, index) => (
            <article
              key={f.t}
              className="group relative rounded-2xl border border-black/10 bg-white/70 p-7 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-black/25 hover:bg-white/90 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]"
            >
              <div className="mb-4 flex items-center justify-between text-xs font-mono text-black/35">
                <span>0{index + 1}</span>
                <span className="transition-transform duration-300 group-hover:rotate-90">+</span>
              </div>
              <h3 className="mb-2 text-lg font-semibold tracking-[-0.01em]">{f.t}</h3>
              <p className="text-sm leading-relaxed text-black/60">{f.d}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Full-Bleed Architectural Footer Wordmark (Tuned for White Theme) */}
      <footer id="about" className="group relative z-10 flex w-full select-none flex-col items-center justify-end overflow-hidden pt-6 pb-0">
        {/* Subtle top hairline divider */}
        <div className="mb-3 h-[1px] w-full max-w-[88vw] bg-gradient-to-r from-transparent via-black/15 to-transparent transition-all duration-700 group-hover:via-black/40" />

        {/* Giant Viewport-Width Wordmark */}
        <h1
          className="w-full translate-y-[10%] bg-gradient-to-b from-black/25 via-black/10 to-transparent bg-clip-text text-center text-[13.2vw] font-black uppercase leading-[0.76] tracking-[-0.06em] text-transparent transition-all duration-700 ease-out group-hover:from-black/55 group-hover:via-black/20 group-hover:to-transparent"
        >
          METALATTICE
        </h1>
      </footer>
    </div>
  )
}

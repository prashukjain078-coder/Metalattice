import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Float } from '@react-three/drei'
import * as THREE from 'three'
import { buildBCC } from '../components/lattice/LatticeGeometryEngine'
import { Zap, Cpu, GitBranch, BarChart3, ArrowRight, Menu, X, ChevronRight } from 'lucide-react'

// Hero 3D lattice
function HeroLattice() {
  const geo = useMemo(() => {
    try {
      return buildBCC({
        family: 'bcc',
        cellSize: 4,
        strutThickness: 0.35,
        relativeDensity: 0.15,
        cellsX: 5,
        cellsY: 5,
        cellsZ: 5,
        surfaceThickness: 0.4,
        resolution: 'balanced',
        isoLevel: 0,
      })
    } catch {
      return new THREE.BoxGeometry(2, 2, 2)
    }
  }, [])

  useEffect(() => {
    return () => {
      geo.dispose()
    }
  }, [geo])

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.4}>
      <group rotation={[0.2, 0.5, 0.1]}>
        <mesh geometry={geo}>
          <meshStandardMaterial
            color="#2a6080"
            metalness={0.85}
            roughness={0.15}
            emissive="#00E5FF"
            emissiveIntensity={0.08}
          />
        </mesh>
      </group>
    </Float>
  )
}

function HeroCanvas() {
  return (
    <Canvas camera={{ position: [18, 14, 24], fov: 40 }} gl={{ antialias: true }} style={{ background: 'transparent' }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[20, 30, 20]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-10, 5, 10]} intensity={1} color="#00E5FF" />
      <pointLight position={[10, -5, -10]} intensity={0.8} color="#8B5CF6" />
      <HeroLattice />
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.6} enablePan={false} />
    </Canvas>
  )
}

// Annotation bubble
function Annotation({ x, y, label, value, delay = 0 }: { x: string; y: string; label: string; value: string; delay?: number }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), delay) }, [delay])
  return (
    <div className={`absolute transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      style={{ left: x, top: y }}>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_6px_#00E5FF]" />
        <div className="bg-[#111823]/90 border border-[#263342] rounded px-2.5 py-1.5 backdrop-blur-sm">
          <p className="text-[9px] text-[#98A6B8] uppercase tracking-widest font-semibold">{label}</p>
          <p className="text-[11px] text-[#00E5FF] font-mono font-medium">{value}</p>
        </div>
      </div>
    </div>
  )
}

const CAPABILITIES = [
  { icon: <GitBranch size={18} />, title: 'Generative Lattice Design', desc: 'Parametric geometry for BCC, FCC, Octet, Gyroid, TPMS and more. Driven by engineering requirements.' },
  { icon: <Cpu size={18} />, title: 'AI Property Prediction', desc: 'Analytical and surrogate-model based stiffness, strength and mass prediction with clear uncertainty labeling.' },
  { icon: <Zap size={18} />, title: 'Multi-Objective Optimization', desc: 'Design-space exploration across mass, stiffness, strength and manufacturability. Pareto-front visualization.' },
  { icon: <BarChart3 size={18} />, title: 'Engineering Design Exploration', desc: 'Compare candidate architectures, inspect trade-offs, and export validated design reports.' },
]

const STATS = [
  { value: '10+', label: 'Lattice Families' },
  { value: '5', label: 'Material Presets' },
  { value: '8', label: 'Objectives Supported' },
  { value: 'STL/OBJ', label: 'Export Formats' },
]

const NAV_LINKS = ['Product', 'Capabilities', 'Applications', 'Documentation']

export default function LandingPage() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="min-h-screen bg-[#080B10] text-[#F4F7FB] overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#080B10]/95 border-b border-[#263342] backdrop-blur-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="2" fill="#00E5FF"/>
              <circle cx="4" cy="4" r="1.5" fill="#8B5CF6"/>
              <circle cx="24" cy="4" r="1.5" fill="#8B5CF6"/>
              <circle cx="4" cy="24" r="1.5" fill="#8B5CF6"/>
              <circle cx="24" cy="24" r="1.5" fill="#8B5CF6"/>
              <circle cx="14" cy="2" r="1.5" fill="#00E5FF" opacity="0.6"/>
              <circle cx="14" cy="26" r="1.5" fill="#00E5FF" opacity="0.6"/>
              <circle cx="2" cy="14" r="1.5" fill="#00E5FF" opacity="0.6"/>
              <circle cx="26" cy="14" r="1.5" fill="#00E5FF" opacity="0.6"/>
              <line x1="14" y1="14" x2="4" y2="4" stroke="#00E5FF" strokeWidth="0.8" opacity="0.5"/>
              <line x1="14" y1="14" x2="24" y2="4" stroke="#00E5FF" strokeWidth="0.8" opacity="0.5"/>
              <line x1="14" y1="14" x2="4" y2="24" stroke="#00E5FF" strokeWidth="0.8" opacity="0.5"/>
              <line x1="14" y1="14" x2="24" y2="24" stroke="#00E5FF" strokeWidth="0.8" opacity="0.5"/>
              <line x1="14" y1="14" x2="14" y2="2" stroke="#8B5CF6" strokeWidth="0.8" opacity="0.4"/>
              <line x1="14" y1="14" x2="14" y2="26" stroke="#8B5CF6" strokeWidth="0.8" opacity="0.4"/>
              <line x1="14" y1="14" x2="2" y2="14" stroke="#8B5CF6" strokeWidth="0.8" opacity="0.4"/>
              <line x1="14" y1="14" x2="26" y2="14" stroke="#8B5CF6" strokeWidth="0.8" opacity="0.4"/>
            </svg>
            <span className="text-[#F4F7FB] font-bold text-lg tracking-tight">MetaLattice</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l} href="#" className="text-sm text-[#98A6B8] hover:text-[#F4F7FB] transition-colors">{l}</a>
            ))}
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button className="text-sm text-[#98A6B8] hover:text-[#F4F7FB] transition-colors px-3 py-1.5">Sign In</button>
            <button
              onClick={() => navigate('/workspace')}
              className="btn-primary text-sm px-4 py-2 rounded-lg"
            >
              Launch Workspace
            </button>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-[#98A6B8]" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#0D121A] border-t border-[#263342] px-6 py-4 flex flex-col gap-4">
            {NAV_LINKS.map(l => <a key={l} href="#" className="text-sm text-[#98A6B8]">{l}</a>)}
            <button onClick={() => navigate('/workspace')} className="btn-primary self-start">Launch Workspace</button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-14 overflow-hidden">
        {/* Background radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#00E5FF] opacity-[0.04] blur-[120px]" />
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-[#8B5CF6] opacity-[0.05] blur-[80px]" />
        </div>
        {/* Grid overlay */}
        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center py-20">
          {/* Text content */}
          <div className="flex flex-col gap-6 z-10">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#37D67A] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#37D67A] tracking-widest uppercase">AI-Powered Lattice Engineering</span>
            </div>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
              Engineer Materials<br />
              <span className="gradient-text">That Don't Exist Yet.</span>
            </h1>

            <p className="text-[#98A6B8] text-lg leading-relaxed max-w-lg">
              Generate intelligent lattice architectures, predict mechanical performance,
              and discover lightweight designs through AI-powered computational engineering.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => navigate('/workspace')}
                className="btn-primary px-6 py-3 text-sm rounded-lg font-semibold"
              >
                Launch Design Studio <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/generator')}
                className="btn-secondary px-6 py-3 text-sm rounded-lg"
              >
                Explore the Technology
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 pt-4 border-t border-[#263342]">
              {STATS.map(s => (
                <div key={s.label}>
                  <p className="text-xl font-bold text-[#00E5FF] font-mono">{s.value}</p>
                  <p className="text-[11px] text-[#98A6B8] uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3D Hero */}
          <div className="relative h-[480px] lg:h-[600px] z-10">
            <HeroCanvas />
            {/* Annotations */}
            <Annotation x="5%" y="15%" label="Cell Geometry" value="BCC — 5×5×5" delay={800} />
            <Annotation x="60%" y="8%" label="Relative Density" value="ρ* = 15%" delay={1200} />
            <Annotation x="2%" y="75%" label="Structural Performance" value="E* = 1.7 GPa" delay={1600} />
            <Annotation x="55%" y="82%" label="Optimization Status" value="Pareto-Optimal" delay={2000} />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-8 bg-gradient-to-b from-[#00E5FF] to-transparent" />
        </div>
      </section>

      {/* ── CAPABILITIES ── */}
      <section className="py-24 border-t border-[#263342]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[11px] font-semibold text-[#00E5FF] tracking-widest uppercase mb-3">Platform Capabilities</p>
            <h2 className="text-4xl font-bold">A Complete Engineering Workflow</h2>
            <p className="text-[#98A6B8] mt-4 max-w-2xl mx-auto">
              From requirement definition to geometry export — MetaLattice covers every stage
              of computational lattice design in a single, cohesive environment.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CAPABILITIES.map((cap, i) => (
              <div key={i} className="panel rounded-xl p-6 hover:border-[#00E5FF30] hover:-translate-y-1 transition-all duration-200 group">
                <div className="w-9 h-9 rounded-lg bg-[#00E5FF15] flex items-center justify-center text-[#00E5FF] mb-4 group-hover:bg-[#00E5FF25] transition-colors">
                  {cap.icon}
                </div>
                <h3 className="font-semibold text-[#F4F7FB] text-sm mb-2">{cap.title}</h3>
                <p className="text-[#98A6B8] text-xs leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW CTA ── */}
      <section className="py-24 border-t border-[#263342]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-2xl overflow-hidden p-12 text-center"
            style={{ background: 'linear-gradient(135deg, #0D121A 0%, #111823 50%, #0D121A 100%)', border: '1px solid #263342' }}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#00E5FF] opacity-[0.06] blur-[60px] rounded-full" />
            </div>
            <p className="text-[11px] font-semibold text-[#00E5FF] tracking-widest uppercase mb-4">Demo Project Ready</p>
            <h2 className="text-4xl font-bold mb-4">Ready to Design?</h2>
            <p className="text-[#98A6B8] max-w-lg mx-auto mb-8">
              Open the <strong className="text-[#F4F7FB]">AERO-CORE Aerospace Bracket</strong> demo project and walk through a
              complete lattice design workflow — from geometry generation to engineering report export.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate('/workspace')}
                className="btn-primary px-8 py-3 text-sm rounded-lg font-semibold">
                Open Design Studio <ChevronRight size={16} />
              </button>
              <button onClick={() => navigate('/library')}
                className="btn-secondary px-8 py-3 text-sm rounded-lg">
                Browse Project Library
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#263342] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#F4F7FB]">MetaLattice</span>
            <span className="text-[#98A6B8] text-sm">— AI-Powered Lattice Design Platform</span>
          </div>
          <div className="flex items-center gap-6">
            {['Workspace', 'Generator', 'Library', 'Settings'].map(p => (
              <button key={p} onClick={() => navigate('/' + p.toLowerCase())}
                className="text-xs text-[#98A6B8] hover:text-[#F4F7FB] transition-colors">{p}</button>
            ))}
          </div>
          <p className="text-xs text-[#98A6B8]">© 2026 MetaLattice. Hackathon Demo Build.</p>
        </div>
      </footer>
    </div>
  )
}


import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { useAppStore } from '../store'
import {
  Sparkles,
  Wand2,
  Sliders,
  Send,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Layers,
  Cpu,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { formatMass, formatStiffness, formatStrength, formatDensity } from '../utils/format'
import type { LatticeFamily, MaterialPreset, ManufacturingProcess } from '../types'
import LatticeViewer from '../components/viewport/LatticeViewer'

interface ParsedRequirements {
  family: LatticeFamily
  targetDensity: number
  material: MaterialPreset
  process: ManufacturingProcess
  minFeatureSize: number
  primaryObjective: string
  suggestedCellSize: number
}

const DEFAULT_PROMPT =
  'Generate a lightweight aerospace bracket support structure with a target relative density of 20%, high stiffness, minimum mass, and a minimum feature size suitable for titanium metal additive manufacturing.'

export default function GeneratorPage() {
  const navigate = useNavigate()
  const {
    candidates,
    generateCandidates,
    isGenerating,
    selectCandidate,
    updateGeometry,
    updateMaterial,
    addToast,
  } = useAppStore()

  const [prompt, setPrompt] = useState(DEFAULT_PROMPT)
  const [candidateCount, setCandidateCount] = useState<number>(8)

  // Natural Language Parsed parameters
  const [parsed, setParsed] = useState<ParsedRequirements>({
    family: 'gyroid',
    targetDensity: 0.20,
    material: 'titanium_ti64',
    process: 'slm',
    minFeatureSize: 0.4,
    primaryObjective: 'Minimize Mass & Maximize Specific Stiffness',
    suggestedCellSize: 5.0,
  })

  // Rule-based deterministic NLP Requirement Parser
  const parseNaturalLanguage = () => {
    const text = prompt.toLowerCase()

    let family: LatticeFamily = 'gyroid'
    if (text.includes('bcc') || text.includes('body-centered')) family = 'bcc'
    else if (text.includes('fcc') || text.includes('face-centered')) family = 'fcc'
    else if (text.includes('octet')) family = 'octet'
    else if (text.includes('schwarz') || text.includes('tpms')) family = 'schwarz_p'
    else if (text.includes('diamond')) family = 'diamond'
    else if (text.includes('voronoi')) family = 'voronoi'

    let material: MaterialPreset = 'titanium_ti64'
    if (text.includes('aluminum') || text.includes('6061')) material = 'aluminum_6061'
    else if (text.includes('steel') || text.includes('316l')) material = 'stainless_316l'
    else if (text.includes('polymer') || text.includes('abs') || text.includes('plastic')) material = 'polymer_abs'
    else if (text.includes('carbon') || text.includes('cfrp')) material = 'cfrp'

    let targetDensity = 0.20
    const densityMatch = text.match(/(\d+(?:\.\d+)?)\s*%/ )
    if (densityMatch) {
      targetDensity = Math.max(0.05, Math.min(0.6, parseFloat(densityMatch[1]) / 100))
    }

    let minFeatureSize = 0.4
    if (text.includes('additive') || text.includes('slm') || text.includes('lpbf')) minFeatureSize = 0.3
    if (text.includes('fdm')) minFeatureSize = 0.6

    setParsed({
      family,
      targetDensity,
      material,
      process: text.includes('fdm') ? 'fdm' : 'slm',
      minFeatureSize,
      primaryObjective: text.includes('energy') ? 'Energy Absorption' : 'Minimize Mass & Maximize Stiffness',
      suggestedCellSize: 5.0,
    })

    addToast({
      type: 'info',
      title: 'Prompt Parsed',
      message: `Extracted: ${family.toUpperCase()} | ${material} | ${(targetDensity * 100).toFixed(0)}% relative density`,
    })
  }

  const handleSynthesize = async () => {
    await generateCandidates(candidateCount)
  }

  const handleApplyToWorkspace = (candidateId: string) => {
    const cand = candidates.find((c) => c.id === candidateId)
    if (!cand) return
    selectCandidate(candidateId)
    updateGeometry(cand.geometry)
    updateMaterial(cand.material)
    addToast({
      type: 'success',
      title: 'Applied to Workspace',
      message: `${cand.name} loaded into 3D design studio`,
    })
    navigate('/workspace')
  }

  return (
    <AppShell>
      <div className="h-full flex flex-col bg-[#080B10] text-[#F4F7FB] overflow-y-auto">
        {/* Page Header */}
        <div className="p-6 border-b border-[#263342] bg-[#0D121A]">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#00E5FF] uppercase tracking-wider font-semibold">
                    Generative Engineering
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#8B5CF620] text-[#8B5CF6] border border-[#8B5CF640]">
                    AI Intent Parser v2.4
                  </span>
                </div>
                <h1 className="text-2xl font-bold mt-1 text-[#F4F7FB]">AI Lattice Architecture Generator</h1>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#98A6B8]">Candidates to synthesize:</span>
                <select
                  value={candidateCount}
                  onChange={(e) => setCandidateCount(parseInt(e.target.value))}
                  className="bg-[#111823] border border-[#263342] text-xs font-mono rounded px-2.5 py-1 text-[#F4F7FB]"
                >
                  <option value={6}>6 Candidates</option>
                  <option value={8}>8 Candidates</option>
                  <option value={12}>12 Candidates</option>
                </select>
              </div>
            </div>

            {/* Prompt Input Box */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder="State your engineering requirements in natural language..."
                className="w-full bg-[#111823] border border-[#263342] focus:border-[#00E5FF] rounded-lg p-3 text-sm font-sans text-[#F4F7FB] placeholder-[#4a5568] focus:outline-none focus:ring-1 focus:ring-[#00E5FF40] resize-none"
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  onClick={parseNaturalLanguage}
                  className="btn-secondary text-xs py-1 px-2.5 rounded flex items-center gap-1.5"
                >
                  <Wand2 size={13} />
                  <span>Parse Intent</span>
                </button>
              </div>
            </div>

            {/* Extracted Structured Specification Panel */}
            <div className="p-3.5 rounded-lg bg-[#111823] border border-[#263342] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div>
                <span className="label text-[10px]">Topology Seed</span>
                <p className="font-mono text-xs text-[#00E5FF] mt-0.5 uppercase">{parsed.family}</p>
              </div>
              <div>
                <span className="label text-[10px]">Target Relative Density</span>
                <p className="font-mono text-xs text-[#F4F7FB] mt-0.5">{(parsed.targetDensity * 100).toFixed(0)}%</p>
              </div>
              <div>
                <span className="label text-[10px]">Material Assumption</span>
                <p className="font-mono text-xs text-[#F4F7FB] mt-0.5">{parsed.material.toUpperCase()}</p>
              </div>
              <div>
                <span className="label text-[10px]">Fabrication Method</span>
                <p className="font-mono text-xs text-[#F4F7FB] mt-0.5">{parsed.process.toUpperCase()}</p>
              </div>
              <div>
                <span className="label text-[10px]">Min Feature Constraint</span>
                <p className="font-mono text-xs text-[#F4F7FB] mt-0.5">&gt; {parsed.minFeatureSize} mm</p>
              </div>
              <div className="flex items-center justify-end">
                <button
                  onClick={handleSynthesize}
                  disabled={isGenerating}
                  className="btn-primary text-xs py-2 px-3.5 rounded-lg w-full flex items-center justify-center gap-1.5 font-semibold"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#080B10] border-t-transparent rounded-full animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Generate Candidates</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Cards Grid */}
        <div className="p-6 max-w-6xl mx-auto w-full flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#98A6B8]">
              Candidate Architectures ({candidates.length} Available)
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#98A6B8]">
              <span className="w-2 h-2 rounded-full bg-[#37D67A]" />
              <span>Ranked by Multi-Objective Fitness</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {candidates.map((cand, idx) => (
              <div
                key={cand.id}
                className={`flex flex-col rounded-xl border bg-[#111823] overflow-hidden transition-all duration-200 hover:-translate-y-1 ${
                  cand.isSelected
                    ? 'border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.2)]'
                    : 'border-[#263342] hover:border-[#00E5FF40]'
                }`}
              >
                {/* 3D Model Mini Viewport */}
                <div className="h-44 w-full relative bg-[#080B10] border-b border-[#263342]">
                  <LatticeViewer params={cand.geometry} compact showGrid={false} showAxes={false} />
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#17212D]/90 border border-[#263342] text-[#F4F7FB]">
                      #{cand.rank}
                    </span>
                    {cand.isParetoOptimal && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#00E5FF20] text-[#00E5FF] border border-[#00E5FF40] font-semibold">
                        PARETO
                      </span>
                    )}
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#8B5CF620] text-[#8B5CF6] border border-[#8B5CF640]">
                      {cand.geometry.family.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Candidate Information Body */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm text-[#F4F7FB]">{cand.name}</h3>
                    <p className="text-[10px] text-[#98A6B8] mt-0.5">
                      Cell: {cand.geometry.cellSize.toFixed(1)}mm | Strut: {cand.geometry.strutThickness.toFixed(2)}mm
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#1a2535]">
                    <div>
                      <span className="label text-[9px]">Stiffness</span>
                      <p className="font-mono text-[#00E5FF] font-semibold">
                        {formatStiffness(cand.predictions.effectiveStiffnessGpa)}
                      </p>
                    </div>
                    <div>
                      <span className="label text-[9px]">Strength</span>
                      <p className="font-mono text-[#F4F7FB]">
                        {formatStrength(cand.predictions.compressiveStrengthMpa)}
                      </p>
                    </div>
                    <div>
                      <span className="label text-[9px]">Mass</span>
                      <p className="font-mono text-[#F4F7FB]">{formatMass(cand.predictions.massg)}</p>
                    </div>
                    <div>
                      <span className="label text-[9px]">Fitness Score</span>
                      <p className="font-mono text-[#37D67A] font-semibold">
                        {cand.optimizationScore.toFixed(1)} pts
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2">
                    <button
                      onClick={() => handleApplyToWorkspace(cand.id)}
                      className="btn-primary text-xs py-1.5 px-3 rounded flex-1 flex items-center justify-center gap-1.5"
                    >
                      <Check size={13} />
                      <span>Load into Workspace</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}


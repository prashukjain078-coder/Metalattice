import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { useAppStore } from '../store'
import {
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  Sliders,
  TrendingUp,
  Cpu,
  Sparkles,
  Layers,
  Check,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { formatMass, formatStiffness, formatStrength } from '../utils/format'
import type { DesignObjective } from '../types'

export default function OptimizationPage() {
  const navigate = useNavigate()
  const {
    candidates,
    runOptimization,
    isOptimizing,
    selectCandidate,
    updateGeometry,
    updateMaterial,
    addToast,
  } = useAppStore()

  const [method, setMethod] = useState<'genetic' | 'grid' | 'random'>('genetic')
  const [populationSize, setPopulationSize] = useState<number>(32)
  const [generations, setGenerations] = useState<number>(20)
  const [progress, setProgress] = useState<number>(100)
  const [isSearching, setIsSearching] = useState<boolean>(false)

  // Optimization Convergence history data
  const [convergenceData, setConvergenceData] = useState([
    { gen: 1, bestFitness: 42.1, avgFitness: 28.4, hypervolume: 0.65 },
    { gen: 5, bestFitness: 61.8, avgFitness: 44.2, hypervolume: 0.76 },
    { gen: 10, bestFitness: 78.4, avgFitness: 62.1, hypervolume: 0.85 },
    { gen: 15, bestFitness: 89.2, avgFitness: 73.5, hypervolume: 0.92 },
    { gen: 20, bestFitness: 94.6, avgFitness: 81.0, hypervolume: 0.96 },
  ])

  const handleStartSearch = async () => {
    setIsSearching(true)
    setProgress(0)

    for (let p = 10; p <= 100; p += 15) {
      await new Promise((r) => setTimeout(r, 200))
      setProgress(p)
    }

    await runOptimization()
    setIsSearching(false)
    setProgress(100)
  }

  const paretoCandidates = candidates.filter((c) => c.isParetoOptimal)

  return (
    <AppShell>
      <div className="h-full flex flex-col bg-[#080B10] text-[#F4F7FB] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#263342] bg-[#0D121A]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#00E5FF] uppercase tracking-wider font-semibold">
                  Evolutionary Solvers
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#00E5FF20] text-[#00E5FF] border border-[#00E5FF40]">
                  NSGA-II Multi-Objective
                </span>
              </div>
              <h1 className="text-2xl font-bold mt-1 text-[#F4F7FB]">Optimization Studio</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStartSearch}
                disabled={isSearching || isOptimizing}
                className="btn-primary text-xs py-2 px-4 rounded-lg flex items-center gap-2 font-semibold"
              >
                {isSearching ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#080B10] border-t-transparent rounded-full animate-spin" />
                    <span>Evolving Populations...</span>
                  </>
                ) : (
                  <>
                    <Play size={13} fill="currentColor" />
                    <span>Run Multi-Objective Optimization</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
          {/* Progress bar if running */}
          {isSearching && (
            <div className="p-4 rounded-xl bg-[#111823] border border-[#00E5FF40] space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#00E5FF]">Searching Parameter Space (NSGA-II)...</span>
                <span className="text-[#F4F7FB]">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#17212D] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00E5FF] to-[#8B5CF6] transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column: Algorithm Configuration */}
            <div className="p-5 rounded-xl bg-[#111823] border border-[#263342] space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#98A6B8] flex items-center gap-1.5">
                <Sliders size={14} className="text-[#00E5FF]" />
                <span>Algorithm Parameters</span>
              </h3>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#98A6B8] uppercase">Search Algorithm</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full bg-[#17212D] border border-[#263342] text-xs font-mono rounded p-2 text-[#F4F7FB] focus:outline-none focus:border-[#00E5FF]"
                >
                  <option value="genetic">NSGA-II Genetic Algorithm</option>
                  <option value="grid">Structured Grid Sweep</option>
                  <option value="random">Latin Hypercube Sampling</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#98A6B8] uppercase text-[10px] font-semibold">Population Size</span>
                  <span className="font-mono text-[#F4F7FB]">{populationSize}</span>
                </div>
                <input
                  type="range"
                  min={16}
                  max={64}
                  step={8}
                  value={populationSize}
                  onChange={(e) => setPopulationSize(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#263342] rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#98A6B8] uppercase text-[10px] font-semibold">Generations</span>
                  <span className="font-mono text-[#F4F7FB]">{generations}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={generations}
                  onChange={(e) => setGenerations(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#263342] rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
                />
              </div>

              <div className="p-3 rounded bg-[#17212D] border border-[#263342] space-y-1 text-xs">
                <span className="label text-[9px]">Fitness Formulation</span>
                <p className="font-mono text-[11px] text-[#00E5FF]">
                  Maximize (E* / Mass) × (1 - ConstraintViolations)
                </p>
                <p className="text-[10px] text-[#98A6B8] leading-relaxed mt-1">
                  Bi-objective trade-off balancing structural compliance against mass budget.
                </p>
              </div>
            </div>

            {/* Right 2 Columns: Convergence Chart & Discovered Pareto Set */}
            <div className="lg:col-span-2 space-y-6">
              {/* Convergence Metric Chart */}
              <div className="p-4 rounded-xl bg-[#111823] border border-[#263342] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F7FB]">
                      Evolutionary Convergence History
                    </h3>
                    <p className="text-[11px] text-[#98A6B8]">
                      Generational fitness improvement across candidate generations.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#37D67A20] text-[#37D67A] border border-[#37D67A40]">
                    Converged (Δ &lt; 0.01)
                  </span>
                </div>

                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={convergenceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#263342" />
                      <XAxis
                        dataKey="gen"
                        stroke="#263342"
                        tick={{ fill: '#98A6B8', fontSize: 10 }}
                        label={{ value: 'Generation Number →', position: 'bottom', fill: '#98A6B8', fontSize: 11 }}
                      />
                      <YAxis
                        stroke="#263342"
                        tick={{ fill: '#98A6B8', fontSize: 10 }}
                        label={{ value: '↑ Normalized Fitness', angle: -90, position: 'left', fill: '#98A6B8', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#17212D',
                          borderColor: '#263342',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#F4F7FB',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bestFitness"
                        name="Best Candidate"
                        stroke="#00E5FF"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgFitness"
                        name="Population Mean"
                        stroke="#8B5CF6"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Discovered Pareto Candidates */}
              <div className="p-4 rounded-xl bg-[#111823] border border-[#263342] space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#98A6B8]">
                  Identified Non-Dominated Pareto Candidates
                </h3>

                <div className="grid md:grid-cols-3 gap-3">
                  {paretoCandidates.map((cand) => (
                    <div
                      key={cand.id}
                      className="p-3.5 rounded-lg bg-[#17212D] border border-[#00E5FF40] flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#F4F7FB]">{cand.name}</span>
                          <span className="text-[10px] font-mono text-[#00E5FF] uppercase font-semibold">
                            {cand.geometry.family}
                          </span>
                        </div>
                        <div className="space-y-1 text-xs mt-2">
                          <div className="flex justify-between text-[#98A6B8]">
                            <span>Stiffness:</span>
                            <span className="font-mono text-[#F4F7FB]">
                              {formatStiffness(cand.predictions.effectiveStiffnessGpa)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[#98A6B8]">
                            <span>Part Mass:</span>
                            <span className="font-mono text-[#F4F7FB]">{formatMass(cand.predictions.massg)}</span>
                          </div>
                          <div className="flex justify-between text-[#98A6B8]">
                            <span>Score:</span>
                            <span className="font-mono text-[#37D67A]">{cand.optimizationScore.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          selectCandidate(cand.id)
                          updateGeometry(cand.geometry)
                          updateMaterial(cand.material)
                          addToast({
                            type: 'success',
                            title: 'Pareto Candidate Applied',
                            message: `${cand.name} is now the active project design`,
                          })
                          navigate('/workspace')
                        }}
                        className="btn-primary text-xs py-1.5 px-2.5 rounded flex items-center justify-center gap-1.5"
                      >
                        <Check size={13} />
                        <span>Apply Design</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}


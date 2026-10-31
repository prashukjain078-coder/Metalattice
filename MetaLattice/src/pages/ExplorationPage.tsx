import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { useAppStore } from '../store'
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import {
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  Check,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { formatMass, formatStiffness, formatStrength } from '../utils/format'
import LatticeViewer from '../components/viewport/LatticeViewer'

export default function ExplorationPage() {
  const navigate = useNavigate()
  const { candidates, selectCandidate, updateGeometry, updateMaterial, addToast } = useAppStore()

  const [sortBy, setSortBy] = useState<'score' | 'stiffness' | 'mass' | 'strength'>('score')
  const [familyFilter, setFamilyFilter] = useState<string>('all')
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    candidates[0]?.id || ''
  )

  const filteredCandidates = useMemo(() => {
    let list = [...candidates]
    if (familyFilter !== 'all') {
      list = list.filter((c) => c.geometry.family === familyFilter)
    }
    list.sort((a, b) => {
      if (sortBy === 'score') return b.optimizationScore - a.optimizationScore
      if (sortBy === 'stiffness') return b.predictions.effectiveStiffnessGpa - a.predictions.effectiveStiffnessGpa
      if (sortBy === 'mass') return a.predictions.massg - b.predictions.massg
      if (sortBy === 'strength') return b.predictions.compressiveStrengthMpa - a.predictions.compressiveStrengthMpa
      return 0
    })
    return list
  }, [candidates, familyFilter, sortBy])

  const scatterData = useMemo(() => {
    return candidates.map((c) => ({
      id: c.id,
      name: c.name,
      mass: parseFloat(c.predictions.massg.toFixed(2)),
      stiffness: parseFloat(c.predictions.effectiveStiffnessGpa.toFixed(2)),
      score: parseFloat(c.optimizationScore.toFixed(1)),
      isPareto: c.isParetoOptimal,
      family: c.geometry.family,
    }))
  }, [candidates])

  const activeCandidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0]

  const handleApplyCandidate = (id: string) => {
    const cand = candidates.find((c) => c.id === id)
    if (!cand) return
    selectCandidate(id)
    updateGeometry(cand.geometry)
    updateMaterial(cand.material)
    addToast({
      type: 'success',
      title: 'Active Design Updated',
      message: `${cand.name} transferred to main engineering workspace`,
    })
    navigate('/workspace')
  }

  return (
    <AppShell>
      <div className="h-full flex flex-col bg-[#080B10] text-[#F4F7FB] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#263342] bg-[#0D121A]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#00E5FF] uppercase tracking-wider font-semibold">
                  Trade-off Exploration
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#37D67A20] text-[#37D67A] border border-[#37D67A40]">
                  Pareto-Optimal Frontier
                </span>
              </div>
              <h1 className="text-2xl font-bold mt-1 text-[#F4F7FB]">Design Space & Parameter Trade-Offs</h1>
            </div>

            {/* Filter and Sort Toolbar */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 bg-[#111823] border border-[#263342] rounded-lg px-2.5 py-1.5">
                <Filter size={13} className="text-[#98A6B8]" />
                <span className="text-[#98A6B8]">Family:</span>
                <select
                  value={familyFilter}
                  onChange={(e) => setFamilyFilter(e.target.value)}
                  className="bg-transparent text-[#F4F7FB] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Topologies</option>
                  <option value="bcc">BCC</option>
                  <option value="fcc">FCC</option>
                  <option value="octet">Octet</option>
                  <option value="gyroid">Gyroid</option>
                  <option value="schwarz_p">Schwarz P</option>
                  <option value="diamond">Diamond</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-[#111823] border border-[#263342] rounded-lg px-2.5 py-1.5">
                <ArrowUpDown size={13} className="text-[#98A6B8]" />
                <span className="text-[#98A6B8]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-[#F4F7FB] focus:outline-none cursor-pointer"
                >
                  <option value="score">Optimization Fitness</option>
                  <option value="stiffness">Stiffness (Max)</option>
                  <option value="mass">Mass (Min)</option>
                  <option value="strength">Strength (Max)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body: Scatter Chart + Selected Candidate Details */}
        <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
          {/* Top Section: Pareto Front Plot + Active 3D Inspection */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Pareto Chart */}
            <div className="lg:col-span-2 p-4 rounded-xl bg-[#111823] border border-[#263342] flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F7FB]">
                    Pareto Frontier: Effective Stiffness vs. Part Mass
                  </h3>
                  <p className="text-[11px] text-[#98A6B8]">
                    High stiffness + low mass defines the non-dominated Pareto boundary (cyan).
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-[#00E5FF]">
                    <span className="w-2 h-2 rounded-full bg-[#00E5FF]" /> Pareto Optimal
                  </span>
                  <span className="flex items-center gap-1 text-[#98A6B8]">
                    <span className="w-2 h-2 rounded-full bg-[#98A6B8]" /> Feasible Candidate
                  </span>
                </div>
              </div>

              <div className="h-64 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263342" />
                    <XAxis
                      type="number"
                      dataKey="mass"
                      name="Mass"
                      unit="g"
                      stroke="#263342"
                      tick={{ fill: '#98A6B8', fontSize: 10 }}
                      label={{ value: 'Estimated Part Mass (g) →', position: 'bottom', fill: '#98A6B8', fontSize: 11 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="stiffness"
                      name="Stiffness"
                      unit="GPa"
                      stroke="#263342"
                      tick={{ fill: '#98A6B8', fontSize: 10 }}
                      label={{ value: '↑ Effective Stiffness (GPa)', angle: -90, position: 'left', fill: '#98A6B8', fontSize: 11 }}
                    />
                    <ZAxis type="number" dataKey="score" range={[60, 240]} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ payload }) => {
                        if (!payload || !payload.length) return null
                        const data = payload[0].payload
                        return (
                          <div className="bg-[#17212D] border border-[#263342] p-2.5 rounded shadow-xl text-xs space-y-1">
                            <p className="font-bold text-[#F4F7FB]">{data.name}</p>
                            <p className="text-[10px] text-[#00E5FF] uppercase font-mono">{data.family}</p>
                            <div className="text-[11px] text-[#98A6B8] space-y-0.5">
                              <p>Mass: <span className="text-[#F4F7FB] font-mono">{data.mass}g</span></p>
                              <p>Stiffness: <span className="text-[#00E5FF] font-mono">{data.stiffness} GPa</span></p>
                              <p>Score: <span className="text-[#37D67A] font-mono">{data.score}</span></p>
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Scatter
                      data={scatterData}
                      onClick={(node) => setSelectedCandidateId(node.id)}
                      className="cursor-pointer"
                    >
                      {scatterData.map((entry) => (
                        <Cell
                          key={entry.id}
                          fill={entry.id === selectedCandidateId ? '#8B5CF6' : entry.isPareto ? '#00E5FF' : '#4a5568'}
                          stroke={entry.id === selectedCandidateId ? '#ffffff' : entry.isPareto ? '#00E5FF' : '#263342'}
                          strokeWidth={entry.id === selectedCandidateId ? 2 : 1}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Active Candidate 3D Preview Inspector */}
            {activeCandidate && (
              <div className="p-4 rounded-xl bg-[#111823] border border-[#263342] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase text-[#F4F7FB]">{activeCandidate.name}</span>
                    {activeCandidate.isParetoOptimal && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-[#00E5FF20] text-[#00E5FF] border border-[#00E5FF40]">
                        PARETO CHOICE
                      </span>
                    )}
                  </div>
                  <div className="h-44 w-full bg-[#080B10] rounded-lg overflow-hidden border border-[#263342] relative mb-3">
                    <LatticeViewer params={activeCandidate.geometry} compact showGrid={false} showAxes={false} />
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#1a2535]">
                      <span className="text-[#98A6B8]">Topology:</span>
                      <span className="font-mono text-[#00E5FF] uppercase">{activeCandidate.geometry.family}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1a2535]">
                      <span className="text-[#98A6B8]">Stiffness:</span>
                      <span className="font-mono text-[#F4F7FB]">{formatStiffness(activeCandidate.predictions.effectiveStiffnessGpa)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1a2535]">
                      <span className="text-[#98A6B8]">Estimated Mass:</span>
                      <span className="font-mono text-[#F4F7FB]">{formatMass(activeCandidate.predictions.massg)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1a2535]">
                      <span className="text-[#98A6B8]">Relative Density:</span>
                      <span className="font-mono text-[#F4F7FB]">{(activeCandidate.geometry.relativeDensity * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleApplyCandidate(activeCandidate.id)}
                  className="btn-primary text-xs py-2 px-3 rounded-lg w-full flex items-center justify-center gap-1.5 mt-3"
                >
                  <Check size={14} />
                  <span>Transfer to Engineering Workspace</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Table: Candidate Comparison Table */}
          <div className="p-4 rounded-xl bg-[#111823] border border-[#263342] overflow-x-auto">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#98A6B8] mb-3">
              Synthesized Design Space Instances
            </h3>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#263342] text-[10px] uppercase text-[#98A6B8] font-mono">
                  <th className="py-2 px-3">Candidate</th>
                  <th className="py-2 px-3">Family</th>
                  <th className="py-2 px-3">Cell Size</th>
                  <th className="py-2 px-3">Rel. Density</th>
                  <th className="py-2 px-3">Predicted Mass</th>
                  <th className="py-2 px-3">Stiffness</th>
                  <th className="py-2 px-3">Strength</th>
                  <th className="py-2 px-3">Fitness</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2535]">
                {filteredCandidates.map((cand) => (
                  <tr
                    key={cand.id}
                    onClick={() => setSelectedCandidateId(cand.id)}
                    className={`cursor-pointer transition-colors ${
                      cand.id === selectedCandidateId
                        ? 'bg-[#17212D] text-[#F4F7FB]'
                        : 'hover:bg-[#17212D]/50 text-[#98A6B8]'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-[#F4F7FB] flex items-center gap-2">
                      <span>{cand.name}</span>
                      {cand.isParetoOptimal && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" title="Pareto Optimal" />
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono uppercase text-[#00E5FF]">{cand.geometry.family}</td>
                    <td className="py-2.5 px-3 font-mono">{cand.geometry.cellSize.toFixed(1)} mm</td>
                    <td className="py-2.5 px-3 font-mono">{(cand.geometry.relativeDensity * 100).toFixed(0)}%</td>
                    <td className="py-2.5 px-3 font-mono">{formatMass(cand.predictions.massg)}</td>
                    <td className="py-2.5 px-3 font-mono text-[#00E5FF] font-medium">
                      {formatStiffness(cand.predictions.effectiveStiffnessGpa)}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{formatStrength(cand.predictions.compressiveStrengthMpa)}</td>
                    <td className="py-2.5 px-3 font-mono text-[#37D67A]">{cand.optimizationScore.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleApplyCandidate(cand.id)
                        }}
                        className="text-[#00E5FF] hover:underline text-[11px] font-medium"
                      >
                        Select →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}


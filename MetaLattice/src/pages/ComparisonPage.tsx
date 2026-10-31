import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { useAppStore } from '../store'
import {
  GitCompare,
  Check,
  ArrowRight,
  Sparkles,
  Info,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { formatMass, formatStiffness, formatStrength } from '../utils/format'
import LatticeViewer from '../components/viewport/LatticeViewer'

export default function ComparisonPage() {
  const navigate = useNavigate()
  const { candidates, selectCandidate, updateGeometry, updateMaterial, addToast } = useAppStore()

  // Select first 2 or 3 candidates by default
  const [selectedIds, setSelectedIds] = useState<string[]>(
    candidates.slice(0, 3).map((c) => c.id)
  )

  const selectedCandidates = useMemo(() => {
    return candidates.filter((c) => selectedIds.includes(c.id))
  }, [candidates, selectedIds])

  const chartData = useMemo(() => {
    return selectedCandidates.map((c) => ({
      name: c.name,
      stiffnessGpa: parseFloat(c.predictions.effectiveStiffnessGpa.toFixed(2)),
      massGrams: parseFloat(c.predictions.massg.toFixed(1)),
      strengthMpa: parseFloat(c.predictions.compressiveStrengthMpa.toFixed(1)),
    }))
  }, [selectedCandidates])

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 2) {
        setSelectedIds(selectedIds.filter((x) => x !== id))
      } else {
        addToast({
          type: 'warning',
          title: 'Minimum Candidates',
          message: 'Comparison requires at least 2 candidates.',
        })
      }
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds([...selectedIds, id])
      } else {
        addToast({
          type: 'warning',
          title: 'Maximum Limit',
          message: 'Compare up to 4 candidates simultaneously.',
        })
      }
    }
  }

  const handleSelectWinner = (id: string) => {
    const cand = candidates.find((c) => c.id === id)
    if (!cand) return
    selectCandidate(id)
    updateGeometry(cand.geometry)
    updateMaterial(cand.material)
    addToast({
      type: 'success',
      title: 'Design Selected',
      message: `${cand.name} committed to project workspace.`,
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
                  Multi-Variant Evaluation
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#8B5CF620] text-[#8B5CF6] border border-[#8B5CF640]">
                  Side-by-Side Synced 3D
                </span>
              </div>
              <h1 className="text-2xl font-bold mt-1 text-[#F4F7FB]">Comparison Laboratory</h1>
            </div>

            {/* Candidate Selector Badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-[#98A6B8] mr-1">Select to Compare:</span>
              {candidates.map((c) => {
                const isSelected = selectedIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleSelect(c.id)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-[#00E5FF20] text-[#00E5FF] border border-[#00E5FF] font-semibold'
                        : 'bg-[#111823] text-[#98A6B8] border border-[#263342] hover:text-[#F4F7FB]'
                    }`}
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
          {/* Synchronized 3D Previews Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedCandidates.map((cand) => (
              <div
                key={cand.id}
                className="rounded-xl bg-[#111823] border border-[#263342] overflow-hidden flex flex-col"
              >
                <div className="p-3 border-b border-[#263342] flex items-center justify-between bg-[#17212D]">
                  <span className="font-bold text-xs text-[#F4F7FB]">{cand.name}</span>
                  <span className="text-[10px] font-mono text-[#00E5FF] uppercase font-semibold">
                    {cand.geometry.family}
                  </span>
                </div>

                <div className="h-48 w-full bg-[#080B10] relative">
                  <LatticeViewer params={cand.geometry} compact showGrid={false} showAxes={false} />
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#1a2535]">
                      <span className="text-[#98A6B8]">Effective Stiffness:</span>
                      <span className="font-mono text-[#00E5FF] font-semibold">
                        {formatStiffness(cand.predictions.effectiveStiffnessGpa)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1a2535]">
                      <span className="text-[#98A6B8]">Part Mass:</span>
                      <span className="font-mono text-[#F4F7FB]">{formatMass(cand.predictions.massg)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1a2535]">
                      <span className="text-[#98A6B8]">Yield Strength:</span>
                      <span className="font-mono text-[#F4F7FB]">
                        {formatStrength(cand.predictions.compressiveStrengthMpa)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1a2535]">
                      <span className="text-[#98A6B8]">Rel. Density:</span>
                      <span className="font-mono text-[#F4F7FB]">
                        {(cand.geometry.relativeDensity * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectWinner(cand.id)}
                    className="btn-primary text-xs py-1.5 px-3 rounded w-full flex items-center justify-center gap-1.5"
                  >
                    <Check size={13} />
                    <span>Select as Master Design</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bar Chart Trade-off Comparison */}
          <div className="p-4 rounded-xl bg-[#111823] border border-[#263342] space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F7FB]">
              Direct Performance Metric Cross-Comparison
            </h3>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263342" />
                  <XAxis dataKey="name" stroke="#263342" tick={{ fill: '#98A6B8', fontSize: 11 }} />
                  <YAxis stroke="#263342" tick={{ fill: '#98A6B8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#17212D',
                      borderColor: '#263342',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#F4F7FB',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#98A6B8' }} />
                  <Bar dataKey="stiffnessGpa" name="Stiffness (GPa)" fill="#00E5FF" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="massGrams" name="Mass (g)" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}


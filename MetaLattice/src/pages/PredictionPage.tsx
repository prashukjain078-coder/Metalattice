import { useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { useAppStore } from '../store'
import {
  Cpu,
  Play,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck,
  TrendingUp,
  FlaskConical,
  Layers,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts'
import { formatMass, formatStiffness, formatStrength } from '../utils/format'
import { MATERIAL_PROPERTIES, MATERIAL_LABELS } from '../data/materials'
import type { MaterialPreset, LatticeFamily } from '../types'
import { predictProperties } from '../services/prediction'

export default function PredictionPage() {
  const { currentDesign, updateMaterial, updateGeometry } = useAppStore()

  // Local interactive prediction sandbox state
  const [family, setFamily] = useState<LatticeFamily>(currentDesign?.geometry.family || 'bcc')
  const [material, setMaterial] = useState<MaterialPreset>(currentDesign?.material || 'titanium_ti64')
  const [density, setDensity] = useState<number>(currentDesign?.geometry.relativeDensity || 0.2)
  const [cellSize, setCellSize] = useState<number>(currentDesign?.geometry.cellSize || 5.0)
  const [strutThickness, setStrutThickness] = useState<number>(currentDesign?.geometry.strutThickness || 0.6)
  const [loadDirection, setLoadDirection] = useState<'uniaxial_z' | 'biaxial_xy' | 'hydrostatic'>('uniaxial_z')

  // Run live prediction calculation on the fly
  const prediction = predictProperties(
    {
      family,
      cellSize,
      strutThickness,
      relativeDensity: density,
      cellsX: 4,
      cellsY: 4,
      cellsZ: 4,
      surfaceThickness: 0.5,
      resolution: 'balanced',
      isoLevel: 0,
    },
    material,
    {
      maxMass: 150,
      minStiffness: 0.8,
      minStrength: 40,
      targetSafetyFactor: 1.5,
      process: 'slm',
      minFeatureSize: 0.35,
    }
  )

  const matProps = MATERIAL_PROPERTIES[material]

  return (
    <AppShell>
      <div className="h-full flex flex-col bg-[#080B10] text-[#F4F7FB] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#263342] bg-[#0D121A]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#00E5FF] uppercase tracking-wider font-semibold">
                  Materials Science Lab
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#8B5CF620] text-[#8B5CF6] border border-[#8B5CF640]">
                  Gibson-Ashby Scaling Engine
                </span>
              </div>
              <h1 className="text-2xl font-bold mt-1 text-[#F4F7FB]">AI Material Property Prediction</h1>
            </div>

            {/* Validation Notice Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#17212D] border border-[#263342] text-xs">
              <Info size={14} className="text-[#8B5CF6]" />
              <span className="text-[#98A6B8]">Status:</span>
              <span className="text-[#00E5FF] font-semibold font-mono">Surrogate ML (Demo Calibrated)</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column: Interactive Parametric Testing Sandbox */}
            <div className="p-5 rounded-xl bg-[#111823] border border-[#263342] space-y-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#98A6B8] flex items-center gap-1.5">
                <FlaskConical size={14} className="text-[#00E5FF]" />
                <span>Prediction Inputs & Boundary State</span>
              </h3>

              {/* Lattice Family Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#98A6B8] uppercase">Topology Family</label>
                <select
                  value={family}
                  onChange={(e) => setFamily(e.target.value as LatticeFamily)}
                  className="w-full bg-[#17212D] border border-[#263342] text-xs font-mono rounded p-2 text-[#F4F7FB] focus:outline-none focus:border-[#00E5FF]"
                >
                  <option value="bcc">BCC (Body-Centered Cubic)</option>
                  <option value="fcc">FCC (Face-Centered Cubic)</option>
                  <option value="octet">Octet Truss</option>
                  <option value="gyroid">Gyroid TPMS</option>
                  <option value="schwarz_p">Schwarz P TPMS</option>
                  <option value="diamond">Diamond Lattice</option>
                  <option value="simple_cubic">Simple Cubic</option>
                </select>
              </div>

              {/* Base Solid Material */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#98A6B8] uppercase">Solid Constituent Material</label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value as MaterialPreset)}
                  className="w-full bg-[#17212D] border border-[#263342] text-xs font-mono rounded p-2 text-[#F4F7FB] focus:outline-none focus:border-[#00E5FF]"
                >
                  {Object.entries(MATERIAL_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v} (E = {MATERIAL_PROPERTIES[k as MaterialPreset].elasticModulus} GPa)
                    </option>
                  ))}
                </select>
              </div>

              {/* Relative Density Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#98A6B8] uppercase text-[10px] font-semibold">Relative Density (ρ*)</span>
                  <span className="font-mono text-[#00E5FF]">{(density * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  value={density}
                  onChange={(e) => setDensity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#263342] rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
                />
              </div>

              {/* Unit Cell Size Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#98A6B8] uppercase text-[10px] font-semibold">Unit Cell Size</span>
                  <span className="font-mono text-[#F4F7FB]">{cellSize.toFixed(1)} mm</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={12}
                  step={0.5}
                  value={cellSize}
                  onChange={(e) => setCellSize(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#263342] rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
                />
              </div>

              {/* Strut Thickness */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#98A6B8] uppercase text-[10px] font-semibold">Strut Diameter</span>
                  <span className="font-mono text-[#F4F7FB]">{strutThickness.toFixed(2)} mm</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={1.5}
                  step={0.05}
                  value={strutThickness}
                  onChange={(e) => setStrutThickness(parseFloat(e.target.value))}
                  className="w-full h-1 bg-[#263342] rounded-lg appearance-none cursor-pointer accent-[#00E5FF]"
                />
              </div>

              {/* Loading Condition */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#98A6B8] uppercase">Loading Direction</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'uniaxial_z', label: 'Uniaxial Z' },
                    { id: 'biaxial_xy', label: 'Biaxial XY' },
                    { id: 'hydrostatic', label: 'Hydrostatic' },
                  ].map((dir) => (
                    <button
                      key={dir.id}
                      onClick={() => setLoadDirection(dir.id as any)}
                      className={`py-1 px-1.5 text-[10px] font-mono rounded border transition-colors ${
                        loadDirection === dir.id
                          ? 'bg-[#00E5FF20] text-[#00E5FF] border-[#00E5FF40]'
                          : 'bg-[#17212D] text-[#98A6B8] border-[#263342]'
                      }`}
                    >
                      {dir.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 2 Columns: Mechanical Outputs & Stress-Strain Dynamics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Metric Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#111823] border border-[#263342]">
                  <span className="label text-[10px]">Effective Modulus (E*)</span>
                  <p className="font-mono text-xl text-[#00E5FF] font-bold mt-1">
                    {formatStiffness(prediction.effectiveStiffnessGpa)}
                  </p>
                  <p className="text-[10px] text-[#98A6B8] mt-1">Solid E: {matProps.elasticModulus} GPa</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#111823] border border-[#263342]">
                  <span className="label text-[10px]">Compressive Yield (σy*)</span>
                  <p className="font-mono text-xl text-[#F4F7FB] font-bold mt-1">
                    {formatStrength(prediction.compressiveStrengthMpa)}
                  </p>
                  <p className="text-[10px] text-[#98A6B8] mt-1">Solid σy: {matProps.yieldStrength} MPa</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#111823] border border-[#263342]">
                  <span className="label text-[10px]">Estimated Mass</span>
                  <p className="font-mono text-xl text-[#37D67A] font-bold mt-1">
                    {formatMass(prediction.massg)}
                  </p>
                  <p className="text-[10px] text-[#98A6B8] mt-1">ρ: {matProps.density} kg/m³</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#111823] border border-[#263342]">
                  <span className="label text-[10px]">Energy Absorption</span>
                  <p className="font-mono text-xl text-[#8B5CF6] font-bold mt-1">
                    {(prediction.compressiveStrengthMpa * 0.45).toFixed(1)}{' '}
                    <span className="text-xs text-[#98A6B8]">MJ/m³</span>
                  </p>
                  <p className="text-[10px] text-[#98A6B8] mt-1">To 40% strain</p>
                </div>
              </div>

              {/* Stress-Strain Dynamic Chart */}
              <div className="p-4 rounded-xl bg-[#111823] border border-[#263342] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F4F7FB]">
                      Predicted Stress-Strain Response
                    </h3>
                    <p className="text-[11px] text-[#98A6B8]">
                      Linear elastic deformation, plastic plateau, and densification transition.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#17212D] text-[#00E5FF] border border-[#263342]">
                    Surrogate Approximation
                  </span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={prediction.stressStrainPoints}>
                      <defs>
                        <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#263342" />
                      <XAxis
                        dataKey="strain"
                        stroke="#263342"
                        tick={{ fill: '#98A6B8', fontSize: 10 }}
                        label={{ value: 'Strain (ε) →', position: 'bottom', fill: '#98A6B8', fontSize: 11 }}
                      />
                      <YAxis
                        stroke="#263342"
                        tick={{ fill: '#98A6B8', fontSize: 10 }}
                        label={{ value: '↑ Stress (MPa)', angle: -90, position: 'left', fill: '#98A6B8', fontSize: 11 }}
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
                      <Area
                        type="monotone"
                        dataKey="stressMpa"
                        stroke="#00E5FF"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#stressGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Scientific Rigor & Disclosure Callout */}
              <div className="p-4 rounded-xl bg-[#111823] border border-[#263342] flex items-start gap-3 text-xs">
                <ShieldCheck size={18} className="text-[#37D67A] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-[#F4F7FB]">Scientific Disclosure & Engineering Assumption Notice</p>
                  <p className="text-[#98A6B8] leading-relaxed text-[11px]">
                    The predictions presented here are evaluated using analytical power-law scaling relations derived from Gibson-Ashby porous cellular solid theories coupled with surrogate regression models. They provide rapid directional guidance for generative exploration. Prior to production or flight certification, physical coupon testing or high-fidelity FEA homogenization (e.g., via ANSYS/Abaqus) must be performed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}


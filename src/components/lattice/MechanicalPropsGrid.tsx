import { ShieldAlert } from 'lucide-react'
import type { ModelData } from './LatticeViewer3D'

interface Props {
  model: ModelData
}

export default function MechanicalPropsGrid({ model }: Props) {
  const p = model.properties
  const hotspot = model.fea.critical_hotspot

  const isCandidate2 =
    model.id === 'model_2' ||
    model.name.toLowerCase().includes('model 2') ||
    model.name.toLowerCase().includes('candidate 2') ||
    model.name.toLowerCase().includes('toughness') ||
    model.topology_type.toLowerCase().includes('kelvin') ||
    model.topology_type.toLowerCase().includes('energy')

  const sea =
    p.specific_energy_absorption_kj_kg ??
    Number((p.energy_absorption_mj_m3 / (model.relative_density * 2.7 * 0.001)).toFixed(1))

  return (
    <div className="flex flex-col gap-2">
      {/* Sleek, uncluttered unified engineering metrics bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-5 py-3 shadow-2xs">
        {/* Metric 1: Stiffness */}
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[11px] font-medium text-black/45">Stiffness (E):</span>
          <span className="text-base font-bold tracking-tight text-black">{p.youngs_modulus_gpa}</span>
          <span className="font-mono text-[10px] text-black/40">GPa</span>
        </div>

        <div className="hidden h-4 w-px bg-black/10 sm:block" />

        {/* Metric 2: Peak Stress */}
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[11px] font-medium text-black/45">Peak Stress:</span>
          <span className="text-base font-bold tracking-tight text-black">{p.peak_stress_mpa}</span>
          <span className="font-mono text-[10px] text-black/40">MPa</span>
        </div>

        <div className="hidden h-4 w-px bg-black/10 sm:block" />

        {/* Metric 3: Energy Absorption */}
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[11px] font-medium text-black/45">Energy (W_v):</span>
          <span className={`text-base font-bold tracking-tight ${isCandidate2 ? 'text-emerald-600' : 'text-black'}`}>
            {p.energy_absorption_mj_m3}
          </span>
          <span className="font-mono text-[10px] text-black/40">MJ/m³</span>
        </div>

        <div className="hidden h-4 w-px bg-black/10 sm:block" />

        {/* Metric 4: SEA */}
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[11px] font-medium text-black/45">Toughness (SEA):</span>
          <span className={`text-base font-bold tracking-tight ${isCandidate2 ? 'text-emerald-600' : 'text-black'}`}>
            {sea}
          </span>
          <span className="font-mono text-[10px] text-black/40">kJ/kg</span>
        </div>

        <div className="hidden h-4 w-px bg-black/10 sm:block" />

        {/* Inline Hotspot */}
        <div className="flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700">
          <ShieldAlert className="h-3 w-3 shrink-0 text-rose-600" />
          <span>Hotspot:</span>
          <strong className="font-mono font-bold text-rose-800">{hotspot.peak_stress_mpa} MPa</strong>
        </div>
      </div>
    </div>
  )
}

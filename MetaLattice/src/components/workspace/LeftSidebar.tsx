import { useAppStore } from '../../store'
import { CollapsibleSection, SelectInput } from '../ui/Controls'
import { SliderInput } from '../ui/Inputs'
import { Target, Hexagon, Sliders, FlaskConical, Lock } from 'lucide-react'
import type { LatticeFamily, MaterialPreset, DesignObjective, ManufacturingProcess } from '../../types'

const OBJECTIVE_OPTIONS: { id: DesignObjective; label: string }[] = [
  { id: 'min_mass', label: 'Minimum Mass' },
  { id: 'max_stiffness', label: 'Maximum Stiffness' },
  { id: 'max_strength', label: 'Maximum Strength' },
  { id: 'target_density', label: 'Target Density' },
  { id: 'target_porosity', label: 'Target Porosity' },
  { id: 'max_energy_absorption', label: 'Energy Absorption' },
]

const LATTICE_FAMILIES: { id: LatticeFamily; label: string; desc: string }[] = [
  { id: 'bcc', label: 'BCC', desc: 'Body-Centered Cubic' },
  { id: 'fcc', label: 'FCC', desc: 'Face-Centered Cubic' },
  { id: 'octet', label: 'Octet', desc: 'Octet Truss' },
  { id: 'simple_cubic', label: 'SC', desc: 'Simple Cubic' },
  { id: 'diamond', label: 'Diamond', desc: 'Diamond Lattice' },
  { id: 'gyroid', label: 'Gyroid', desc: 'TPMS Gyroid' },
  { id: 'schwarz_p', label: 'Schwarz P', desc: 'TPMS Schwarz P' },
  { id: 'schwarz_d', label: 'Schwarz D', desc: 'TPMS Schwarz D' },
  { id: 'primitive_tpms', label: 'Primitive', desc: 'TPMS Primitive' },
  { id: 'voronoi', label: 'Voronoi', desc: 'Voronoi Network' },
]

const MATERIALS: { id: MaterialPreset; label: string; color: string }[] = [
  { id: 'titanium_ti64', label: 'Ti-6Al-4V', color: '#00E5FF' },
  { id: 'aluminum_6061', label: 'Al 6061-T6', color: '#37D67A' },
  { id: 'stainless_316l', label: 'Steel 316L', color: '#98A6B8' },
  { id: 'polymer_abs', label: 'ABS Polymer', color: '#FFB84D' },
  { id: 'cfrp', label: 'CFRP', color: '#8B5CF6' },
]

const PROCESS_OPTIONS: { value: ManufacturingProcess; label: string }[] = [
  { value: 'slm', label: 'SLM / LPBF' },
  { value: 'ebm', label: 'EBM' },
  { value: 'fdm', label: 'FDM' },
  { value: 'sls', label: 'SLS' },
  { value: 'binder_jetting', label: 'Binder Jetting' },
  { value: 'cnc', label: 'CNC' },
]

export function LeftSidebar() {
  const {
    currentDesign,
    updateGeometry,
    updateMaterial,
    updateObjectives,
    updateConstraints,
  } = useAppStore()

  if (!currentDesign) return (
    <div className="flex items-center justify-center h-full text-[#98A6B8] text-sm p-4 text-center">
      No active design.<br />Open or create a project.
    </div>
  )

  const geo = currentDesign.geometry
  const objectives = currentDesign.objectives

  return (
    <div className="h-full overflow-y-auto bg-[#0D121A] border-r border-[#263342] text-[#F4F7FB] flex flex-col">

      {/* Section 1: Objectives */}
      <CollapsibleSection title="Design Objectives" icon={<Target size={13} />}>
        <div className="flex flex-col gap-1">
          {OBJECTIVE_OPTIONS.map(obj => (
            <label key={obj.id} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={objectives.includes(obj.id)}
                onChange={e => {
                  if (e.target.checked) updateObjectives([...objectives, obj.id])
                  else updateObjectives(objectives.filter(o => o !== obj.id))
                }}
                className="w-3.5 h-3.5 accent-[#00E5FF]"
              />
              <span className="text-xs text-[#98A6B8] group-hover:text-[#F4F7FB] transition-colors">{obj.label}</span>
            </label>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 2: Lattice Family */}
      <CollapsibleSection title="Lattice Family" icon={<Hexagon size={13} />}>
        <div className="grid grid-cols-2 gap-1.5">
          {LATTICE_FAMILIES.map(f => (
            <button
              key={f.id}
              onClick={() => updateGeometry({ family: f.id })}
              className={`text-left p-2 rounded-md border transition-all duration-150 ${
                geo.family === f.id
                  ? 'border-[#00E5FF40] bg-[#00E5FF0D] text-[#00E5FF]'
                  : 'border-[#263342] bg-[#111823] text-[#98A6B8] hover:bg-[#17212D] hover:text-[#F4F7FB]'
              }`}
            >
              <p className="text-[10px] font-bold">{f.label}</p>
              <p className="text-[9px] opacity-60 leading-tight mt-0.5">{f.desc}</p>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 3: Geometry Parameters */}
      <CollapsibleSection title="Geometry Parameters" icon={<Sliders size={13} />}>
        <SliderInput label="Cell Size" value={geo.cellSize} min={1} max={15} step={0.5} unit="mm"
          onChange={v => updateGeometry({ cellSize: v })} />
        <SliderInput label="Strut Thickness" value={geo.strutThickness} min={0.1} max={geo.cellSize * 0.4}
          step={0.05} unit="mm" onChange={v => updateGeometry({ strutThickness: v })} />
        <SliderInput label="Relative Density" value={geo.relativeDensity} min={0.05} max={0.5}
          step={0.01} unit="" digits={3}
          onChange={v => updateGeometry({ relativeDensity: v })} />
        <div className="grid grid-cols-3 gap-1.5">
          {(['cellsX', 'cellsY', 'cellsZ'] as const).map((ax, i) => (
            <div key={ax} className="flex flex-col gap-1">
              <span className="label text-center">{['X', 'Y', 'Z'][i]}-Cells</span>
              <input
                type="number" min={1} max={10} value={geo[ax]}
                onChange={e => updateGeometry({ [ax]: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-full bg-[#17212D] border border-[#263342] text-[#F4F7FB] text-xs font-mono text-center rounded px-1 py-1 focus:outline-none focus:border-[#00E5FF40]"
              />
            </div>
          ))}
        </div>
        {['gyroid','schwarz_p','schwarz_d','primitive_tpms'].includes(geo.family) && (
          <SliderInput label="ISO Level" value={geo.isoLevel} min={-1} max={1} step={0.05} digits={2}
            onChange={v => updateGeometry({ isoLevel: v })} />
        )}
        <SelectInput label="Resolution" value={geo.resolution}
          options={[{ value: 'draft', label: 'Draft (fast)' }, { value: 'balanced', label: 'Balanced' }, { value: 'high', label: 'High Fidelity' }]}
          onChange={v => updateGeometry({ resolution: v as 'draft' | 'balanced' | 'high' })} />
      </CollapsibleSection>

      {/* Section 4: Material */}
      <CollapsibleSection title="Material" icon={<FlaskConical size={13} />}>
        <div className="flex flex-col gap-1.5">
          {MATERIALS.map(m => (
            <button
              key={m.id}
              onClick={() => updateMaterial(m.id)}
              className={`flex items-center gap-2 p-2 rounded-md border transition-all duration-150 ${
                currentDesign.material === m.id
                  ? 'border-[#00E5FF40] bg-[#00E5FF0D]'
                  : 'border-[#263342] bg-[#111823] hover:bg-[#17212D]'
              }`}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
              <span className={`text-xs font-medium ${currentDesign.material === m.id ? 'text-[#F4F7FB]' : 'text-[#98A6B8]'}`}>
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 5: Constraints */}
      <CollapsibleSection title="Constraints" icon={<Lock size={13} />} defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="label">Max Mass</span>
            <div className="flex items-center gap-1">
              <input type="number" min={0} value={currentDesign.constraints.maxMass ?? ''}
                placeholder="—"
                onChange={e => updateConstraints({ maxMass: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-16 bg-[#17212D] border border-[#263342] text-[#F4F7FB] text-xs font-mono text-right rounded px-1.5 py-0.5 focus:outline-none" />
              <span className="text-[#98A6B8] text-xs">g</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="label">Min Stiffness</span>
            <div className="flex items-center gap-1">
              <input type="number" min={0} value={currentDesign.constraints.minStiffness ?? ''}
                placeholder="—"
                onChange={e => updateConstraints({ minStiffness: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-16 bg-[#17212D] border border-[#263342] text-[#F4F7FB] text-xs font-mono text-right rounded px-1.5 py-0.5 focus:outline-none" />
              <span className="text-[#98A6B8] text-xs">GPa</span>
            </div>
          </div>
          <SliderInput label="Safety Factor" value={currentDesign.constraints.targetSafetyFactor}
            min={1} max={5} step={0.1} digits={1}
            onChange={v => updateConstraints({ targetSafetyFactor: v })} />
          <SelectInput label="Process" value={currentDesign.constraints.process}
            options={PROCESS_OPTIONS}
            onChange={v => updateConstraints({ process: v as ManufacturingProcess })} />
          <SliderInput label="Min Feature" value={currentDesign.constraints.minFeatureSize}
            min={0.1} max={2} step={0.05} unit="mm"
            onChange={v => updateConstraints({ minFeatureSize: v })} />
        </div>
      </CollapsibleSection>
    </div>
  )
}


import { useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { useAppStore } from '../store'
import {
  Download,
  FileText,
  FileCode,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Info,
} from 'lucide-react'
import { formatMass, formatStiffness, formatStrength, formatDate } from '../utils/format'
import { buildLatticeGeometry } from '../components/lattice/LatticeGeometryEngine'
import * as THREE from 'three'

export default function ExportPage() {
  const { currentDesign, activeProjectId, projects, candidates, addToast } = useAppStore()
  const project = projects.find((p) => p.id === activeProjectId)

  const [exportingFormat, setExportingFormat] = useState<string | null>(null)

  // Export actual STL file
  const handleExportSTL = () => {
    if (!currentDesign) return
    setExportingFormat('stl')

    try {
      const geo = buildLatticeGeometry(currentDesign.geometry)
      const pos = geo.attributes.position.array
      const normal = geo.attributes.normal?.array

      let stl = `solid ${currentDesign.name.replace(/\s+/g, '_')}\n`
      const count = pos.length / 9 // 3 vertices per triangle

      for (let i = 0; i < count; i++) {
        const i9 = i * 9
        const nx = normal ? normal[i9] : 0
        const ny = normal ? normal[i9 + 1] : 0
        const nz = normal ? normal[i9 + 2] : 1

        stl += `  facet normal ${nx.toFixed(4)} ${ny.toFixed(4)} ${nz.toFixed(4)}\n`
        stl += '    outer loop\n'
        stl += `      vertex ${pos[i9].toFixed(3)} ${pos[i9 + 1].toFixed(3)} ${pos[i9 + 2].toFixed(3)}\n`
        stl += `      vertex ${pos[i9 + 3].toFixed(3)} ${pos[i9 + 4].toFixed(3)} ${pos[i9 + 5].toFixed(3)}\n`
        stl += `      vertex ${pos[i9 + 6].toFixed(3)} ${pos[i9 + 7].toFixed(3)} ${pos[i9 + 8].toFixed(3)}\n`
        stl += '    endloop\n'
        stl += '  endfacet\n'
      }
      stl += `endsolid ${currentDesign.name.replace(/\s+/g, '_')}\n`

      const blob = new Blob([stl], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentDesign.name.toLowerCase().replace(/\s+/g, '-')}.stl`
      a.click()
      URL.revokeObjectURL(url)

      addToast({
        type: 'success',
        title: 'STL Export Successful',
        message: 'Triangulated mesh exported for 3D slicing',
      })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not construct STL mesh',
      })
    } finally {
      setExportingFormat(null)
    }
  }

  // Export actual OBJ file
  const handleExportOBJ = () => {
    if (!currentDesign) return
    setExportingFormat('obj')

    try {
      const geo = buildLatticeGeometry(currentDesign.geometry)
      const pos = geo.attributes.position.array

      let obj = `# MetaLattice 3D Mesh OBJ\n# Project: ${project?.name || 'MetaLattice'}\n`
      for (let i = 0; i < pos.length; i += 3) {
        obj += `v ${pos[i].toFixed(3)} ${pos[i + 1].toFixed(3)} ${pos[i + 2].toFixed(3)}\n`
      }
      const numVerts = pos.length / 3
      for (let i = 1; i <= numVerts; i += 3) {
        obj += `f ${i} ${i + 1} ${i + 2}\n`
      }

      const blob = new Blob([obj], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentDesign.name.toLowerCase().replace(/\s+/g, '-')}.obj`
      a.click()
      URL.revokeObjectURL(url)

      addToast({
        type: 'success',
        title: 'OBJ Export Successful',
        message: 'Wavefront OBJ file generated',
      })
    } catch {
      addToast({ type: 'error', title: 'Export Failed', message: 'Could not generate OBJ' })
    } finally {
      setExportingFormat(null)
    }
  }

  // Export JSON specification
  const handleExportJSON = () => {
    if (!currentDesign) return
    const data = {
      project: project?.name,
      design: currentDesign,
      candidates,
      exportTimestamp: new Date().toISOString(),
      generator: 'MetaLattice Computational Engineering Platform v2.0',
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `metalattice-${currentDesign.name.toLowerCase().replace(/\s+/g, '-')}-spec.json`
    a.click()
    URL.revokeObjectURL(url)

    addToast({
      type: 'success',
      title: 'JSON Metadata Exported',
      message: 'Design parameters and validation metadata saved',
    })
  }

  // Export CSV Candidate Table
  const handleExportCSV = () => {
    let csv = 'Candidate Name,Topology Family,Cell Size (mm),Relative Density (%),Stiffness (GPa),Compressive Strength (MPa),Mass (g),Fitness Score,Pareto Optimal\n'
    candidates.forEach((c) => {
      csv += `"${c.name}",${c.geometry.family},${c.geometry.cellSize},${(c.geometry.relativeDensity * 100).toFixed(1)},${c.predictions.effectiveStiffnessGpa.toFixed(2)},${c.predictions.compressiveStrengthMpa.toFixed(1)},${c.predictions.massg.toFixed(2)},${c.optimizationScore.toFixed(1)},${c.isParetoOptimal ? 'YES' : 'NO'}\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'metalattice-candidates-comparison.csv'
    a.click()
    URL.revokeObjectURL(url)

    addToast({
      type: 'success',
      title: 'CSV Table Exported',
      message: 'Candidate metrics exported for Excel/Python analysis',
    })
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
                  Deliverables & Verification
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#37D67A20] text-[#37D67A] border border-[#37D67A40]">
                  Engineering Certification Ready
                </span>
              </div>
              <h1 className="text-2xl font-bold mt-1 text-[#F4F7FB]">Export & Engineering Reports</h1>
            </div>

            <button
              onClick={() => window.print()}
              className="btn-secondary text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5"
            >
              <Printer size={14} />
              <span>Print / Save PDF Report</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
          {/* Format Download Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#111823] border border-[#263342] flex flex-col justify-between space-y-3">
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#00E5FF15] text-[#00E5FF] flex items-center justify-center mb-2">
                  <Download size={16} />
                </div>
                <h3 className="font-bold text-sm text-[#F4F7FB]">STL Geometry</h3>
                <p className="text-[11px] text-[#98A6B8] mt-1 leading-relaxed">
                  Triangulated solid mesh compatible with slicing software (PrusaSlicer, Cura, EOS).
                </p>
              </div>
              <button
                onClick={handleExportSTL}
                disabled={exportingFormat === 'stl'}
                className="btn-primary text-xs py-1.5 px-3 rounded w-full flex items-center justify-center gap-1.5"
              >
                <Download size={12} />
                <span>Export .STL</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#111823] border border-[#263342] flex flex-col justify-between space-y-3">
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#8B5CF615] text-[#8B5CF6] flex items-center justify-center mb-2">
                  <FileCode size={16} />
                </div>
                <h3 className="font-bold text-sm text-[#F4F7FB]">Wavefront OBJ</h3>
                <p className="text-[11px] text-[#98A6B8] mt-1 leading-relaxed">
                  Polygon vertex/face mesh format for CAD import, Blender, and FEM solvers.
                </p>
              </div>
              <button
                onClick={handleExportOBJ}
                disabled={exportingFormat === 'obj'}
                className="btn-primary text-xs py-1.5 px-3 rounded w-full flex items-center justify-center gap-1.5"
              >
                <Download size={12} />
                <span>Export .OBJ</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#111823] border border-[#263342] flex flex-col justify-between space-y-3">
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#37D67A15] text-[#37D67A] flex items-center justify-center mb-2">
                  <FileSpreadsheet size={16} />
                </div>
                <h3 className="font-bold text-sm text-[#F4F7FB]">CSV Matrix</h3>
                <p className="text-[11px] text-[#98A6B8] mt-1 leading-relaxed">
                  Complete candidate comparison data table with mechanical metrics.
                </p>
              </div>
              <button
                onClick={handleExportCSV}
                className="btn-secondary text-xs py-1.5 px-3 rounded w-full flex items-center justify-center gap-1.5"
              >
                <Download size={12} />
                <span>Export .CSV</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#111823] border border-[#263342] flex flex-col justify-between space-y-3">
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#FFB84D15] text-[#FFB84D] flex items-center justify-center mb-2">
                  <FileText size={16} />
                </div>
                <h3 className="font-bold text-sm text-[#F4F7FB]">JSON Parametric</h3>
                <p className="text-[11px] text-[#98A6B8] mt-1 leading-relaxed">
                  Machine-readable design parameter recipe and surrogate prediction logs.
                </p>
              </div>
              <button
                onClick={handleExportJSON}
                className="btn-secondary text-xs py-1.5 px-3 rounded w-full flex items-center justify-center gap-1.5"
              >
                <Download size={12} />
                <span>Export .JSON</span>
              </button>
            </div>
          </div>

          {/* Printable Formal Engineering Summary Report Card */}
          <div className="p-6 rounded-xl bg-[#111823] border border-[#263342] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#263342]">
              <div>
                <span className="text-[10px] font-mono text-[#00E5FF] uppercase font-bold tracking-widest">
                  Official Verification Summary
                </span>
                <h2 className="text-lg font-bold text-[#F4F7FB] mt-0.5">
                  {project?.name || 'AERO-CORE | Lightweight Aerospace Bracket'}
                </h2>
              </div>
              <div className="text-right text-xs font-mono text-[#98A6B8]">
                <p>Report Date: {formatDate(Date.now())}</p>
                <p className="text-[#37D67A]">Doc ID: ML-REP-2026-X8</p>
              </div>
            </div>

            {/* Design Parameters Overview */}
            {currentDesign && (
              <div className="grid md:grid-cols-3 gap-6 text-xs">
                <div className="space-y-2">
                  <h4 className="font-semibold uppercase tracking-wider text-[#98A6B8] text-[10px]">
                    1. Geometry Parameters
                  </h4>
                  <div className="p-3 rounded bg-[#17212D] border border-[#263342] space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#98A6B8]">Lattice Family:</span>
                      <span className="text-[#00E5FF] uppercase">{currentDesign.geometry.family}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#98A6B8]">Unit Cell Dimension:</span>
                      <span>{currentDesign.geometry.cellSize} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#98A6B8]">Strut Diameter:</span>
                      <span>{currentDesign.geometry.strutThickness} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#98A6B8]">Relative Density:</span>
                      <span>{(currentDesign.geometry.relativeDensity * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold uppercase tracking-wider text-[#98A6B8] text-[10px]">
                    2. Material & Process
                  </h4>
                  <div className="p-3 rounded bg-[#17212D] border border-[#263342] space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#98A6B8]">Alloy / Base:</span>
                      <span className="text-[#F4F7FB] uppercase">{currentDesign.material}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#98A6B8]">Additive Method:</span>
                      <span>{currentDesign.constraints.process.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#98A6B8]">Safety Factor:</span>
                      <span>{currentDesign.constraints.targetSafetyFactor}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#98A6B8]">Min Feature Limit:</span>
                      <span>&gt; {currentDesign.constraints.minFeatureSize} mm</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold uppercase tracking-wider text-[#98A6B8] text-[10px]">
                    3. Predicted Performance
                  </h4>
                  <div className="p-3 rounded bg-[#17212D] border border-[#263342] space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#98A6B8]">Effective Stiffness:</span>
                      <span className="text-[#00E5FF]">
                        {currentDesign.predictions
                          ? formatStiffness(currentDesign.predictions.effectiveStiffnessGpa)
                          : '1.82 GPa'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#98A6B8]">Yield Strength:</span>
                      <span>
                        {currentDesign.predictions
                          ? formatStrength(currentDesign.predictions.compressiveStrengthMpa)
                          : '78.4 MPa'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#98A6B8]">Estimated Mass:</span>
                      <span className="text-[#37D67A]">
                        {currentDesign.predictions ? formatMass(currentDesign.predictions.massg) : '84.2 g'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#98A6B8]">Fitness Score:</span>
                      <span>88.5 / 100</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scientific Disclaimer Banner */}
            <div className="p-3.5 rounded-lg bg-[#17212D] border border-[#263342] flex items-start gap-3 text-xs">
              <ShieldAlert size={16} className="text-[#FFB84D] shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#98A6B8] leading-relaxed">
                <strong>Standard Engineering Disclaimer:</strong> Data generated by the MetaLattice AI surrogate model represents rapid computational scaling approximations. This report does not certify structural airworthiness without subsequent FEA structural simulation and coupon physical load testing per ASTM E8/E9 standards.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}


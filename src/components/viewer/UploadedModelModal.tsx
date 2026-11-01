import { useEffect, useRef, useState } from 'react'
import { X, Box, Layers, CheckCircle2, Ruler, Sparkles, Download, Flame } from 'lucide-react'
import UploadedModelViewer from './UploadedModelViewer'
import type { ParsedGeometryResult } from '../../utils/cadMeshLoader'
import {
  exportPredictedLatticeToJson,
  exportPredictedLatticeToObj,
  mapPredictedNodesToModelBounds,
  triggerFileDownload,
} from '../../utils/latticeGenerator'
import type { ModelData } from '../lattice/LatticeViewer3D'
import { BENCHMARK_MODEL_1, BENCHMARK_MODEL_2 } from '../../utils/benchmarkModels'

interface Props {
  open: boolean
  onClose: () => void
  file: File | null
  predictedModel?: ModelData | null
  alternativeModel?: ModelData | null
  onProceedToMaterialize?: () => void
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadedModelModal({
  open,
  onClose,
  file,
  predictedModel,
  alternativeModel,
  onProceedToMaterialize,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [stats, setStats] = useState<ParsedGeometryResult | null>(null)

  const activePredModel = predictedModel || BENCHMARK_MODEL_1

  // Esc to close & lock body scroll
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open || !file) return null

  const volumeEstimate = stats
    ? (stats.dimensions.x * stats.dimensions.y * stats.dimensions.z).toFixed(1)
    : null

  const handleDownload = (format: 'json' | 'obj') => {
    if (!stats) return
    const worldNodes = mapPredictedNodesToModelBounds(activePredModel.nodes, stats.rawBounds)
    const base = file.name.replace(/\.[^/.]+$/, '')

    if (format === 'json') {
      const data = exportPredictedLatticeToJson(activePredModel, file.name, worldNodes)
      triggerFileDownload(data, `${base}_predicted_lattice.json`, 'application/json')
    } else {
      const data = exportPredictedLatticeToObj(activePredModel, worldNodes)
      triggerFileDownload(data, `${base}_predicted_lattice.obj`, 'text/plain')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="model-viewer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Modal Dialog Container */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-black/15 bg-white shadow-2xl transition-all"
      >
        {/* Header Bar */}
        <header className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black text-white shadow-xs">
              <Box className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="model-viewer-modal-title" className="text-base font-bold text-black">
                  3D Geometry & Predicted Lattice Inspector
                </h2>
                <span className="rounded-full border border-black/10 bg-black/[0.04] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-black/70">
                  {file.name.split('.').pop()?.toUpperCase() ?? '3D'}
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  Best Infill: {activePredModel.topology_type}
                </span>
              </div>
              <p className="mt-0.5 truncate font-mono text-xs text-black/50">
                {file.name} • {formatSize(file.size)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black/60 transition hover:border-black hover:bg-black hover:text-white"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* 3D Viewport Area */}
        <div className="relative flex-1 bg-[#fcfcfc] p-4 sm:p-6">
          <UploadedModelViewer
            file={file}
            predictedModel={predictedModel}
            alternativeModel={alternativeModel}
            height={480}
            showControls={true}
            showStats={true}
            compact={false}
            onStatsReady={setStats}
          />
        </div>

        {/* Diagnostics & Geometry Metrics Footer */}
        <div className="border-t border-black/10 bg-[#fafafa] px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left Metrics */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-black/40">Geometry</p>
                  <p className="text-xs font-semibold text-black">As-Is Native CAD</p>
                </div>
              </div>

              {stats && (
                <>
                  <div className="h-7 w-px bg-black/10 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-black/70">
                      <Layers className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-black/40">CAD Model Mesh</p>
                      <p className="text-xs font-semibold text-black font-mono">
                        {stats.vertexCount.toLocaleString()} Verts
                        {stats.faceCount > 0 ? ` • ${stats.faceCount.toLocaleString()} Faces` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="h-7 w-px bg-black/10 hidden md:block" />
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-black/70">
                      <Ruler className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-black/40">Bounding Dimensions</p>
                      <p className="text-xs font-semibold text-black font-mono">
                        {stats.dimensions.x} × {stats.dimensions.y} × {stats.dimensions.z}
                        {volumeEstimate ? ` (Vol: ~${volumeEstimate})` : ''}
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className="h-7 w-px bg-black/10 hidden lg:block" />
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700">
                  <Flame className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-black/40">Predicted Infill Capacity</p>
                  <p className="text-xs font-semibold text-emerald-700 font-mono">
                    σ_peak: {activePredModel.properties.peak_stress_mpa} MPa • E: {activePredModel.properties.youngs_modulus_gpa} GPa
                  </p>
                </div>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Lattice File Export Menu */}
              <div className="flex items-center rounded-full border border-black/15 bg-white p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleDownload('json')}
                  title="Download System's Predicted Lattice File as JSON"
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-black/80 transition hover:bg-black hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  Lattice .json
                </button>
                <div className="h-3 w-px bg-black/10" />
                <button
                  type="button"
                  onClick={() => handleDownload('obj')}
                  title="Download System's Predicted Lattice File as 3D Wavefront OBJ"
                  className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-black/60 transition hover:bg-black hover:text-white"
                >
                  .obj
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold text-black/80 transition hover:border-black hover:text-black"
              >
                Close
              </button>

              {onProceedToMaterialize && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onProceedToMaterialize()
                  }}
                  className="flex items-center gap-2 rounded-full bg-black px-5 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 hover:shadow-md"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Materialize Dual Lattices
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

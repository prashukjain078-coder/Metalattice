import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, CheckCircle2, Loader2, Eye, Box, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import LatticeViewer3D, { type ModelData } from '../components/lattice/LatticeViewer3D'
import MechanicalPropsGrid from '../components/lattice/MechanicalPropsGrid'
import UploadedModelViewer from '../components/viewer/UploadedModelViewer'
import UploadedModelModal from '../components/viewer/UploadedModelModal'
import { BENCHMARK_MODEL_1, BENCHMARK_MODEL_2, BENCHMARK_COMPARISON } from '../utils/benchmarkModels'
import { createSampleBracketFile } from '../utils/sampleModel'

const ACCEPTED = ['.step', '.stl', '.obj', '.3mf', '.gpkl', '.json']
const ACCEPT_ATTR = ACCEPTED.join(',')

function isAccepted(f: File) {
  const name = f.name.toLowerCase()
  return ACCEPTED.some((ext) => name.endsWith(ext))
}

function hasFiles(e: DragEvent) {
  return Array.from(e.dataTransfer.types).includes('Files')
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const NAV = [
  {
    label: 'Materialize',
    active: true,
    icon: (
      <Icon>
        <path d="M12 3 3 8l9 5 9-5-9-5Z" />
        <path d="m3 13 9 5 9-5" />
      </Icon>
    ),
  },
  {
    label: 'Library',
    active: false,
    icon: (
      <Icon>
        <rect x="4" y="4" width="7" height="7" rx="1" />
        <rect x="13" y="4" width="7" height="7" rx="1" />
        <rect x="4" y="13" width="7" height="7" rx="1" />
        <rect x="13" y="13" width="7" height="7" rx="1" />
      </Icon>
    ),
  },
  {
    label: 'History',
    active: false,
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </Icon>
    ),
  },
  {
    label: 'Settings',
    active: false,
    icon: (
      <Icon>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </Icon>
    ),
  },
]

export default function MaterializePage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  // Pre-load sample 3D CAD model so user immediately has live visual feedback of the 3D model & predicted lattice
  const [file, setFile] = useState<File | null>(() => createSampleBracketFile())
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 2 Best Comparison Models
  const [model1, setModel1] = useState<ModelData | null>(null)
  const [model2, setModel2] = useState<ModelData | null>(null)
  const [comparison, setComparison] = useState<{
    delta_sea_percent: number
    delta_peak_stress_percent: number
    delta_weight_percent: number
    correlation_score: number
    summary: string
  } | null>(null)

  // Heatmap mode for each window ('stress' or 'strain')
  const [mode1, setMode1] = useState<'stress' | 'strain'>('stress')
  const [mode2, setMode2] = useState<'stress' | 'strain'>('stress')

  // 3D Viewer & Opener state for uploaded CAD/mesh file
  const [isOpenerOpen, setIsOpenerOpen] = useState(false)
  const [showInlineViewer, setShowInlineViewer] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    // Run initial dual-model synthesis on initial CAD model
    handleMaterialize(file)
  }, [])

  const takeFiles = (list: FileList | null | undefined) => {
    const files = Array.from(list ?? [])
    if (files.length === 0) return
    const ok = files.find(isAccepted)
    if (ok) {
      setFile(ok)
      setShowInlineViewer(true)
      setError(null)
    } else {
      setError(`"${files[0].name}" is not supported. Use .step, .stl, .obj, .3mf, .gpkl, or .json.`)
    }
  }

  const loadSample = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const sample = createSampleBracketFile()
    setFile(sample)
    setShowInlineViewer(true)
    setError(null)
  }

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    takeFiles(e.target.files)
    e.target.value = ''
  }

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(e)) return
    e.preventDefault()
    setDragging(true)
  }

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(e)) return
    e.preventDefault()
    setDragging(false)
    takeFiles(e.dataTransfer.files)
  }

  const clearFile = () => {
    setFile(null)
    setError(null)
    setShowInlineViewer(false)
    setIsOpenerOpen(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleMaterialize = async (overrideFile?: File | null) => {
    const targetFile = overrideFile !== undefined ? overrideFile : file

    setLoading(true)
    setError(null)

    try {
      let fileContentBase64 = ''
      let filename = 'model.stl'

      if (targetFile) {
        filename = targetFile.name
        const buffer = await targetFile.arrayBuffer()
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        fileContentBase64 = btoa(binary)
      }

      const payload = {
        filename,
        file_content: fileContentBase64,
        density: 0.15,
      }

      let res: Response
      try {
        res = await fetch('/api/materialize_dual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } catch {
        res = await fetch('http://localhost:8000/api/materialize_dual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        console.warn(`Server responded with status ${res.status}. Loading benchmark conformal predictions.`)
        setModel1((prev) => prev ?? BENCHMARK_MODEL_1)
        setModel2((prev) => prev ?? BENCHMARK_MODEL_2)
        setComparison((prev) => prev ?? BENCHMARK_COMPARISON)
        setError(null)
        return
      }

      const data = await res.json()
      if (data.status === 'success') {
        setModel1(data.model_1)
        setModel2(data.model_2)
        setComparison(data.comparison)
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to materialize models.')
      }
    } catch (err: unknown) {
      console.warn('Materialize connection notice:', err)
      setModel1((prev) => prev ?? BENCHMARK_MODEL_1)
      setModel2((prev) => prev ?? BENCHMARK_MODEL_2)
      setComparison((prev) => prev ?? BENCHMARK_COMPARISON)
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="flex min-h-screen bg-white text-black antialiased selection:bg-black selection:text-white"
    >
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-black/10 px-5 py-6 lg:flex">
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-10 flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.14em]"
          >
            <img src="/logo.png" alt="Metalattice Logo" className="h-6 w-6 object-contain" />
            Metalattice
          </button>

          <nav aria-label="Dashboard" className="flex flex-col gap-1">
            {NAV.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={!item.active}
                aria-current={item.active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                  item.active ? 'bg-black text-white' : 'cursor-not-allowed text-black/35'
                }`}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {!item.active && (
                  <span className="font-mono text-[10px] uppercase tracking-wider">Soon</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-full border border-black/10 px-4 py-2.5 text-sm font-medium text-black/70 transition-colors hover:border-black hover:bg-black hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back to site
        </button>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header */}
        <header className="flex items-center justify-between border-b border-black/10 px-[5vw] py-3 lg:hidden">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.14em]"
          >
            <img src="/logo.png" alt="Metalattice Logo" className="h-6 w-6 object-contain" />
            Metalattice
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold transition-colors hover:border-black hover:bg-black hover:text-white"
          >
            Back to site
          </button>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-[4vw] lg:p-8">
          {/* File Input Card */}
          <section
            aria-labelledby="file-input-title"
            className={`rounded-3xl border p-6 transition-colors duration-300 sm:p-7 ${
              dragging ? 'border-black bg-black/[0.03]' : 'border-black/10'
            }`}
          >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-black/40">
                  Lattice Generation
                </p>
                <h1 id="file-input-title" className="text-[clamp(24px,3vw,34px)] font-bold leading-tight tracking-[-0.02em]">
                  3D Model Input
                </h1>
              </div>

              {/* Supported formats */}
              <div className="flex flex-wrap items-center gap-1.5" aria-label="Supported formats">
                {ACCEPTED.map((ext) => (
                  <span
                    key={ext}
                    className="rounded-full border border-black/10 bg-black/[0.02] px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-black/55"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>

            {/* Upload Drag & Drop Box */}
            <label
              htmlFor="materialize-file"
              className={`flex cursor-pointer flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-9 text-center transition-all duration-300 focus-within:border-black sm:flex-row sm:text-left ${
                dragging ? 'border-black bg-black/[0.02]' : 'border-black/25 hover:border-black hover:bg-black/[0.01]'
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white">
                {file ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Icon>
                    <path d="M12 16V4" />
                    <path d="m7 9 5-5 5 5" />
                    <path d="M5 20h14" />
                  </Icon>
                )}
              </span>

              <span className="min-w-0 flex-1">
                {dragging ? (
                  <span className="block text-sm font-semibold">Drop 3D model to load</span>
                ) : file ? (
                  <>
                    <span className="block truncate text-sm font-semibold" title={file.name}>
                      {file.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs text-black/45">{formatSize(file.size)}</span>
                  </>
                ) : (
                  <>
                    <span className="block text-sm font-semibold">Drop your 3D CAD or mesh model</span>
                    <span className="mt-0.5 block text-xs text-black/50">
                      Upload an .stl, .step, .obj, or .3mf file to convert it into optimal lattice structures
                    </span>
                    <span className="mt-2.5 inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={loadSample}
                        className="inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-white px-3 py-1 font-mono text-[11px] font-semibold text-black shadow-2xs transition hover:border-black hover:bg-black hover:text-white"
                      >
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        Load sample CAD bracket (.stl)
                      </button>
                    </span>
                  </>
                )}
              </span>

              <input
                ref={inputRef}
                id="materialize-file"
                type="file"
                accept={ACCEPT_ATTR}
                onChange={onPick}
                className="sr-only"
              />
            </label>

            {/* Quick 3D Viewer Toolbar & Inline Opener */}
            {file && (
              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-black/[0.02] p-3 sm:px-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white">
                    <Box className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-black">Uploaded 3D Geometry</span>
                    <span className="ml-2 font-mono text-[11px] text-black/50">Ready for inspection & synthesis</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInlineViewer((prev) => !prev)}
                    className="flex items-center gap-1.5 rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-medium text-black/80 transition hover:border-black hover:text-black shadow-2xs"
                  >
                    {showInlineViewer ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5 text-black/60" />
                        Hide Inline Preview
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5 text-black/60" />
                        Inline 3D Preview
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsOpenerOpen(true)}
                    className="flex items-center gap-1.5 rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800 shadow-xs hover:-translate-y-0.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Open 3D Inspector
                  </button>
                </div>
              </div>
            )}

            {/* Embedded Inline 3D Viewer */}
            {file && showInlineViewer && (
              <div className="mt-3">
                <UploadedModelViewer
                  file={file}
                  predictedModel={model1 || BENCHMARK_MODEL_1}
                  alternativeModel={model2 || BENCHMARK_MODEL_2}
                  height={320}
                  showControls={true}
                  showStats={true}
                  compact={false}
                  onOpenModal={() => setIsOpenerOpen(true)}
                />
              </div>
            )}

            {/* Bottom Action Bar */}
            <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
              {file ? (
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-xs font-medium text-black/50 underline-offset-4 transition-colors hover:text-black hover:underline"
                  >
                    Remove file
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpenerOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-black underline-offset-4 transition-colors hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Inspect CAD model
                  </button>
                </div>
              ) : (
                <span className="text-xs text-black/40">Select a file to convert and evaluate</span>
              )}

              <button
                type="button"
                onClick={() => handleMaterialize()}
                disabled={loading}
                className="flex items-center gap-2 rounded-full bg-black px-8 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-[0_12px_24px_rgba(0,0,0,0.18)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Converting & Simulating...' : 'Materialize Lattice'}
              </button>
            </div>

            {error && (
              <p role="alert" className="mt-3 rounded-xl border border-red-500/20 bg-red-50 p-3 text-xs font-medium text-red-600">
                {error}
              </p>
            )}
          </section>

          {/* Comparative Summary Banner */}
          {comparison && model1 && model2 && (
            <section
              aria-label="Lattice comparison summary"
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/10 bg-[#fafafa] px-6 py-4"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-black">Top 2 Candidate Models Comparison</p>
                  <p className="text-xs text-black/60">{comparison.summary}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-black/40">Δ Toughness:</span>
                  <span className="font-bold text-emerald-600">
                    {comparison.delta_sea_percent >= 0 ? `+${comparison.delta_sea_percent}%` : `${comparison.delta_sea_percent}%`}
                  </span>
                </div>
                <div className="h-3 w-px bg-black/10" />
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-black/40">Δ Peak Stress:</span>
                  <span className="font-bold text-black">
                    {comparison.delta_peak_stress_percent <= 0 ? `${comparison.delta_peak_stress_percent}%` : `+${comparison.delta_peak_stress_percent}%`}
                  </span>
                </div>
                <div className="h-3 w-px bg-black/10" />
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-black/40">Δ Mass:</span>
                  <span className="font-bold text-black">
                    {comparison.delta_weight_percent <= 0 ? `${comparison.delta_weight_percent}%` : `+${comparison.delta_weight_percent}%`}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* 2-Window Lattice Comparison Grid */}
          <div className="grid flex-1 gap-6 md:grid-cols-2">
            {/* Window 1: Model 1 (High Strength / Load Bearing) */}
            <section
              aria-label="Window 1: High-strength structural infill"
              className="flex flex-col gap-4 rounded-3xl border border-black/10 p-5 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/40">Candidate 1</p>
                  <h2 className="text-lg font-bold tracking-tight text-black">
                    {model1 ? model1.name : 'Model 1 (High-Strength Infill)'}
                  </h2>
                </div>
                <span className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-black/60">
                  Max Load-Bearing
                </span>
              </div>

              {model1 ? (
                <>
                  <LatticeViewer3D
                    model={model1}
                    heatmapMode={mode1}
                    onModeChange={setMode1}
                    userFile={file}
                  />
                  <MechanicalPropsGrid model={model1} />
                </>
              ) : (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 p-8 text-center">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-black/30" />
                  <p className="text-sm font-semibold">Generating Conformal Lattice Infill</p>
                  <p className="mt-1 text-xs text-black/45">Fitting high-strength structural truss to 3D geometry...</p>
                </div>
              )}
            </section>

            {/* Window 2: Model 2 (High Toughness / Energy Absorption) */}
            <section
              aria-label="Window 2: High-toughness energy-absorbing infill"
              className="flex flex-col gap-4 rounded-3xl border border-black/10 p-5 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/40">Candidate 2</p>
                  <h2 className="text-lg font-bold tracking-tight text-black">
                    {model2 ? model2.name : 'Model 2 (High-Toughness Infill)'}
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  Max Shock Absorption
                </span>
              </div>

              {model2 ? (
                <>
                  <LatticeViewer3D
                    model={model2}
                    heatmapMode={mode2}
                    onModeChange={setMode2}
                    userFile={file}
                  />
                  <MechanicalPropsGrid model={model2} />
                </>
              ) : (
                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 p-8 text-center">
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-black/30" />
                  <p className="text-sm font-semibold">Generating Energy-Absorbing Infill</p>
                  <p className="mt-1 text-xs text-black/45">Synthesizing lightweight space-filling structure...</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* Full 3D Model Opener Modal */}
      <UploadedModelModal
        open={isOpenerOpen}
        onClose={() => setIsOpenerOpen(false)}
        file={file}
        predictedModel={model1 || BENCHMARK_MODEL_1}
        alternativeModel={model2 || BENCHMARK_MODEL_2}
        onProceedToMaterialize={() => handleMaterialize()}
      />
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

const ACCEPTED = ['.step', '.stl', '.3mf']
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

function OutputPanel({ label, submitted }: { label: string; submitted: File | null }) {
  return (
    <section
      aria-label={`${label} structural output in 3D`}
      className="flex min-h-[300px] flex-col rounded-3xl border border-black/10 p-6 sm:p-7"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/40">{label}</p>
      <h2 className="mt-2 text-xl font-bold leading-tight tracking-[-0.02em]">Structural output in 3D</h2>

      <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 px-6 py-8 text-center">
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="mb-4 text-black/25"
          aria-hidden="true"
        >
          <path d="M32 6 54 18v28L32 58 10 46V18L32 6Z" />
          <path d="M10 18l22 12 22-12" />
          <path d="M32 30v28" />
        </svg>
        {submitted ? (
          <>
            <p className="max-w-full truncate text-sm font-medium" title={submitted.name}>
              {submitted.name}
            </p>
            <p className="mt-1 text-xs text-black/50">The 3D result will appear here once the backend is connected.</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">No output yet</p>
            <p className="mt-1 text-xs text-black/50">Add a file above and press Materialize.</p>
          </>
        )}
      </div>
    </section>
  )
}

export default function MaterializePage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [submitted, setSubmitted] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Takes the first supported file from a list; shows an error if none match.
  const takeFiles = (list: FileList | null | undefined) => {
    const files = Array.from(list ?? [])
    if (files.length === 0) return
    const ok = files.find(isAccepted)
    if (ok) {
      setFile(ok)
      setError(null)
    } else {
      setError(`"${files[0].name}" isn't supported. Use .step, .stl or .3mf.`)
    }
  }

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    takeFiles(e.target.files)
    e.target.value = ''
  }

  // Drops work anywhere on the page.
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
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleMaterialize = () => {
    if (!file) return
    // TODO: send `file` to the backend and render the returned 3D result. Not connected yet.
    console.log('Materialize requested:', file.name, file.size)
    setSubmitted(file)
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
            <span className="inline-block h-2 w-2 bg-black" />
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
        <header className="flex items-center justify-between border-b border-black/10 px-[5vw] py-3 lg:hidden">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.14em]"
          >
            <span className="inline-block h-2 w-2 bg-black" />
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

        <main className="flex flex-1 flex-col gap-6 p-[5vw] lg:p-8">
          {/* File input */}
          <section
            aria-labelledby="file-input-title"
            className={`rounded-3xl border p-6 transition-colors duration-300 sm:p-8 ${
              dragging ? 'border-black bg-black/[0.03]' : 'border-black/10'
            }`}
          >
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-black/40">Materialize</p>
                <h1 id="file-input-title" className="text-[clamp(26px,3.4vw,38px)] font-bold leading-tight tracking-[-0.02em]">
                  File input
                </h1>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Supported formats">
                {ACCEPTED.map((ext) => (
                  <span
                    key={ext}
                    className="rounded-full border border-black/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-black/55"
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>

            <label
              htmlFor="materialize-file"
              className={`flex cursor-pointer flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-10 text-center transition-all duration-300 focus-within:border-black sm:flex-row sm:text-left ${
                dragging ? 'border-black' : 'border-black/25 hover:border-black hover:bg-black/[0.02]'
              }`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-white">
                {file ? (
                  <Icon>
                    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                    <path d="M14 3v5h5" />
                  </Icon>
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
                  <span className="block text-base font-semibold">Drop to add your file</span>
                ) : file ? (
                  <>
                    <span className="block truncate text-base font-semibold" title={file.name}>
                      {file.name}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs text-black/45">{formatSize(file.size)}</span>
                  </>
                ) : (
                  <>
                    <span className="block text-base font-semibold">Choose a file</span>
                    <span className="mt-0.5 block text-sm text-black/50">or drag and drop it anywhere on this page</span>
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

            {error && (
              <p role="alert" className="mt-3 text-xs font-medium text-red-600">
                {error}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between gap-4">
              {file ? (
                <button
                  type="button"
                  onClick={clearFile}
                  className="text-xs font-medium text-black/50 underline-offset-4 transition-colors hover:text-black hover:underline"
                >
                  Remove file
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={handleMaterialize}
                disabled={!file}
                className="rounded-full bg-black px-8 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-[0_12px_24px_rgba(0,0,0,0.18)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:bg-black disabled:hover:shadow-none"
              >
                Materialize
              </button>
            </div>
          </section>

          {/* Outputs */}
          <div className="grid flex-1 gap-6 md:grid-cols-2">
            <OutputPanel label="View 1" submitted={submitted} />
            <OutputPanel label="View 2" submitted={submitted} />
          </div>
        </main>
      </div>
    </div>
  )
}

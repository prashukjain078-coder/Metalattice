import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

type UploadItem = { id: number; name: string; size: number; at: Date }

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
  const nextId = useRef(1)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [items, setItems] = useState<UploadItem[]>([])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null)
  }

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) setFile(dropped)
  }

  const clearFile = () => {
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleUpload = () => {
    if (!file) return
    // TODO: send `file` to the backend. Not connected yet.
    console.log('Upload requested:', file.name, file.size)
    setItems((prev) => [
      { id: nextId.current++, name: file.name, size: file.size, at: new Date() },
      ...prev,
    ])
    clearFile()
  }

  const totalBytes = items.reduce((sum, i) => sum + i.size, 0)

  const stats = [
    { label: 'Files this session', value: String(items.length) },
    { label: 'Total size', value: items.length ? formatSize(totalBytes) : '—' },
    { label: 'Last file', value: items.length ? formatTime(items[0].at) : '—' },
    { label: 'Backend', value: 'Not connected' },
  ]

  return (
    <div className="flex min-h-screen bg-white text-black antialiased selection:bg-black selection:text-white">
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
                  item.active
                    ? 'bg-black text-white'
                    : 'cursor-not-allowed text-black/35'
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
        <header className="flex items-center justify-between border-b border-black/10 px-[5vw] py-4 lg:px-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.14em] lg:hidden"
            >
              <span className="inline-block h-2 w-2 bg-black" />
              Metalattice
            </button>
            <p className="hidden font-mono text-xs uppercase tracking-[0.2em] text-black/40 lg:block">
              Dashboard <span className="mx-1.5 text-black/20">/</span>
              <span className="text-black">Materialize</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold transition-colors hover:border-black hover:bg-black hover:text-white lg:hidden"
          >
            Back to site
          </button>
        </header>

        <main className="flex-1 px-[5vw] py-8 lg:px-10">
          <div className="mb-8">
            <h1 className="text-[clamp(26px,3.4vw,36px)] font-bold leading-tight tracking-[-0.02em]">
              Materialize
            </h1>
            <p className="mt-1.5 text-sm text-black/55">
              Upload a file to turn it into a lattice structure.
            </p>
          </div>

          {/* Stats */}
          <section aria-label="Session stats" className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-black/10 p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-black/40">{s.label}</p>
                <p className="mt-2 truncate text-xl font-semibold tracking-tight">{s.value}</p>
              </div>
            ))}
          </section>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Upload panel */}
            <section
              aria-labelledby="materialize-title"
              className="rounded-3xl border border-black/10 bg-white p-7 shadow-[0_24px_60px_rgba(0,0,0,0.06)] sm:p-9 lg:col-span-3"
            >
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-black/40">New upload</p>
              <h2 id="materialize-title" className="mb-2 text-[clamp(22px,3vw,30px)] font-bold leading-tight tracking-[-0.02em]">
                Upload your file
              </h2>
              <p className="mb-7 text-sm leading-relaxed text-black/60">Select a file to get started.</p>

              <label
                htmlFor="materialize-file"
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed px-5 py-8 transition-all duration-300 focus-within:border-black ${
                  dragging ? 'border-black bg-black/[0.04]' : 'border-black/25 hover:border-black hover:bg-black/[0.02]'
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white">
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
                  {file ? (
                    <>
                      <span className="block truncate text-sm font-semibold" title={file.name}>
                        {file.name}
                      </span>
                      <span className="mt-0.5 block font-mono text-xs text-black/45">{formatSize(file.size)}</span>
                    </>
                  ) : (
                    <>
                      <span className="block text-sm font-semibold">Choose a file</span>
                      <span className="mt-0.5 block text-xs text-black/50">or drag and drop it here</span>
                    </>
                  )}
                </span>

                <input
                  ref={inputRef}
                  id="materialize-file"
                  type="file"
                  onChange={onPick}
                  className="sr-only"
                />
              </label>

              {file && (
                <button
                  type="button"
                  onClick={clearFile}
                  className="mt-3 text-xs font-medium text-black/50 underline-offset-4 transition-colors hover:text-black hover:underline"
                >
                  Remove file
                </button>
              )}

              <button
                type="button"
                onClick={handleUpload}
                disabled={!file}
                className="mt-6 w-full rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-[0_12px_24px_rgba(0,0,0,0.18)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:bg-black disabled:hover:shadow-none"
              >
                Upload
              </button>
            </section>

            {/* Recent uploads */}
            <section
              aria-labelledby="recent-title"
              className="flex flex-col rounded-3xl border border-black/10 p-7 lg:col-span-2"
            >
              <div className="mb-5 flex items-baseline justify-between">
                <h2 id="recent-title" className="text-base font-semibold tracking-tight">
                  Recent uploads
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-black/35">This session</span>
              </div>

              {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 px-6 py-12 text-center">
                  <p className="text-sm font-medium">Nothing here yet</p>
                  <p className="mt-1 text-xs text-black/50">Files you add will show up in this list.</p>
                </div>
              ) : (
                <ul className="divide-y divide-black/10">
                  {items.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 text-black/60">
                        <Icon>
                          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                          <path d="M14 3v5h5" />
                        </Icon>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium" title={i.name}>
                          {i.name}
                        </span>
                        <span className="block font-mono text-xs text-black/45">
                          {formatSize(i.size)} · {formatTime(i.at)}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full border border-black/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-black/50">
                        Not sent
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

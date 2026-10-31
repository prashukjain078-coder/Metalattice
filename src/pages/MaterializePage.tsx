import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MaterializePage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)

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
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-black antialiased selection:bg-black selection:text-white">
      <div className="pointer-events-none fixed inset-0 z-0 mx-auto max-w-[88vw] border-x border-black/[0.04]" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-black/[0.06] bg-white/60 px-[6vw] py-5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.14em]"
        >
          <span className="inline-block h-2 w-2 bg-black" />
          Metalattice
        </button>
      </header>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-28">
        <section
          role="dialog"
          aria-labelledby="materialize-title"
          className="relative w-full max-w-lg rounded-3xl border border-black/10 bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.08)] sm:p-10"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => navigate('/')}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black/60 transition-colors hover:border-black hover:bg-black hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-black/40">Materialize</p>
          <h1 id="materialize-title" className="mb-2 text-[clamp(28px,4vw,38px)] font-bold leading-tight tracking-[-0.02em]">
            Upload your file
          </h1>
          <p className="mb-7 text-sm leading-relaxed text-black/60">Select a file to get started.</p>

          <label
            htmlFor="materialize-file"
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed px-5 py-6 transition-all duration-300 focus-within:border-black ${
              dragging ? 'border-black bg-black/[0.04]' : 'border-black/25 hover:border-black hover:bg-black/[0.02]'
            }`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white">
              {file ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                  <path d="M14 3v5h5" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 16V4" />
                  <path d="m7 9 5-5 5 5" />
                  <path d="M5 20h14" />
                </svg>
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
      </main>
    </div>
  )
}

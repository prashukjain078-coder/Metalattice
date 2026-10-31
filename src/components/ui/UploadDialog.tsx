import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  onUpload: (file: File) => void
}

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

const svgProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export default function UploadDialog({ open, onClose, onUpload }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Esc to close, lock page scroll, move focus into the dialog while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

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

  const onOverlayDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!hasFiles(e)) return
    e.preventDefault()
    setDragging(true)
  }

  const onOverlayDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false)
  }

  const onOverlayDrop = (e: DragEvent<HTMLDivElement>) => {
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

  const handleUpload = () => {
    if (!file) return
    // TODO: send `file` to the backend. Not connected yet.
    console.log('Upload requested:', file.name, file.size)
    onUpload(file)
    onClose()
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-6 py-10 backdrop-blur-sm transition-colors ${
        dragging ? 'bg-black/55' : 'bg-black/40'
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onDragOver={onOverlayDragOver}
      onDragLeave={onOverlayDragLeave}
      onDrop={onOverlayDrop}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-dialog-title"
        className="relative max-h-full w-full max-w-lg overflow-y-auto rounded-3xl border border-black/10 bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.18)] outline-none sm:p-10"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black/60 transition-colors hover:border-black hover:bg-black hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-black/40">Materialize</p>
        <h2 id="upload-dialog-title" className="mb-2 text-[clamp(26px,4vw,34px)] font-bold leading-tight tracking-[-0.02em]">
          Upload your file
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-black/60">
          Choose a file or drop it anywhere on this window.
        </p>

        <div className="mb-6 flex flex-wrap gap-2" aria-label="Supported formats">
          {ACCEPTED.map((ext) => (
            <span
              key={ext}
              className="rounded-full border border-black/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-black/55"
            >
              {ext}
            </span>
          ))}
        </div>

        <label
          htmlFor="upload-dialog-file"
          className={`flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed px-5 py-7 transition-all duration-300 focus-within:border-black ${
            dragging ? 'border-black bg-black/[0.04]' : 'border-black/25 hover:border-black hover:bg-black/[0.02]'
          }`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white">
            {file ? (
              <svg {...svgProps}>
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                <path d="M14 3v5h5" />
              </svg>
            ) : (
              <svg {...svgProps}>
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M5 20h14" />
              </svg>
            )}
          </span>

          <span className="min-w-0 flex-1">
            {dragging ? (
              <span className="block text-sm font-semibold">Drop to add your file</span>
            ) : file ? (
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
            id="upload-dialog-file"
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

        {file && (
          <button
            type="button"
            onClick={clearFile}
            className="mt-3 block text-xs font-medium text-black/50 underline-offset-4 transition-colors hover:text-black hover:underline"
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
      </div>
    </div>
  )
}

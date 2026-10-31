import type { ReactNode } from 'react'

const css = `
@property --mlb-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.mlb-btn {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.95rem 1.9rem;
  border: 1px solid #000;
  border-radius: 9999px;
  background: #000;
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease, color 0.3s ease;
}
.mlb-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  padding: 1.5px;
  border-radius: inherit;
  background: conic-gradient(from var(--mlb-angle),
    rgba(255,255,255,0) 0%, rgba(255,255,255,0) 55%,
    rgba(255,255,255,0.95) 82%, rgba(255,255,255,0) 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: mlb-spin 3.2s linear infinite;
}
.mlb-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%);
  transform: translateX(-110%);
  transition: transform 0.8s ease;
}
.mlb-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.18);
}
.mlb-btn:hover::after { transform: translateX(110%); }
.mlb-btn:active { transform: translateY(0) scale(0.98); }
.mlb-btn:focus-visible { outline: 2px solid #000; outline-offset: 3px; }
.mlb-arrow { transition: transform 0.25s ease; }
.mlb-btn:hover .mlb-arrow { transform: translateX(4px); }

.mlb-lg { padding: 1.35rem 3.25rem; font-size: 1.125rem; gap: 0.85rem; }
.mlb-lg .mlb-arrow { width: 20px; height: 20px; }

.mlb-ghost { background: #fff; color: #000; }
.mlb-ghost::before, .mlb-ghost::after { display: none; }
.mlb-ghost:hover { background: #000; color: #fff; }

@keyframes mlb-spin { to { --mlb-angle: 360deg; } }
@media (prefers-reduced-motion: reduce) {
  .mlb-btn::before { animation: none; }
  .mlb-btn, .mlb-btn::after, .mlb-arrow { transition: none; }
}
`

function Arrow() {
  return (
    <svg
      className="mlb-arrow"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

interface Props {
  children: ReactNode
  href?: string
  target?: string
  onClick?: () => void
  variant?: 'primary' | 'ghost'
  arrow?: boolean
  className?: string
}

export function GlowButton({ children, href, target, onClick, variant = 'primary', arrow = true, className = '' }: Props) {
  const cls = ['mlb-btn', variant === 'ghost' ? 'mlb-ghost' : '', className].join(' ').trim()
  const inner = (
    <>
      <span>{children}</span>
      {arrow && <Arrow />}
    </>
  )

  return (
    <>
      <style>{css}</style>
      {href ? (
        <a href={href} target={target} rel={target === '_blank' ? 'noreferrer' : undefined} className={cls}>
          {inner}
        </a>
      ) : (
        <button type="button" onClick={onClick} className={cls}>
          {inner}
        </button>
      )}
    </>
  )
}

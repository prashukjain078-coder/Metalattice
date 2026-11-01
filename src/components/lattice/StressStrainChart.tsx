import { useState } from 'react'

interface Props {
  curve: {
    strain: number[]
    stress: number[]
    upper_bound?: number[] | null
    lower_bound?: number[] | null
  }
  peakStressMpa: number
}

export default function StressStrainChart({ curve, peakStressMpa }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const strains = curve.strain || []
  const rawStresses = curve.stress || []
  const n = Math.min(strains.length, rawStresses.length)

  if (n < 2) return null

  // Normalize stresses to physical MPa scale
  const rawMax = Math.max(...rawStresses, 1e-6)
  const stressesMpa = rawStresses.map((s) => (s / rawMax) * peakStressMpa)

  // Chart dimensions
  const width = 460
  const height = 110
  const padL = 36
  const padR = 12
  const padT = 10
  const padB = 22

  const plotW = width - padL - padR
  const plotH = height - padT - padB

  const maxStrain = Math.max(...strains, 0.3)
  const maxStress = Math.max(...stressesMpa, 1.0) * 1.08

  const getX = (strainVal: number) => padL + (strainVal / maxStrain) * plotW
  const getY = (stressVal: number) => padT + plotH - (stressVal / maxStress) * plotH

  // Generate SVG path for line
  const points = strains.map((s, i) => `${getX(s)},${getY(stressesMpa[i])}`).join(' ')
  const areaPoints = `${points} ${getX(strains[n - 1])},${getY(0)} ${getX(strains[0])},${getY(0)}`

  const activeIdx = hoverIdx !== null && hoverIdx >= 0 && hoverIdx < n ? hoverIdx : null

  return (
    <div className="rounded-xl border border-black/10 bg-white p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wider text-black/45">
          Stress-Strain Curve σ(ε)
        </p>
        {activeIdx !== null ? (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span>ε: {(strains[activeIdx] * 100).toFixed(1)}%</span>
            <span className="text-black/30">|</span>
            <span className="font-semibold text-black">{stressesMpa[activeIdx].toFixed(1)} MPa</span>
          </div>
        ) : (
          <span className="font-mono text-[10px] text-black/40">Hover curve to inspect</span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full select-none overflow-visible"
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Subtle grid lines */}
        {[0.25, 0.5, 0.75, 1.0].map((frac) => (
          <line
            key={frac}
            x1={padL}
            y1={padT + plotH * (1 - frac)}
            x2={padL + plotW}
            y2={padT + plotH * (1 - frac)}
            stroke="#f0f0f0"
            strokeDasharray="2 2"
          />
        ))}

        {/* Shaded Area Under Curve (Strain Energy Absorption) */}
        <polygon points={areaPoints} fill="currentColor" className="text-black/[0.04]" />

        {/* Curve Line */}
        <polyline
          points={points}
          fill="none"
          stroke="black"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Axes */}
        <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#d1d5db" />
        <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#d1d5db" />

        {/* Axis Labels */}
        <text x={padL} y={height - 5} fontSize="9" fill="#9ca3af" fontFamily="monospace">
          0%
        </text>
        <text x={padL + plotW / 2} y={height - 5} fontSize="9" fill="#9ca3af" textAnchor="middle" fontFamily="monospace">
          15%
        </text>
        <text x={padL + plotW} y={height - 5} fontSize="9" fill="#9ca3af" textAnchor="end" fontFamily="monospace">
          30% ε
        </text>
        <text x={padL - 4} y={padT + 8} fontSize="9" fill="#9ca3af" textAnchor="end" fontFamily="monospace">
          {Math.round(maxStress)}
        </text>

        {/* Interactive Pointer Overlay */}
        {strains.map((s, idx) => (
          <rect
            key={idx}
            x={getX(s) - plotW / (n * 2)}
            y={padT}
            width={Math.max(plotW / n, 2)}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(idx)}
            className="cursor-crosshair"
          />
        ))}

        {/* Active Hover Point Marker */}
        {activeIdx !== null && (
          <g>
            <line
              x1={getX(strains[activeIdx])}
              y1={padT}
              x2={getX(strains[activeIdx])}
              y2={padT + plotH}
              stroke="#ef4444"
              strokeDasharray="2 2"
            />
            <circle
              cx={getX(strains[activeIdx])}
              cy={getY(stressesMpa[activeIdx])}
              r="4"
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
    </div>
  )
}


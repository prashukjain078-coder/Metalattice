interface Props {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (v: number) => void
  digits?: number
}

export function SliderInput({ label, value, min, max, step = 0.01, unit = '', onChange, digits = 2 }: Props) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value.toFixed(digits)}
            min={min}
            max={max}
            step={step}
            onChange={e => onChange(parseFloat(e.target.value) || min)}
            className="w-16 bg-[#17212D] border border-[#263342] text-[#F4F7FB] text-xs font-mono text-right rounded px-1.5 py-0.5 focus:outline-none focus:border-[#00E5FF40]"
          />
          {unit && <span className="text-[#98A6B8] text-xs">{unit}</span>}
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ background: `linear-gradient(to right, #00E5FF ${pct}%, #263342 ${pct}%)` }}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
        />
      </div>
    </div>
  )
}

interface NumericProps {
  label: string
  value: number | null
  unit?: string
  onChange: (v: number | null) => void
  placeholder?: string
  min?: number
  max?: number
  digits?: number
}

export function NumericInput({ label, value, unit, onChange, placeholder = '—', min, max, digits = 2 }: NumericProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="label flex-1">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value ?? ''}
          placeholder={placeholder}
          min={min}
          max={max}
          onChange={e => {
            const v = e.target.value === '' ? null : parseFloat(e.target.value)
            onChange(v)
          }}
          className="w-20 bg-[#17212D] border border-[#263342] text-[#F4F7FB] text-xs font-mono text-right rounded px-2 py-1 focus:outline-none focus:border-[#00E5FF40] placeholder-[#4a5568]"
        />
        {unit && <span className="text-[#98A6B8] text-xs w-8">{unit}</span>}
      </div>
    </div>
  )
}


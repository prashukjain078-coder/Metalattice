import { ReactNode, useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  title: string
  icon?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}

export function CollapsibleSection({ title, icon, children, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[#263342]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#17212D] transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-[#00E5FF]">{icon}</span>}
          <span className="text-xs font-semibold uppercase tracking-wider text-[#98A6B8]">{title}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-[#98A6B8] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="px-3 pb-3 pt-1 flex flex-col gap-3">{children}</div>}
    </div>
  )
}

interface TabsProps {
  tabs: string[]
  active: string
  onChange: (t: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-[#263342]">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            active === tab
              ? 'text-[#00E5FF] border-b-2 border-[#00E5FF] -mb-px'
              : 'text-[#98A6B8] hover:text-[#F4F7FB]'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

interface BadgeProps {
  label: string
  color?: 'cyan' | 'violet' | 'success' | 'warning' | 'danger' | 'muted'
}

export function Badge({ label, color = 'cyan' }: BadgeProps) {
  const map = {
    cyan: 'bg-[#00E5FF15] text-[#00E5FF] border-[#00E5FF30]',
    violet: 'bg-[#8B5CF615] text-[#8B5CF6] border-[#8B5CF630]',
    success: 'bg-[#37D67A15] text-[#37D67A] border-[#37D67A30]',
    warning: 'bg-[#FFB84D15] text-[#FFB84D] border-[#FFB84D30]',
    danger: 'bg-[#FF5D7315] text-[#FF5D73] border-[#FF5D7330]',
    muted: 'bg-[#17212D] text-[#98A6B8] border-[#263342]',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider border ${map[color]}`}>
      {label}
    </span>
  )
}

interface MetricProps {
  label: string
  value: string
  unit?: string
  source?: string
  highlight?: boolean
}

export function MetricRow({ label, value, unit, source, highlight }: MetricProps) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#1a2535] last:border-0">
      <span className="text-[11px] text-[#98A6B8]">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-mono text-xs font-medium ${highlight ? 'text-[#00E5FF]' : 'text-[#F4F7FB]'}`}>
          {value}{unit && <span className="text-[#98A6B8] ml-1">{unit}</span>}
        </span>
        {source && (
          <span className="text-[9px] text-[#4a5568] border border-[#263342] rounded px-1 py-0.5">{source}</span>
        )}
      </div>
    </div>
  )
}

interface SelectProps {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}

export function SelectInput({ label, value, options, onChange }: SelectProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="label flex-1">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-[#17212D] border border-[#263342] text-[#F4F7FB] text-xs rounded px-2 py-1 focus:outline-none focus:border-[#00E5FF40] cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}


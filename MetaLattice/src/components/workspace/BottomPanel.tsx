import { useState } from 'react'
import { useAppStore } from '../../store'
import { ChevronUp, ChevronDown, CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react'
import { formatDuration } from '../../utils/format'

export function BottomPanel() {
  const [collapsed, setCollapsed] = useState(false)
  const { workflowSteps } = useAppStore()

  return (
    <div className="flex-none bg-[#0D121A] border-t border-[#263342] text-[#F4F7FB] transition-all duration-200 z-30">
      {/* Header bar */}
      <div className="h-8 px-4 flex items-center justify-between border-b border-[#263342] bg-[#111823]">
        <div className="flex items-center gap-2">
          <span className="label text-[10px] tracking-wider text-[#98A6B8]">Workflow Pipeline & Execution Trace</span>
          <span className="w-1 h-1 rounded-full bg-[#00E5FF]" />
          <span className="text-[10px] font-mono text-[#00E5FF]">
            {workflowSteps.filter((s) => s.status === 'complete').length} / {workflowSteps.length} Complete
          </span>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-[#98A6B8] hover:text-[#F4F7FB] p-1 rounded transition-colors"
          title={collapsed ? 'Expand Pipeline' : 'Collapse Pipeline'}
        >
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Steps Row */}
      {!collapsed && (
        <div className="px-4 py-2.5 overflow-x-auto flex items-center gap-3">
          {workflowSteps.map((step, index) => {
            const isComplete = step.status === 'complete'
            const isActive = step.status === 'active'
            const isError = step.status === 'error'

            return (
              <div key={step.id} className="flex items-center gap-3 shrink-0">
                <div
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-[#00E5FF10] border-[#00E5FF50] text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                      : isComplete
                      ? 'bg-[#17212D] border-[#37D67A40] text-[#F4F7FB]'
                      : isError
                      ? 'bg-[#FF5D7310] border-[#FF5D7340] text-[#FF5D73]'
                      : 'bg-[#111823] border-[#263342] text-[#98A6B8] opacity-60'
                  }`}
                >
                  <div className="shrink-0">
                    {isComplete ? (
                      <CheckCircle2 size={13} className="text-[#37D67A]" />
                    ) : isActive ? (
                      <div className="w-3 h-3 rounded-full border-2 border-[#00E5FF] border-t-transparent animate-spin" />
                    ) : isError ? (
                      <AlertCircle size={13} className="text-[#FF5D73]" />
                    ) : (
                      <Circle size={13} />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-[#98A6B8]">{index + 1}.</span>
                      <span className="text-xs font-semibold leading-none">{step.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-[#98A6B8] mt-0.5">
                      <span>{step.description}</span>
                      {step.durationMs && (
                        <span className="flex items-center gap-0.5 font-mono text-[#00E5FF]">
                          <Clock size={9} />
                          {formatDuration(step.durationMs)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {index < workflowSteps.length - 1 && (
                  <div className={`w-4 h-px ${isComplete ? 'bg-[#37D67A80]' : 'bg-[#263342]'}`} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


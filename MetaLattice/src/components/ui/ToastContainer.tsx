import { useAppStore } from '../../store'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const icons = {
  success: <CheckCircle size={15} className="text-[#37D67A]" />,
  error: <XCircle size={15} className="text-[#FF5D73]" />,
  warning: <AlertTriangle size={15} className="text-[#FFB84D]" />,
  info: <Info size={15} className="text-[#00E5FF]" />,
}

const borders = {
  success: 'border-l-[#37D67A]',
  error: 'border-l-[#FF5D73]',
  warning: 'border-l-[#FFB84D]',
  info: 'border-l-[#00E5FF]',
}

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore()
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border-l-2 ${borders[t.type]} bg-[#17212D] border border-[#263342] shadow-xl animate-fade-in min-w-[280px] max-w-[360px]`}
        >
          <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[#F4F7FB] text-sm font-medium">{t.title}</p>
            {t.message && <p className="text-[#98A6B8] text-xs mt-0.5 truncate">{t.message}</p>}
          </div>
          <button onClick={() => removeToast(t.id)} className="text-[#98A6B8] hover:text-[#F4F7FB] transition-colors shrink-0">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}


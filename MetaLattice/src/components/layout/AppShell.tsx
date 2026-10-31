import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '../../store'
import {
  Home, Layers, Cpu, BarChart2, GitCompare, BookOpen,
  Download, Settings, ChevronLeft, ChevronRight, Zap
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/workspace', icon: <Layers size={18} />, label: 'Workspace' },
  { path: '/generator', icon: <Zap size={18} />, label: 'AI Generator' },
  { path: '/exploration', icon: <BarChart2 size={18} />, label: 'Exploration' },
  { path: '/prediction', icon: <Cpu size={18} />, label: 'Prediction' },
  { path: '/optimization', icon: <Zap size={18} />, label: 'Optimization' },
  { path: '/comparison', icon: <GitCompare size={18} />, label: 'Comparison' },
  { path: '/library', icon: <BookOpen size={18} />, label: 'Library' },
  { path: '/export', icon: <Download size={18} />, label: 'Export' },
]

interface Props {
  children: React.ReactNode
  topBarContent?: React.ReactNode
}

export function AppShell({ children, topBarContent }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const { projects, activeProjectId } = useAppStore()
  const project = projects.find(p => p.id === activeProjectId)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#080B10]">
      {/* Top bar */}
      <div className="flex-none h-11 bg-[#0D121A] border-b border-[#263342] flex items-center gap-4 px-4 z-40">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="2" fill="#00E5FF"/>
            <circle cx="4" cy="4" r="1.5" fill="#8B5CF6"/>
            <circle cx="24" cy="4" r="1.5" fill="#8B5CF6"/>
            <circle cx="4" cy="24" r="1.5" fill="#8B5CF6"/>
            <circle cx="24" cy="24" r="1.5" fill="#8B5CF6"/>
            <line x1="14" y1="14" x2="4" y2="4" stroke="#00E5FF" strokeWidth="1" opacity="0.6"/>
            <line x1="14" y1="14" x2="24" y2="4" stroke="#00E5FF" strokeWidth="1" opacity="0.6"/>
            <line x1="14" y1="14" x2="4" y2="24" stroke="#00E5FF" strokeWidth="1" opacity="0.6"/>
            <line x1="14" y1="14" x2="24" y2="24" stroke="#00E5FF" strokeWidth="1" opacity="0.6"/>
          </svg>
          <span className="text-[#F4F7FB] font-bold text-sm">MetaLattice</span>
        </div>

        <div className="h-4 w-px bg-[#263342]" />

        {/* Project name */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[#98A6B8] text-xs truncate max-w-[200px]">
            {project?.name ?? 'No Project'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#37D67A] shrink-0" title="Saved locally" />
        </div>

        <div className="flex-1" />

        {/* Top bar custom content */}
        {topBarContent}

        <div className="h-4 w-px bg-[#263342]" />

        {/* Settings + home */}
        <button onClick={() => navigate('/settings')} className="btn-ghost p-1.5" title="Settings">
          <Settings size={15} />
        </button>
        <button onClick={() => navigate('/')} className="btn-ghost p-1.5" title="Landing">
          <Home size={15} />
        </button>

        {/* User avatar */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#8B5CF6] flex items-center justify-center text-[10px] font-bold text-[#080B10] cursor-pointer">
          ML
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left navigation rail */}
        <div className={`flex-none flex flex-col bg-[#0D121A] border-r border-[#263342] transition-all duration-200 ${collapsed ? 'w-12' : 'w-44'}`}>
          <div className="flex-1 flex flex-col py-2 gap-0.5">
            {NAV_ITEMS.map(item => {
              const active = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  title={item.label}
                  className={`flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-md transition-colors text-left ${
                    active
                      ? 'bg-[#00E5FF15] text-[#00E5FF] border border-[#00E5FF20]'
                      : 'text-[#98A6B8] hover:bg-[#17212D] hover:text-[#F4F7FB]'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!collapsed && <span className="text-xs font-medium truncate">{item.label}</span>}
                </button>
              )
            })}
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="flex items-center justify-center h-9 border-t border-[#263342] text-[#98A6B8] hover:text-[#F4F7FB] hover:bg-[#17212D] transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}


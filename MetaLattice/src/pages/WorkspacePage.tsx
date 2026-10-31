import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { LeftSidebar } from '../components/workspace/LeftSidebar'
import { RightSidebar } from '../components/workspace/RightSidebar'
import { BottomPanel } from '../components/workspace/BottomPanel'
import { ViewportToolbar } from '../components/workspace/ViewportToolbar'
import LatticeViewer from '../components/viewport/LatticeViewer'
import { useAppStore } from '../store'
import {
  Play,
  Sparkles,
  Zap,
  Cpu,
  BarChart2,
  GitCompare,
  Download,
  RotateCcw,
  RotateCw,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react'

export default function WorkspacePage() {
  const navigate = useNavigate()
  const {
    currentDesign,
    generateGeometry,
    isGenerating,
    runPrediction,
    isPredicting,
    showGrid,
    showWireframe,
    showAxes,
    showBoundingBox,
    projects,
    activeProjectId,
  } = useAppStore()

  const [leftOpen, setLeftOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)

  const activeProject = projects.find((p) => p.id === activeProjectId)

  // Top Bar shortcuts inside AppShell
  const topBarContent = (
    <div className="flex items-center gap-1.5">
      {/* Quick Stage Selectors */}
      <div className="hidden lg:flex items-center gap-1 bg-[#111823] border border-[#263342] rounded-md p-0.5 text-xs">
        <button
          onClick={generateGeometry}
          disabled={isGenerating}
          className="px-2.5 py-1 rounded text-[#00E5FF] hover:bg-[#17212D] flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Play size={11} fill="currentColor" />
          <span>Regenerate</span>
        </button>
        <button
          onClick={runPrediction}
          disabled={isPredicting}
          className="px-2.5 py-1 rounded text-[#98A6B8] hover:text-[#F4F7FB] hover:bg-[#17212D] flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Cpu size={11} />
          <span>Predict</span>
        </button>
        <button
          onClick={() => navigate('/optimization')}
          className="px-2.5 py-1 rounded text-[#98A6B8] hover:text-[#F4F7FB] hover:bg-[#17212D] flex items-center gap-1.5 transition-colors"
        >
          <Zap size={11} />
          <span>Optimize</span>
        </button>
        <button
          onClick={() => navigate('/comparison')}
          className="px-2.5 py-1 rounded text-[#98A6B8] hover:text-[#F4F7FB] hover:bg-[#17212D] flex items-center gap-1.5 transition-colors"
        >
          <GitCompare size={11} />
          <span>Compare</span>
        </button>
      </div>

      <div className="h-4 w-px bg-[#263342] mx-1" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5 text-[#98A6B8]">
        <button
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded hover:text-[#F4F7FB] hover:bg-[#17212D] transition-colors"
        >
          <RotateCcw size={13} />
        </button>
        <button
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded hover:text-[#F4F7FB] hover:bg-[#17212D] transition-colors"
        >
          <RotateCw size={13} />
        </button>
      </div>

      {/* Export shortcut */}
      <button
        onClick={() => navigate('/export')}
        className="btn-primary text-xs py-1 px-3 rounded flex items-center gap-1.5 ml-1"
      >
        <Download size={12} />
        <span className="hidden sm:inline">Export</span>
      </button>
    </div>
  )

  return (
    <AppShell topBarContent={topBarContent}>
      <div className="flex flex-col h-full overflow-hidden bg-[#080B10]">
        {/* Main 3-Column Studio Workspace */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* LEFT SIDEBAR (Design Parameters & Constraints) */}
          <div
            className={`transition-all duration-200 border-r border-[#263342] flex flex-col relative z-20 ${
              leftOpen ? 'w-80' : 'w-0'
            }`}
          >
            {leftOpen && <LeftSidebar />}
            {/* Toggle Tab */}
            <button
              onClick={() => setLeftOpen(!leftOpen)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-3.5 h-12 bg-[#17212D] border border-[#263342] border-l-0 rounded-r flex items-center justify-center text-[#98A6B8] hover:text-[#00E5FF] transition-colors z-30"
              title={leftOpen ? 'Collapse Design Panel' : 'Expand Design Panel'}
            >
              {leftOpen ? <ChevronLeft size={10} /> : <ChevronRight size={10} />}
            </button>
          </div>

          {/* CENTER VIEWPORT (3D Geometry Canvas) */}
          <div className="flex-1 relative flex flex-col min-w-0 bg-[#080B10]">
            {currentDesign ? (
              <>
                <ViewportToolbar />
                <div className="flex-1 w-full h-full">
                  <LatticeViewer
                    params={currentDesign.geometry}
                    wireframe={showWireframe}
                    showGrid={showGrid}
                    showAxes={showAxes}
                    showBoundingBox={showBoundingBox}
                    isGenerating={isGenerating}
                  />
                </div>

                {/* Bottom Viewport Status Banner */}
                <div className="absolute bottom-3 left-4 right-4 pointer-events-none flex items-center justify-between z-10 text-[11px] font-mono text-[#98A6B8]">
                  <div className="flex items-center gap-2 bg-[#111823]/80 backdrop-blur-md px-2.5 py-1 rounded border border-[#263342] pointer-events-auto">
                    <span className="text-[#00E5FF] font-semibold">{currentDesign.geometry.family.toUpperCase()}</span>
                    <span>•</span>
                    <span>{currentDesign.geometry.cellSize}mm unit</span>
                    <span>•</span>
                    <span>{(currentDesign.geometry.relativeDensity * 100).toFixed(1)}% density</span>
                  </div>

                  <div className="flex items-center gap-2 bg-[#111823]/80 backdrop-blur-md px-2.5 py-1 rounded border border-[#263342] pointer-events-auto">
                    <span className="text-[#37D67A]">GPU Native Instancing Active</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-[#111823] border border-[#263342] flex items-center justify-center text-[#00E5FF]">
                  <Sliders size={28} />
                </div>
                <div className="max-w-md">
                  <h3 className="text-lg font-bold text-[#F4F7FB] mb-1">No Active Lattice Geometry</h3>
                  <p className="text-xs text-[#98A6B8] leading-relaxed">
                    Select a design from the left panel or open the demo aerospace project to initiate parametric geometry synthesis.
                  </p>
                </div>
                <button
                  onClick={generateGeometry}
                  className="btn-primary text-xs py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <Sparkles size={14} />
                  <span>Generate Default AERO-CORE Lattice</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR (Inspection & Intelligence Panel) */}
          <div
            className={`transition-all duration-200 border-l border-[#263342] flex flex-col relative z-20 ${
              rightOpen ? 'w-84 lg:w-96' : 'w-0'
            }`}
          >
            {/* Toggle Tab */}
            <button
              onClick={() => setRightOpen(!rightOpen)}
              className="absolute -left-3 top-1/2 -translate-y-1/2 w-3.5 h-12 bg-[#17212D] border border-[#263342] border-r-0 rounded-l flex items-center justify-center text-[#98A6B8] hover:text-[#00E5FF] transition-colors z-30"
              title={rightOpen ? 'Collapse Metrics Panel' : 'Expand Metrics Panel'}
            >
              {rightOpen ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
            </button>
            {rightOpen && <RightSidebar />}
          </div>
        </div>

        {/* BOTTOM PANEL (Workflow Pipeline) */}
        <BottomPanel />
      </div>
    </AppShell>
  )
}


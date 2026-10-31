import { useAppStore } from '../../store'
import {
  Grid,
  Box,
  Compass,
  Eye,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
  RotateCcw,
} from 'lucide-react'

export function ViewportToolbar() {
  const {
    showGrid,
    setShowGrid,
    showWireframe,
    setShowWireframe,
    showAxes,
    setShowAxes,
    showBoundingBox,
    setShowBoundingBox,
    viewportMode,
    setViewportMode,
    currentDesign,
    updateGeometry,
  } = useAppStore()

  const resolution = currentDesign?.geometry.resolution || 'balanced'

  return (
    <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 p-1 bg-[#111823]/90 backdrop-blur-md border border-[#263342] rounded-lg shadow-xl text-[#98A6B8]">
      {/* Grid */}
      <button
        onClick={() => setShowGrid(!showGrid)}
        title={showGrid ? 'Hide Coordinate Grid' : 'Show Coordinate Grid'}
        className={`p-1.5 rounded transition-colors ${
          showGrid
            ? 'bg-[#00E5FF20] text-[#00E5FF] border border-[#00E5FF40]'
            : 'hover:text-[#F4F7FB] hover:bg-[#17212D]'
        }`}
      >
        <Grid size={15} />
      </button>

      {/* Wireframe */}
      <button
        onClick={() => setShowWireframe(!showWireframe)}
        title={showWireframe ? 'Shaded Surface' : 'Wireframe Lattice'}
        className={`p-1.5 rounded transition-colors ${
          showWireframe
            ? 'bg-[#00E5FF20] text-[#00E5FF] border border-[#00E5FF40]'
            : 'hover:text-[#F4F7FB] hover:bg-[#17212D]'
        }`}
      >
        <Layers size={15} />
      </button>

      {/* Bounding Box */}
      <button
        onClick={() => setShowBoundingBox(!showBoundingBox)}
        title={showBoundingBox ? 'Hide Bounding Box' : 'Show Bounding Box'}
        className={`p-1.5 rounded transition-colors ${
          showBoundingBox
            ? 'bg-[#00E5FF20] text-[#00E5FF] border border-[#00E5FF40]'
            : 'hover:text-[#F4F7FB] hover:bg-[#17212D]'
        }`}
      >
        <Box size={15} />
      </button>

      {/* Coordinate Axes */}
      <button
        onClick={() => setShowAxes(!showAxes)}
        title={showAxes ? 'Hide Coordinate Triad' : 'Show Coordinate Triad'}
        className={`p-1.5 rounded transition-colors ${
          showAxes
            ? 'bg-[#00E5FF20] text-[#00E5FF] border border-[#00E5FF40]'
            : 'hover:text-[#F4F7FB] hover:bg-[#17212D]'
        }`}
      >
        <Compass size={15} />
      </button>

      <div className="w-px h-4 bg-[#263342] mx-0.5" />

      {/* Perspective / Orthographic */}
      <button
        onClick={() => setViewportMode(viewportMode === 'perspective' ? 'orthographic' : 'perspective')}
        title={`Camera Mode: ${viewportMode.toUpperCase()}`}
        className="px-2 py-1 rounded text-[10px] font-mono hover:bg-[#17212D] hover:text-[#F4F7FB] transition-colors"
      >
        {viewportMode === 'perspective' ? 'PERS' : 'ORTHO'}
      </button>

      <div className="w-px h-4 bg-[#263342] mx-0.5" />

      {/* Resolution selector */}
      <div className="flex items-center gap-0.5 text-[10px] font-mono">
        {(['draft', 'balanced', 'high'] as const).map((lvl) => (
          <button
            key={lvl}
            onClick={() => updateGeometry({ resolution: lvl })}
            className={`px-1.5 py-0.5 rounded uppercase tracking-wider transition-colors ${
              resolution === lvl
                ? 'bg-[#8B5CF625] text-[#8B5CF6] border border-[#8B5CF650] font-semibold'
                : 'hover:bg-[#17212D] text-[#98A6B8]'
            }`}
          >
            {lvl[0].toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}


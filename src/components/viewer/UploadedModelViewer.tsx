import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  RotateCw,
  Maximize2,
  Loader2,
  AlertCircle,
  Download,
  Layers,
  Eye,
  EyeOff,
  Sparkles,
  Scissors,
  Sliders,
  Box,
} from 'lucide-react'
import {
  loadUploadedGeometry,
  createModelMaterial,
  type ParsedGeometryResult,
} from '../../utils/cadMeshLoader'
import {
  generateVolumetricInfill,
  type LatticeType,
  type InfillResult,
} from '../../utils/volumetricInfillGenerator'
import type { ModelData } from '../lattice/LatticeViewer3D'
import { BENCHMARK_MODEL_1, BENCHMARK_MODEL_2 } from '../../utils/benchmarkModels'

export type RenderMode = 'cutaway' | 'ghost' | 'bare' | 'wireframe' | 'solid'

interface Props {
  file: File | null
  predictedModel?: ModelData | null
  alternativeModel?: ModelData | null
  height?: number | string
  showControls?: boolean
  showStats?: boolean
  compact?: boolean
  onStatsReady?: (stats: ParsedGeometryResult) => void
  onOpenModal?: () => void
}

export default function UploadedModelViewer({
  file,
  predictedModel,
  alternativeModel,
  height = 400,
  showControls = true,
  showStats = true,
  compact = false,
  onStatsReady,
  onOpenModal,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const currentObjectRef = useRef<THREE.Object3D | null>(null)
  const latticeMeshRef = useRef<THREE.InstancedMesh | null>(null)
  const cutPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 0, -1), 0))
  const gridRef = useRef<THREE.GridHelper | null>(null)
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null)
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null)
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null)
  const animFrameIdRef = useRef<number | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [renderMode, setRenderMode] = useState<RenderMode>('cutaway')
  const [autoRotate, setAutoRotate] = useState(false)
  const [autoSway, setAutoSway] = useState(true)
  const [stats, setStats] = useState<ParsedGeometryResult | null>(null)

  // Infill parameters
  const [latticeType, setLatticeType] = useState<LatticeType>('octet')
  const [targetCells, setTargetCells] = useState(12)
  const [infillStats, setInfillStats] = useState<InfillResult['volumeStats'] | null>(null)
  const [strutCount, setStrutCount] = useState<number>(0)

  // Cut plane controls
  const [cutAxis, setCutAxis] = useState<'z' | 'x' | 'y'>('z')
  const [cutPosition, setCutPosition] = useState<number>(0)
  const [cutBounds, setCutBounds] = useState<{ min: number; max: number }>({ min: -50, max: 50 })

  // Active ML predicted candidate model
  const activeModel: ModelData = useMemo(() => {
    return predictedModel || BENCHMARK_MODEL_1
  }, [predictedModel])

  // Clear active lattice in scene
  const clearLattice = useCallback(() => {
    if (latticeMeshRef.current && sceneRef.current) {
      sceneRef.current.remove(latticeMeshRef.current)
      latticeMeshRef.current.geometry?.dispose()
      if (Array.isArray(latticeMeshRef.current.material)) {
        latticeMeshRef.current.material.forEach((m) => m.dispose())
      } else {
        latticeMeshRef.current.material?.dispose()
      }
      latticeMeshRef.current = null
    }
  }, [])

  // Builds and attaches volumetric periodic infill
  const rebuildVolumetricInfill = useCallback(
    (
      geom: THREE.BufferGeometry,
      type: LatticeType,
      cells: number,
      mode: RenderMode
    ) => {
      const scene = sceneRef.current
      if (!scene) return

      clearLattice()

      // Set clipping planes for cutaway
      const activePlanes = mode === 'cutaway' ? [cutPlaneRef.current] : []

      // Generate conformal infill
      const result = generateVolumetricInfill(geom, {
        latticeType: type,
        targetCellsAlongMaxDim: cells,
        relativeDensity: 0.16,
        clippingPlanes: activePlanes,
        materialColor: type === 'octet' ? 0x1d9e75 : type === 'kelvin' ? 0x2563eb : 0xd97706,
      })

      scene.add(result.instancedMesh)
      latticeMeshRef.current = result.instancedMesh
      setInfillStats(result.volumeStats)
      setStrutCount(result.strutCount)

      // Apply shell material and clipping
      if (currentObjectRef.current) {
        if (mode === 'bare') {
          currentObjectRef.current.visible = false
        } else {
          currentObjectRef.current.visible = true
          let mat: THREE.Material
          if (mode === 'cutaway') {
            mat = new THREE.MeshStandardMaterial({
              color: 0x9ba3ad,
              metalness: 0.2,
              roughness: 0.55,
              side: THREE.DoubleSide,
              clippingPlanes: activePlanes,
              clipShadows: true,
            })
          } else if (mode === 'ghost') {
            mat = createModelMaterial('ghost')
          } else if (mode === 'wireframe') {
            mat = createModelMaterial('wireframe')
          } else {
            mat = createModelMaterial('solid')
          }

          currentObjectRef.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh
              mesh.material = mat
            }
          })
        }
      }
    },
    [clearLattice]
  )

  // Update cut plane position and direction
  const updateCutPlane = useCallback(
    (pos: number, axis: 'z' | 'x' | 'y') => {
      setCutPosition(pos)
      const normal =
        axis === 'z'
          ? new THREE.Vector3(0, 0, -1)
          : axis === 'x'
          ? new THREE.Vector3(-1, 0, 0)
          : new THREE.Vector3(0, -1, 0)

      cutPlaneRef.current.set(normal, pos)

      if (rendererRef.current && sceneRef.current) {
        // Force renderer update
        rendererRef.current.render(sceneRef.current, cameraRef.current!)
      }
    },
    []
  )

  // Handle cut axis switch
  const handleCutAxisChange = (axis: 'z' | 'x' | 'y') => {
    setCutAxis(axis)
    if (stats) {
      const bMin = axis === 'z' ? stats.rawBounds.min[2] : axis === 'x' ? stats.rawBounds.min[0] : stats.rawBounds.min[1]
      const bMax = axis === 'z' ? stats.rawBounds.max[2] : axis === 'x' ? stats.rawBounds.max[0] : stats.rawBounds.max[1]
      setCutBounds({ min: bMin, max: bMax })
      const initialPos = bMin + (bMax - bMin) * 0.55
      updateCutPlane(initialPos, axis)
    }
  }

  // Handle mode change
  const handleModeChange = (mode: RenderMode) => {
    setRenderMode(mode)
    if (stats?.geometry) {
      rebuildVolumetricInfill(stats.geometry, latticeType, targetCells, mode)
    }
  }

  // Handle lattice type change
  const handleLatticeTypeChange = (type: LatticeType) => {
    setLatticeType(type)
    if (stats?.geometry) {
      rebuildVolumetricInfill(stats.geometry, type, targetCells, renderMode)
    }
  }

  // Export lattice infill as OBJ
  const handleExportObj = () => {
    if (!stats?.geometry) return
    const infill = generateVolumetricInfill(stats.geometry, {
      latticeType,
      targetCellsAlongMaxDim: targetCells,
    })

    let objText = `# MetaLattice Export: ${latticeType.toUpperCase()} Conformal Infill\n`
    objText += `# Model: ${file?.name || 'model.stl'}\n`
    objText += `# Struts: ${infill.struts.length}\n`

    let vIdx = 1
    infill.struts.forEach((st) => {
      objText += `v ${st.start.x.toFixed(4)} ${st.start.y.toFixed(4)} ${st.start.z.toFixed(4)}\n`
      objText += `v ${st.end.x.toFixed(4)} ${st.end.y.toFixed(4)} ${st.end.z.toFixed(4)}\n`
      objText += `l ${vIdx} ${vIdx + 1}\n`
      vIdx += 2
    })

    const blob = new Blob([objText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(file?.name || 'model').replace(/\.[^/.]+$/, '')}_infill_${latticeType}.obj`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Setup WebGL Scene
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || 400
    const resolvedHeight = typeof height === 'number' ? height : container.clientHeight || 400

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xfcfcfc)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(40, width / resolvedHeight, 0.1, 10000)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, resolvedHeight)
    renderer.localClippingEnabled = true
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 1.2
    controlsRef.current = controls

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd8d8d8, 1.2)
    scene.add(hemiLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0)
    keyLight.position.set(5, 8, 5)
    keyLight.castShadow = true
    scene.add(keyLight)
    keyLightRef.current = keyLight

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.9)
    fillLight.position.set(-5, -2, -5)
    scene.add(fillLight)
    fillLightRef.current = fillLight

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.2)
    rimLight.position.set(0, 6, -6)
    scene.add(rimLight)
    rimLightRef.current = rimLight

    // Track user drag interaction
    let isInteracting = false
    controls.addEventListener('start', () => { isInteracting = true })
    controls.addEventListener('end', () => { isInteracting = false })

    // Render loop
    let isMounted = true
    let startTime = performance.now()

    const animate = () => {
      if (!isMounted) return
      animFrameIdRef.current = requestAnimationFrame(animate)

      const elapsed = (performance.now() - startTime) * 0.001

      // Gentle auto-sway when enabled and user not interacting
      if (autoSway && !isInteracting) {
        controls.autoRotate = true
        controls.autoRotateSpeed = Math.sin(elapsed * 0.5) * 0.8
      } else {
        controls.autoRotate = autoRotate
        controls.autoRotateSpeed = 1.2
      }

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return
      const w = container.clientWidth
      const h = typeof height === 'number' ? height : container.clientHeight || 400
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    resizeObserver.observe(container)

    // Load file if provided
    if (file) {
      setLoading(true)
      setError(null)

      loadUploadedGeometry(file)
        .then((res) => {
          if (!isMounted) return
          setStats(res)
          onStatsReady?.(res)

          // Center target and frame camera
          const targetCenter = new THREE.Vector3(...res.center)
          const radius = Math.max(res.radius, 0.5)
          const distance = radius * 2.5

          controls.target.copy(targetCenter)
          camera.position.set(
            targetCenter.x + distance * 0.7,
            targetCenter.y + distance * 0.5,
            targetCenter.z + distance * 0.8
          )
          camera.near = Math.max(0.01, radius / 500)
          camera.far = Math.max(5000, radius * 100)
          camera.updateProjectionMatrix()
          controls.minDistance = Math.max(0.01, radius * 0.05)
          controls.maxDistance = Math.max(5000, radius * 50)
          controls.update()

          // Ground grid
          if (gridRef.current) {
            scene.remove(gridRef.current)
            gridRef.current.geometry.dispose()
          }
          const gridSize = Math.max(radius * 3.5, 4)
          const grid = new THREE.GridHelper(gridSize, 14, 0xd0d0d0, 0xededed)
          grid.position.set(targetCenter.x, res.rawBounds.min[1], targetCenter.z)
          scene.add(grid)
          gridRef.current = grid

          // Setup Cut Bounds
          const bMin = res.rawBounds.min[2]
          const bMax = res.rawBounds.max[2]
          setCutBounds({ min: bMin, max: bMax })
          const initialCut = bMin + (bMax - bMin) * 0.55
          setCutPosition(initialCut)
          cutPlaneRef.current.set(new THREE.Vector3(0, 0, -1), initialCut)

          // Add Model Shell
          if (currentObjectRef.current) {
            scene.remove(currentObjectRef.current)
          }
          currentObjectRef.current = res.object
          scene.add(res.object)

          // Generate Conformal Infill inside this model
          rebuildVolumetricInfill(res.geometry, latticeType, targetCells, renderMode)

          setLoading(false)
        })
        .catch((err) => {
          if (!isMounted) return
          console.error('Error loading CAD geometry:', err)
          setError(err instanceof Error ? err.message : 'Failed to parse model.')
          setLoading(false)
        })
    }

    return () => {
      isMounted = false
      resizeObserver.disconnect()
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current)
      }
      clearLattice()
      if (currentObjectRef.current && sceneRef.current) {
        sceneRef.current.remove(currentObjectRef.current)
      }
      if (gridRef.current && sceneRef.current) {
        sceneRef.current.remove(gridRef.current)
      }
      controls.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [file, height])

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-[#fafafa]">
      {/* 3D Viewport Canvas Container */}
      <div
        ref={containerRef}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
        className="w-full cursor-grab active:cursor-grabbing"
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/85 backdrop-blur-xs">
          <Loader2 className="mb-2 h-7 w-7 animate-spin text-black" />
          <p className="font-mono text-xs uppercase tracking-wider text-black/70">
            Voxelizing & Generating Conformal Lattice Core...
          </p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-white/95">
          <AlertCircle className="mb-2 h-7 w-7 text-red-500" />
          <p className="text-sm font-semibold text-black">Unable to Display Model</p>
          <p className="mt-1 max-w-sm text-xs text-black/60">{error}</p>
        </div>
      )}

      {/* Top Floating Control Bar */}
      {showControls && !loading && !error && (
        <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1.5">
          {/* Main Shading / Infill Mode */}
          <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white/90 p-1 shadow-xs backdrop-blur-md">
            <button
              type="button"
              onClick={() => handleModeChange('cutaway')}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                renderMode === 'cutaway'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-black/70 hover:text-black'
              }`}
            >
              <Scissors className="h-3 w-3 text-amber-500" />
              Cutaway Section
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('ghost')}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                renderMode === 'ghost'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              <Eye className="h-3 w-3 text-emerald-500" />
              Glass Shell
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('bare')}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                renderMode === 'bare'
                  ? 'bg-black text-white'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              Core Infill Only
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('solid')}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                renderMode === 'solid'
                  ? 'bg-black text-white'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              Solid
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('wireframe')}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                renderMode === 'wireframe'
                  ? 'bg-black text-white'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              Wireframe
            </button>
          </div>

          {/* Lattice Topology Selection */}
          <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white/95 p-1 shadow-xs backdrop-blur-md">
            <span className="ml-1 mr-0.5 font-mono text-[10px] uppercase text-black/40">Topology:</span>
            <button
              type="button"
              onClick={() => handleLatticeTypeChange('octet')}
              className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold transition-all ${
                latticeType === 'octet' ? 'bg-black text-white' : 'text-black/60 hover:text-black'
              }`}
            >
              Octet-Truss
            </button>
            <button
              type="button"
              onClick={() => handleLatticeTypeChange('bcc')}
              className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold transition-all ${
                latticeType === 'bcc' ? 'bg-black text-white' : 'text-black/60 hover:text-black'
              }`}
            >
              BCC Core
            </button>
            <button
              type="button"
              onClick={() => handleLatticeTypeChange('kelvin')}
              className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold transition-all ${
                latticeType === 'kelvin' ? 'bg-black text-white' : 'text-black/60 hover:text-black'
              }`}
            >
              Kelvin
            </button>
          </div>
        </div>
      )}

      {/* Top Right Actions */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleExportObj}
          title="Export periodic conformal infill as .obj"
          className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-3 py-1 font-mono text-[11px] font-semibold text-black shadow-xs backdrop-blur-md transition hover:bg-black hover:text-white"
        >
          <Download className="h-3 w-3" />
          Export Core (.obj)
        </button>

        <button
          type="button"
          onClick={() => setAutoSway((prev) => !prev)}
          title={autoSway ? 'Disable auto sway' : 'Enable auto sway'}
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white/90 shadow-xs backdrop-blur-md transition-colors ${
            autoSway ? 'text-black font-bold' : 'text-black/40 hover:text-black'
          }`}
        >
          <RotateCw className={`h-3.5 w-3.5 ${autoSway ? 'animate-spin [animation-duration:8s]' : ''}`} />
        </button>

        {onOpenModal && (
          <button
            type="button"
            onClick={onOpenModal}
            title="Open Full 3D Inspector"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white/90 text-black/70 shadow-xs backdrop-blur-md transition-colors hover:border-black hover:text-black"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Bottom Slicing Plane & Metrics Bar */}
      <div className="border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur-md">
        {/* Cut position slider (active in Cutaway mode) */}
        {renderMode === 'cutaway' && (
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-black">
              <Scissors className="h-3.5 w-3.5 text-amber-500" />
              <span>Section Cut:</span>
            </div>

            {/* Axis toggles */}
            <div className="flex items-center rounded-lg bg-black/[0.04] p-0.5 font-mono text-[10px]">
              {(['z', 'x', 'y'] as const).map((ax) => (
                <button
                  key={ax}
                  type="button"
                  onClick={() => handleCutAxisChange(ax)}
                  className={`rounded-md px-2 py-0.5 uppercase transition ${
                    cutAxis === ax ? 'bg-black text-white font-bold' : 'text-black/60 hover:text-black'
                  }`}
                >
                  {ax}-Plane
                </button>
              ))}
            </div>

            {/* Slider */}
            <div className="flex flex-1 items-center gap-2">
              <input
                type="range"
                min={cutBounds.min}
                max={cutBounds.max}
                step={(cutBounds.max - cutBounds.min) / 100}
                value={cutPosition}
                onChange={(e) => updateCutPlane(parseFloat(e.target.value), cutAxis)}
                className="h-1.5 w-full cursor-pointer accent-black"
              />
              <span className="font-mono text-[10px] text-black/60 w-12 text-right">
                {cutPosition.toFixed(1)} mm
              </span>
            </div>
          </div>
        )}

        {/* Material Volume & Mass Reduction Readout */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-black/70">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#9ba3ad]" />
              Solid Baseline: <strong>100% mass</strong>
            </span>
            <span className="text-black/20">|</span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-black/70">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#1D9E75]" />
              Lattice Core: <strong>{infillStats ? `${(100 - infillStats.massSavingsPercent).toFixed(0)}% mass` : '~28%'}</strong>
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700">
              {infillStats ? `−${infillStats.massSavingsPercent}% Weight Reduction` : '−72% Weight Reduction'}
            </span>
          </div>

          <div className="font-mono text-[11px] text-black/50">
            {strutCount > 0 ? (
              <span><strong>{strutCount.toLocaleString()}</strong> conformal struts inside model</span>
            ) : (
              <span>Generating struts...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RotateCw, Maximize2, Activity, Zap, Eye, EyeOff, Download } from 'lucide-react'
import { loadUploadedGeometry, createModelMaterial, type ParsedGeometryResult } from '../../utils/cadMeshLoader'
import {
  mapPredictedNodesToModelBounds,
  getHeatmapColor,
  exportPredictedLatticeToJson,
  exportPredictedLatticeToObj,
  triggerFileDownload,
} from '../../utils/latticeGenerator'
import { generateVolumetricInfill, type LatticeType } from '../../utils/volumetricInfillGenerator'

export interface ModelData {
  id: string
  name: string
  topology_type: string
  relative_density: number
  nodes: number[][]
  edges: number[][]
  n_nodes: number
  n_edges: number
  properties: {
    youngs_modulus_gpa: number
    peak_stress_mpa: number
    yield_strength_mpa: number
    energy_absorption_mj_m3: number
    density_rho_percent: number
    specific_energy_absorption_kj_kg: number
  }
  fea: {
    node_stresses_mpa: number[]
    edge_stresses_mpa: number[]
    node_strains: number[]
    edge_strains: number[]
    node_stress_scalars: number[]
    node_strain_scalars: number[]
    max_stress_mpa: number
    min_stress_mpa: number
    max_strain: number
    min_strain: number
    stress_hotspot_nodes: number[]
    strain_hotspot_nodes: number[]
    critical_hotspot: {
      node_id: number
      peak_stress_mpa: number
      peak_strain: number
      coords: number[]
    }
  }
  curve: {
    strain: number[]
    stress: number[]
    upper_bound?: number[] | null
    lower_bound?: number[] | null
  }
}

interface Props {
  model: ModelData
  heatmapMode: 'stress' | 'strain'
  onModeChange: (mode: 'stress' | 'strain') => void
  userFile?: File | null
}

export default function LatticeViewer3D({
  model,
  heatmapMode,
  onModeChange,
  userFile,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const userObjRef = useRef<THREE.Object3D | null>(null)
  const latticeGroupRef = useRef<THREE.Group | null>(null)
  const hotspotRingRef = useRef<THREE.Mesh | null>(null)
  const gridRef = useRef<THREE.GridHelper | null>(null)
  const animFrameIdRef = useRef<number | null>(null)

  const [autoRotate, setAutoRotate] = useState(true)
  const [shellMode, setShellMode] = useState<'ghost' | 'wireframe' | 'off'>('ghost')
  const [geomStats, setGeomStats] = useState<ParsedGeometryResult | null>(null)
  const [hoveredNode, setHoveredNode] = useState<{
    id: number
    stress: number
    strain: number
    x: number
    y: number
    z: number
  } | null>(null)

  // Toggle auto-rotation imperatively
  const toggleAutoRotate = () => {
    setAutoRotate((prev) => {
      const next = !prev
      if (controlsRef.current) {
        controlsRef.current.autoRotate = next
      }
      return next
    })
  }

  // Camera reset
  const handleResetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      const center = geomStats ? new THREE.Vector3(...geomStats.center) : new THREE.Vector3(0, 0, 0)
      const dist = geomStats ? geomStats.radius * 2.5 : 2.5
      cameraRef.current.position.set(center.x + dist * 0.7, center.y + dist * 0.5, center.z + dist * 0.8)
      controlsRef.current.target.copy(center)
      controlsRef.current.update()
    }
  }

  // Toggle CAD Shell mode
  const cycleShellMode = () => {
    setShellMode((prev) => {
      const next = prev === 'ghost' ? 'wireframe' : prev === 'wireframe' ? 'off' : 'ghost'
      if (userObjRef.current) {
        if (next === 'off') {
          userObjRef.current.visible = false
        } else {
          userObjRef.current.visible = true
          const mat = createModelMaterial(next === 'wireframe' ? 'wireframe' : 'ghost')
          userObjRef.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh
              mesh.material = mat
            }
          })
        }
      }
      return next
    })
  }

  // Export lattice for this model
  const handleExportLattice = (format: 'json' | 'obj') => {
    if (!geomStats) return
    const worldNodes = mapPredictedNodesToModelBounds(model.nodes, geomStats.rawBounds)
    const baseName = userFile ? userFile.name.replace(/\.[^/.]+$/, '') : 'model'

    if (format === 'json') {
      const jsonContent = exportPredictedLatticeToJson(model, userFile?.name || 'model.stl', worldNodes)
      triggerFileDownload(jsonContent, `${baseName}_infill_${model.id}.json`, 'application/json')
    } else {
      const objContent = exportPredictedLatticeToObj(model, worldNodes)
      triggerFileDownload(objContent, `${baseName}_infill_${model.id}.obj`, 'text/plain')
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight || 360

    // Setup Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xfcfcfc)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 10000)
    camera.position.set(2.4, 1.8, 2.6)
    cameraRef.current = camera

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.shadowMap.enabled = true
    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 1.2
    controls.target.set(0, 0, 0)
    controlsRef.current = controls

    // Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.95)
    scene.add(ambLight)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xd0d0d0, 0.8)
    scene.add(hemiLight)

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4)
    dirLight1.position.set(150, 250, 200)
    dirLight1.castShadow = true
    scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight2.position.set(-150, -120, -150)
    scene.add(dirLight2)

    // Raycaster for node hover info
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(-100, -100)
    const nodeSpheres: THREE.Mesh[] = []

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObjects(nodeSpheres)
      if (hits.length > 0) {
        const udata = hits[0].object.userData
        setHoveredNode({
          id: udata.nodeId,
          stress: udata.stress,
          strain: udata.strain,
          x: udata.coords[0],
          y: udata.coords[1],
          z: udata.coords[2],
        })
      } else {
        setHoveredNode(null)
      }
    }
    renderer.domElement.addEventListener('mousemove', onPointerMove)

    let isMounted = true

    // Render loop
    const startTime = performance.now()
    const animate = () => {
      if (!isMounted) return
      animFrameIdRef.current = requestAnimationFrame(animate)
      const elapsedTime = (performance.now() - startTime) * 0.001
      controls.update()

      if (hotspotRingRef.current) {
        const s = 1.0 + 0.25 * Math.sin(elapsedTime * 4.5)
        hotspotRingRef.current.scale.set(s, s, s)
      }

      renderer.render(scene, camera)
    }
    animate()

    // Build lattice inside model bounds
    const buildLatticeInfill = (
      bounds: { min: [number, number, number]; max: [number, number, number] },
      center: THREE.Vector3,
      radius: number
    ) => {
      // 1. Conformal node coordinates inside model
      const worldNodes = mapPredictedNodesToModelBounds(model.nodes, bounds)
      const edges = model.edges
      const scalars =
        heatmapMode === 'stress' ? model.fea.node_stress_scalars : model.fea.node_strain_scalars
      const nodeStresses = model.fea.node_stresses_mpa
      const nodeStrains = model.fea.node_strains
      const hotspotNodeId =
        heatmapMode === 'stress'
          ? model.fea.stress_hotspot_nodes[0] ?? 0
          : model.fea.strain_hotspot_nodes[0] ?? 0

      const maxDim = Math.max(
        bounds.max[0] - bounds.min[0],
        bounds.max[1] - bounds.min[1],
        bounds.max[2] - bounds.min[2]
      )
      const strutRadius = Math.max(maxDim * 0.016 * Math.sqrt(model.relative_density / 0.15), 0.01)
      const nodeRadius = strutRadius * 1.85

      const latticeGroup = new THREE.Group()
      latticeGroup.name = 'lattice_infill_group'
      scene.add(latticeGroup)
      latticeGroupRef.current = latticeGroup

      const up = new THREE.Vector3(0, 1, 0)
      const p1 = new THREE.Vector3()
      const p2 = new THREE.Vector3()
      const mid = new THREE.Vector3()
      const dir = new THREE.Vector3()

      // Struts
      edges.forEach(([u, v]) => {
        if (u >= worldNodes.length || v >= worldNodes.length) return
        p1.set(...worldNodes[u])
        p2.set(...worldNodes[v])
        const dist = p1.distanceTo(p2)
        if (dist < 1e-4) return

        mid.addVectors(p1, p2).multiplyScalar(0.5)
        dir.subVectors(p2, p1).normalize()

        const cylGeo = new THREE.CylinderGeometry(strutRadius, strutRadius, dist, 12, 1)
        const c1 = getHeatmapColor(scalars[u] ?? 0.5)
        const c2 = getHeatmapColor(scalars[v] ?? 0.5)

        const count = cylGeo.attributes.position.count
        const colors = new Float32Array(count * 3)
        const pos = cylGeo.attributes.position

        for (let i = 0; i < count; i++) {
          const y = pos.getY(i)
          const alpha = Math.max(0, Math.min(1, (y + dist / 2) / dist))
          const c = new THREE.Color().lerpColors(c1, c2, alpha)
          colors[i * 3] = c.r
          colors[i * 3 + 1] = c.g
          colors[i * 3 + 2] = c.b
        }
        cylGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

        const cylMat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.35,
          metalness: 0.25,
        })
        const cylinder = new THREE.Mesh(cylGeo, cylMat)
        cylinder.position.copy(mid)
        cylinder.quaternion.setFromUnitVectors(up, dir)
        latticeGroup.add(cylinder)
      })

      // Nodes
      const sphereGeo = new THREE.SphereGeometry(nodeRadius, 14, 14)
      worldNodes.forEach((coords, idx) => {
        const col = getHeatmapColor(scalars[idx] ?? 0.5)
        const isHotspot = idx === hotspotNodeId

        const mat = new THREE.MeshStandardMaterial({
          color: col,
          roughness: 0.25,
          metalness: 0.3,
          emissive: isHotspot ? col.clone().multiplyScalar(0.4) : new THREE.Color(0x000000),
        })
        const sphere = new THREE.Mesh(sphereGeo, mat)
        sphere.position.set(coords[0], coords[1], coords[2])
        sphere.userData = {
          nodeId: idx,
          stress: nodeStresses[idx] ?? 0,
          strain: nodeStrains[idx] ?? 0,
          coords,
          isHotspot,
        }
        latticeGroup.add(sphere)
        nodeSpheres.push(sphere)
      })

      // Hotspot Ring
      if (worldNodes[hotspotNodeId]) {
        const hpPos = worldNodes[hotspotNodeId]
        const ringGeo = new THREE.TorusGeometry(nodeRadius * 2.3, strutRadius * 0.45, 8, 24)
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xff1e00,
          transparent: true,
          opacity: 0.85,
        })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        ring.position.set(hpPos[0], hpPos[1], hpPos[2])
        ring.rotation.x = Math.PI / 2
        latticeGroup.add(ring)
        hotspotRingRef.current = ring
      }

      // Frame Camera to Model
      const dist = radius * 2.4
      controls.target.copy(center)
      camera.position.set(center.x + dist * 0.7, center.y + dist * 0.5, center.z + dist * 0.8)
      camera.near = Math.max(0.01, radius / 500)
      camera.far = Math.max(5000, radius * 100)
      camera.updateProjectionMatrix()
      controls.minDistance = Math.max(0.01, radius * 0.05)
      controls.maxDistance = Math.max(5000, radius * 50)
      controls.update()

      // Floor Grid
      const gridSize = Math.max(radius * 3.5, 3)
      const grid = new THREE.GridHelper(gridSize, 12, 0xd0d0d0, 0xededed)
      grid.position.set(center.x, bounds.min[1], center.z)
      scene.add(grid)
      gridRef.current = grid
    }

    // Load User Model if provided, and build the lattice inside it
    if (userFile) {
      loadUploadedGeometry(userFile)
        .then((res) => {
          if (!isMounted) return
          setGeomStats(res)

          // 1. Render User's 3D Model Shell
          const ghostMat = createModelMaterial(shellMode === 'wireframe' ? 'wireframe' : 'ghost')
          res.object.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh
              mesh.material = ghostMat
            }
          })
          if (shellMode === 'off') {
            res.object.visible = false
          }
          scene.add(res.object)
          userObjRef.current = res.object

          // 2. Build Suggested Conformal Volumetric Lattice INSIDE the User's Model
          if (res.geometry) {
            const isCandidate2 =
              model.id === 'model_2' ||
              model.name.toLowerCase().includes('model 2') ||
              model.name.toLowerCase().includes('candidate 2') ||
              model.name.toLowerCase().includes('toughness') ||
              model.topology_type.toLowerCase().includes('kelvin') ||
              model.topology_type.toLowerCase().includes('energy')

            const infillType: LatticeType = isCandidate2 ? 'kelvin' : 'octet'
            const infillRes = generateVolumetricInfill(res.geometry, {
              latticeType: infillType,
              targetCellsAlongMaxDim: isCandidate2 ? 22 : 26,
              relativeDensity: model.relative_density,
              useHeatmap: true,
              heatmapMode: heatmapMode,
            })
            scene.add(infillRes.instancedMesh)
            latticeGroupRef.current = infillRes.instancedMesh as any

            // Frame Camera to Model
            const center = new THREE.Vector3(...res.center)
            const dist = res.radius * 2.4
            controls.target.copy(center)
            camera.position.set(center.x + dist * 0.7, center.y + dist * 0.5, center.z + dist * 0.8)
            camera.near = Math.max(0.01, res.radius / 500)
            camera.far = Math.max(5000, res.radius * 100)
            camera.updateProjectionMatrix()
            controls.minDistance = Math.max(0.01, res.radius * 0.05)
            controls.maxDistance = Math.max(5000, res.radius * 50)
            controls.update()

            const gridSize = Math.max(res.radius * 3.5, 3)
            const grid = new THREE.GridHelper(gridSize, 12, 0xd0d0d0, 0xededed)
            grid.position.set(center.x, res.rawBounds.min[1], center.z)
            scene.add(grid)
            gridRef.current = grid
          } else {
            buildLatticeInfill(res.rawBounds, new THREE.Vector3(...res.center), res.radius)
          }
        })
        .catch((err) => {
          console.error('Failed to load user model for lattice viewer:', err)
          // Fallback to unit bounds
          const defaultBounds = { min: [-0.5, -0.5, -0.5] as [number, number, number], max: [0.5, 0.5, 0.5] as [number, number, number] }
          buildLatticeInfill(defaultBounds, new THREE.Vector3(0, 0, 0), 1.0)
        })
    } else {
      // Default unit bounds fallback
      const defaultBounds = { min: [-0.5, -0.5, -0.5] as [number, number, number], max: [0.5, 0.5, 0.5] as [number, number, number] }
      buildLatticeInfill(defaultBounds, new THREE.Vector3(0, 0, 0), 1.0)
    }

    // Resize Handler
    const onResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight || 360
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      isMounted = false
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current)
      }
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('mousemove', onPointerMove)

      if (latticeGroupRef.current && sceneRef.current) {
        sceneRef.current.remove(latticeGroupRef.current)
        latticeGroupRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.geometry?.dispose()
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose())
            } else {
              mesh.material?.dispose()
            }
          }
        })
      }

      if (userObjRef.current && sceneRef.current) {
        sceneRef.current.remove(userObjRef.current)
        userObjRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.geometry?.dispose()
          }
        })
      }

      if (gridRef.current && sceneRef.current) {
        sceneRef.current.remove(gridRef.current)
        gridRef.current.geometry.dispose()
      }

      controls.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [model, heatmapMode, userFile])

  const maxVal =
    heatmapMode === 'stress' ? `${model.fea.max_stress_mpa} MPa` : `${(model.fea.max_strain * 100).toFixed(1)}%`
  const minVal =
    heatmapMode === 'stress' ? `${model.fea.min_stress_mpa} MPa` : `${(model.fea.min_strain * 100).toFixed(1)}%`

  const isCandidate2 =
    model.id === 'model_2' ||
    model.name.toLowerCase().includes('model 2') ||
    model.name.toLowerCase().includes('candidate 2') ||
    model.name.toLowerCase().includes('toughness') ||
    model.topology_type.toLowerCase().includes('kelvin') ||
    model.topology_type.toLowerCase().includes('energy')

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-[#fafafa]">
      {/* 3D Viewport Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 bg-white/70 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-2 w-2 rounded-full ring-2 ${
              isCandidate2 ? 'bg-blue-500 ring-blue-500/20' : 'bg-emerald-500 ring-emerald-500/20'
            }`}
          />
          <span className="text-xs font-bold tracking-tight text-black">{model.topology_type}</span>
          <span className="rounded-full bg-black/5 px-2 py-0.5 font-mono text-[10px] font-medium text-black/60">
            ρ = {(model.relative_density * 100).toFixed(0)}%
          </span>
          {userFile && (
            <span
              className={`hidden sm:inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
                isCandidate2 ? 'bg-blue-500/10 text-blue-700' : 'bg-emerald-500/10 text-emerald-700'
              }`}
            >
              Conformal {isCandidate2 ? 'Kelvin Infill' : 'Octet Infill'}
            </span>
          )}
        </div>

        {/* Heatmap & CAD Shell Mode Toggles */}
        <div className="flex items-center gap-1.5">
          {/* Shell Toggle */}
          <button
            type="button"
            onClick={cycleShellMode}
            title={`Toggle CAD model shell view (Current: ${shellMode})`}
            className="flex items-center gap-1 rounded-full border border-black/10 bg-white px-2.5 py-1 font-mono text-[10px] font-semibold text-black/75 shadow-2xs transition hover:border-black hover:text-black"
          >
            {shellMode === 'off' ? <EyeOff className="h-3 w-3 text-black/40" /> : <Eye className="h-3 w-3 text-emerald-600" />}
            Shell: {shellMode === 'ghost' ? 'Glass' : shellMode === 'wireframe' ? 'Wire' : 'Off'}
          </button>

          {/* Stress / Strain Toggle */}
          <div className="flex items-center rounded-full bg-black/[0.04] p-0.5">
            <button
              type="button"
              onClick={() => onModeChange('stress')}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                heatmapMode === 'stress'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              <Activity className="h-3 w-3" />
              Stress
            </button>
            <button
              type="button"
              onClick={() => onModeChange('strain')}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                heatmapMode === 'strain'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              <Zap className="h-3 w-3" />
              Strain
            </button>
          </div>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="relative h-[380px] w-full cursor-grab active:cursor-grabbing sm:h-[440px]"
      />

      {/* Floating View Controls */}
      <div className="absolute left-3 top-14 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={toggleAutoRotate}
          title={autoRotate ? 'Pause rotation' : 'Auto rotate'}
          className={`flex h-7 w-7 items-center justify-center rounded-lg border bg-white/90 text-xs shadow-sm backdrop-blur transition-all hover:bg-black hover:text-white ${
            autoRotate ? 'border-black/10 text-black' : 'border-black/20 text-black/40'
          }`}
        >
          <RotateCw className={`h-3.5 w-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
        </button>
        <button
          type="button"
          onClick={handleResetCamera}
          title="Reset camera view"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 bg-white/90 text-black/70 shadow-sm backdrop-blur transition-all hover:bg-black hover:text-white"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Download Infill Button */}
      <div className="absolute right-3 top-14">
        <button
          type="button"
          onClick={() => handleExportLattice('obj')}
          title="Download this conformal lattice structure (.obj)"
          className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-2.5 py-1 font-mono text-[10px] font-semibold text-black shadow-xs backdrop-blur transition hover:bg-black hover:text-white"
        >
          <Download className="h-3 w-3" />
          Export Infill (.obj)
        </button>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredNode && (
        <div className="absolute left-3 bottom-14 z-10 rounded-xl border border-black/10 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
          <p className="font-mono text-[10px] uppercase tracking-wider text-black/45">
            Node #{hoveredNode.id}
          </p>
          <div className="mt-1 flex items-center gap-3 font-mono text-[11px]">
            <span>σ: <strong className="text-black">{hoveredNode.stress} MPa</strong></span>
            <span>ε: <strong className="text-black">{(hoveredNode.strain * 100).toFixed(1)}%</strong></span>
          </div>
        </div>
      )}

      {/* Heatmap Legend Bar */}
      <div className="flex items-center justify-between border-t border-black/5 bg-white/80 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-black/40">
            {heatmapMode === 'stress' ? 'FEA Stress Infill' : 'FEA Strain Infill'}
          </span>
          <div
            className="h-2.5 w-24 rounded-full border border-black/10"
            style={{
              background: 'linear-gradient(to right, #1d4ed8, #06b6d4, #22c55e, #eab308, #ef4444)',
            }}
          />
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-black/70">
          <span>Min: {minVal}</span>
          <span className="text-black/30">|</span>
          <span className="font-semibold text-rose-600">Peak: {maxVal}</span>
        </div>
      </div>
    </div>
  )
}

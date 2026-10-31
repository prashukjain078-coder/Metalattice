import { useRef, useMemo, useEffect, Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Box, GizmoHelper, GizmoViewport } from '@react-three/drei'
import * as THREE from 'three'
import { buildLatticeGeometry } from '../lattice/LatticeGeometryEngine'
import type { GeometryParams } from '../../types'

interface LatticeModelProps {
  params: GeometryParams
  wireframe: boolean
  showBoundingBox: boolean
}

function LatticeModel({ params, wireframe, showBoundingBox }: LatticeModelProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const geo = useMemo(() => {
    try { return buildLatticeGeometry(params) }
    catch { return new THREE.BoxGeometry(1, 1, 1) }
  }, [params.family, params.cellSize, params.strutThickness, params.relativeDensity,
      params.cellsX, params.cellsY, params.cellsZ, params.resolution, params.isoLevel])

  // Center the geometry
  const { totalX, totalY, totalZ } = useMemo(() => ({
    totalX: params.cellSize * params.cellsX,
    totalY: params.cellSize * params.cellsY,
    totalZ: params.cellSize * params.cellsZ,
  }), [params])

  useEffect(() => {
    return () => { geo.dispose() }
  }, [geo])

  return (
    <group position={[-totalX / 2, -totalY / 2, -totalZ / 2]}>
      <mesh ref={meshRef} geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#4a7fa8"
          metalness={0.7}
          roughness={0.25}
          wireframe={wireframe}
          side={THREE.DoubleSide}
          emissive="#00E5FF"
          emissiveIntensity={0.04}
        />
      </mesh>
      {showBoundingBox && (
        <Box args={[totalX, totalY, totalZ]} position={[totalX/2, totalY/2, totalZ/2]}>
          <meshBasicMaterial color="#00E5FF" wireframe transparent opacity={0.25} />
        </Box>
      )}
    </group>
  )
}

function CameraAdjuster({ params }: { params: GeometryParams }) {
  const { camera } = useThree()
  useEffect(() => {
    const maxDim = Math.max(
      params.cellSize * params.cellsX,
      params.cellSize * params.cellsY,
      params.cellSize * params.cellsZ,
    )
    const dist = maxDim * 1.8
    camera.position.set(dist * 0.6, dist * 0.5, dist * 0.8)
    camera.near = 0.01
    camera.far = maxDim * 100
    camera.updateProjectionMatrix()
  }, [params.cellsX, params.cellsY, params.cellsZ, params.cellSize])
  return null
}


interface Props {
  params: GeometryParams
  wireframe?: boolean
  showGrid?: boolean
  showAxes?: boolean
  showBoundingBox?: boolean
  isGenerating?: boolean
  compact?: boolean
}

export default function LatticeViewer({
  params,
  wireframe = false,
  showGrid = true,
  showAxes = true,
  showBoundingBox = false,
  isGenerating = false,
  compact = false,
}: Props) {
  const maxDim = Math.max(
    params.cellSize * params.cellsX,
    params.cellSize * params.cellsY,
    params.cellSize * params.cellsZ,
  )

  return (
    <div className="relative w-full h-full bg-[#080B10]">
      {/* Grid background overlay */}
      <div className="absolute inset-0 grid-bg-fine opacity-30 pointer-events-none" />

      <Canvas
        shadows
        camera={{ position: [18, 14, 22], fov: 45, near: 0.01, far: 10000 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <color attach="background" args={['#080B10']} />
        <fog attach="fog" args={['#080B10', maxDim * 8, maxDim * 60]} />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[20, 30, 20]} intensity={1.2} castShadow
          shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <directionalLight position={[-15, 10, -15]} intensity={0.4} color="#8B5CF6" />
        <pointLight position={[0, maxDim * 2, 0]} intensity={0.6} color="#00E5FF" />
        <pointLight position={[-maxDim, 0, maxDim]} intensity={0.3} color="#8B5CF6" />

        <CameraAdjuster params={params} />

        <Suspense fallback={null}>
          <LatticeModel params={params} wireframe={wireframe} showBoundingBox={showBoundingBox} />
        </Suspense>

        {showGrid && (
          <Grid
            args={[maxDim * 4, maxDim * 4]}
            cellSize={params.cellSize}
            cellThickness={0.5}
            cellColor="#263342"
            sectionSize={params.cellSize * 4}
            sectionThickness={1}
            sectionColor="#2d4057"
            fadeDistance={maxDim * 8}
            fadeStrength={1}
            position={[0, -params.cellSize * params.cellsY / 2 - 0.1, 0]}
          />
        )}

        {showAxes && !compact && (
          <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
            <GizmoViewport axisColors={['#FF5D73', '#37D67A', '#00E5FF']} labelColor="#F4F7FB" />
          </GizmoHelper>
        )}

        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          minDistance={0.5}
          maxDistance={maxDim * 20}
          makeDefault
        />
      </Canvas>

      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#080B10]/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
            <span className="text-[#00E5FF] text-sm font-mono">Generating lattice...</span>
          </div>
        </div>
      )}
    </div>
  )
}


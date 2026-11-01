import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader.js'

export interface ParsedGeometryResult {
  object: THREE.Object3D
  geometry?: THREE.BufferGeometry
  vertexCount: number
  faceCount: number
  dimensions: {
    x: number
    y: number
    z: number
  }
  rawBounds: {
    min: [number, number, number]
    max: [number, number, number]
  }
  center: [number, number, number]
  radius: number
  isPointCloud?: boolean
  fileType: string
}

/**
 * Creates default material matching Metalattice brand aesthetics.
 * Preserves original facet geometry as is without smoothing or tessellation alterations.
 */
export function createModelMaterial(
  mode: 'solid' | 'wireframe' | 'normal' | 'ghost' = 'solid'
): THREE.Material {
  if (mode === 'normal') {
    return new THREE.MeshNormalMaterial({
      wireframe: false,
      side: THREE.DoubleSide,
    })
  }

  if (mode === 'wireframe') {
    return new THREE.MeshStandardMaterial({
      color: 0x181818,
      wireframe: true,
      roughness: 0.5,
      metalness: 0.8,
      side: THREE.DoubleSide,
    })
  }

  if (mode === 'ghost') {
    return new THREE.MeshPhysicalMaterial({
      color: 0xb0b0b0,
      transparent: true,
      opacity: 0.22,
      roughness: 0.3,
      metalness: 0.15,
      transmission: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  }

  // Matte architectural chrome / precision metal - preserving original surface facets as is
  return new THREE.MeshStandardMaterial({
    color: 0xdcdcdc,
    metalness: 0.78,
    roughness: 0.34,
    side: THREE.DoubleSide,
    flatShading: true,
  })
}

/**
 * Extracts Cartesian coordinates from STEP file text matching ISO 10303 standards.
 */
function parseStepCoordinates(text: string): number[][] {
  const points: number[][] = []
  const lines = text.split('\n')
  for (const line of lines) {
    if (line.includes('CARTESIAN_POINT')) {
      const match = line.match(/\(\s*([-\d.eE\s,]+)\s*\)/)
      if (match) {
        const parts = match[1].split(',').map((s) => parseFloat(s.trim()))
        if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
          points.push(parts)
        }
      }
    }
  }
  return points
}

/**
 * Loads and parses an uploaded 3D CAD/mesh file completely in the browser.
 * The model itself is kept AS IS without any scaling, translation, decimation, or optimization.
 */
export async function loadUploadedGeometry(file: File): Promise<ParsedGeometryResult> {
  const name = file.name.toLowerCase()
  let object: THREE.Object3D
  let isPointCloud = false
  let fileType = 'Mesh'

  if (name.endsWith('.stl')) {
    fileType = 'STL'
    const buffer = await file.arrayBuffer()
    const loader = new STLLoader()
    const geometry = loader.parse(buffer)
    const material = createModelMaterial('solid')
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    object = mesh
  } else if (name.endsWith('.obj')) {
    fileType = 'OBJ'
    const text = await file.text()
    const loader = new OBJLoader()
    const group = loader.parse(text)
    const defaultMat = createModelMaterial('solid')
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.material = defaultMat
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    object = group
  } else if (name.endsWith('.3mf')) {
    fileType = '3MF'
    const buffer = await file.arrayBuffer()
    const loader = new ThreeMFLoader()
    const group = loader.parse(buffer)
    const defaultMat = createModelMaterial('solid')
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.material = defaultMat
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    object = group
  } else if (name.endsWith('.step') || name.endsWith('.stp')) {
    fileType = 'STEP'
    const text = await file.text()
    const points = parseStepCoordinates(text)

    if (points.length === 0) {
      throw new Error('No valid 3D Cartesian coordinates could be extracted from this STEP file.')
    }

    const positions = new Float32Array(points.flat())
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const pointMaterial = new THREE.PointsMaterial({
      color: 0x111111,
      size: 0.05,
      sizeAttenuation: true,
    })

    const pointCloud = new THREE.Points(geometry, pointMaterial)
    object = pointCloud
    isPointCloud = true
  } else if (name.endsWith('.json') || name.endsWith('.gpkl')) {
    fileType = 'JSON'
    const text = await file.text()
    const json = JSON.parse(text)

    let coords: number[][] = []
    if (Array.isArray(json.nodes)) coords = json.nodes
    else if (Array.isArray(json.vertices)) coords = json.vertices
    else if (Array.isArray(json)) coords = json

    if (coords.length === 0 || !Array.isArray(coords[0])) {
      throw new Error('JSON file must contain a "nodes" or "vertices" array of 3D coordinates.')
    }

    const positions = new Float32Array(coords.map((c) => [c[0] ?? 0, c[1] ?? 0, c[2] ?? 0]).flat())
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const pointMaterial = new THREE.PointsMaterial({
      color: 0x111111,
      size: 0.05,
      sizeAttenuation: true,
    })
    const pointCloud = new THREE.Points(geometry, pointMaterial)
    object = pointCloud
    isPointCloud = true
  } else {
    throw new Error(`Unsupported 3D file format: ${file.name}`)
  }

  // Calculate bounding box and statistics in original native units
  const bbox = new THREE.Box3().setFromObject(object)
  const size = new THREE.Vector3()
  bbox.getSize(size)
  const center = new THREE.Vector3()
  bbox.getCenter(center)
  const sphere = new THREE.Sphere()
  bbox.getBoundingSphere(sphere)

  // Count vertices and faces
  let totalVertices = 0
  let totalFaces = 0

  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh || (child as THREE.Points).isPoints) {
      const mesh = child as THREE.Mesh | THREE.Points
      const geom = mesh.geometry
      if (geom.attributes.position) {
        totalVertices += geom.attributes.position.count
      }
      if (geom.index) {
        totalFaces += geom.index.count / 3
      } else if (geom.attributes.position && !isPointCloud) {
        totalFaces += geom.attributes.position.count / 3
      }
    }
  })

  // Find primary mesh geometry for volumetric infill generation
  let primaryGeometry: THREE.BufferGeometry | undefined
  object.traverse((child) => {
    if (!primaryGeometry && ((child as THREE.Mesh).isMesh || (child as THREE.Points).isPoints)) {
      primaryGeometry = ((child as THREE.Mesh | THREE.Points).geometry)
    }
  })

  // The model itself is NOT modified, NOT scaled, and NOT translated.
  // It is preserved AS IS in its original coordinates, units, and orientation.
  object.updateMatrixWorld(true)

  const rawBounds = {
    min: [Number(bbox.min.x.toFixed(3)), Number(bbox.min.y.toFixed(3)), Number(bbox.min.z.toFixed(3))] as [number, number, number],
    max: [Number(bbox.max.x.toFixed(3)), Number(bbox.max.y.toFixed(3)), Number(bbox.max.z.toFixed(3))] as [number, number, number],
  }

  return {
    object,
    geometry: primaryGeometry,
    vertexCount: Math.round(totalVertices),
    faceCount: Math.round(totalFaces),
    dimensions: {
      x: Number(size.x.toFixed(2)),
      y: Number(size.y.toFixed(2)),
      z: Number(size.z.toFixed(2)),
    },
    rawBounds,
    center: [Number(center.x.toFixed(3)), Number(center.y.toFixed(3)), Number(center.z.toFixed(3))],
    radius: Math.max(sphere.radius, 0.5),
    isPointCloud,
    fileType,
  }
}

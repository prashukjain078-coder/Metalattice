import * as THREE from 'three'
import type { ModelData } from '../components/lattice/LatticeViewer3D'

export interface GeneratedLattice {
  type: string
  nodes: [number, number, number][]
  edges: [number, number][]
  nodeCount: number
  strutCount: number
  relativeDensity: number
}

// Turbo/Jet scientific heatmap color interpolator
export function getHeatmapColor(t: number): THREE.Color {
  const clamped = Math.max(0, Math.min(1, t))
  let r = 0
  let g = 0
  let b = 0

  if (clamped < 0.2) {
    const s = clamped / 0.2
    r = 0.1 * (1 - s)
    g = 0.2 * s
    b = 0.6 + 0.4 * s
  } else if (clamped < 0.4) {
    const s = (clamped - 0.2) / 0.2
    r = 0.0
    g = 0.2 + 0.8 * s
    b = 1.0
  } else if (clamped < 0.6) {
    const s = (clamped - 0.4) / 0.2
    r = 0.0
    g = 1.0
    b = 1.0 - s
  } else if (clamped < 0.8) {
    const s = (clamped - 0.6) / 0.2
    r = s
    g = 1.0 - 0.2 * s
    b = 0.0
  } else {
    const s = (clamped - 0.8) / 0.2
    r = 1.0
    g = 0.8 * (1 - s)
    b = 0.0
  }
  return new THREE.Color(r, g, b)
}

/**
 * Conformal Mapping:
 * Maps the AI-predicted model's normalized unit cell nodes [-0.5, 0.5]^3
 * directly into the exact physical 3D coordinates and bounding envelope of the uploaded CAD part.
 */
export function mapPredictedNodesToModelBounds(
  nodes: number[][],
  bounds: { min: [number, number, number]; max: [number, number, number] }
): [number, number, number][] {
  const dx = Math.max(bounds.max[0] - bounds.min[0], 0.001)
  const dy = Math.max(bounds.max[1] - bounds.min[1], 0.001)
  const dz = Math.max(bounds.max[2] - bounds.min[2], 0.001)
  const cx = (bounds.min[0] + bounds.max[0]) / 2
  const cy = (bounds.min[1] + bounds.max[1]) / 2
  const cz = (bounds.min[2] + bounds.max[2]) / 2

  return nodes.map(([nx, ny, nz]) => [
    Number((cx + nx * dx).toFixed(4)),
    Number((cy + ny * dy).toFixed(4)),
    Number((cz + nz * dz).toFixed(4)),
  ])
}

/**
 * Builds high-performance 3D visual representation of the AI-predicted lattice structure
 * conformal to the exact 3D model geometry.
 */
export function createPredictedLatticeGroup(
  predictedModel: ModelData,
  bounds: { min: [number, number, number]; max: [number, number, number] },
  options: { useHeatmap?: boolean; scaleRadius?: number } = {}
): THREE.Group {
  const group = new THREE.Group()
  group.name = 'predicted_lattice_infill'

  const { useHeatmap = true, scaleRadius = 1.0 } = options
  const worldNodes = mapPredictedNodesToModelBounds(predictedModel.nodes, bounds)
  const edges = predictedModel.edges
  const scalars = predictedModel.fea.node_stress_scalars

  const dx = bounds.max[0] - bounds.min[0]
  const dy = bounds.max[1] - bounds.min[1]
  const dz = bounds.max[2] - bounds.min[2]
  const maxDim = Math.max(dx, dy, dz)

  // Proportional physical strut and node radius
  const strutRadius = Math.max(maxDim * 0.016 * Math.sqrt(predictedModel.relative_density / 0.15), 0.008)
  const nodeRadius = strutRadius * 1.85

  // 1. Create Struts (Cylinders)
  const up = new THREE.Vector3(0, 1, 0)
  const p1 = new THREE.Vector3()
  const p2 = new THREE.Vector3()
  const mid = new THREE.Vector3()
  const dir = new THREE.Vector3()

  edges.forEach(([u, v]) => {
    if (u >= worldNodes.length || v >= worldNodes.length) return
    p1.set(...worldNodes[u])
    p2.set(...worldNodes[v])

    const dist = p1.distanceTo(p2)
    if (dist < 1e-4) return

    mid.addVectors(p1, p2).multiplyScalar(0.5)
    dir.subVectors(p2, p1).normalize()

    const cylGeo = new THREE.CylinderGeometry(strutRadius, strutRadius, dist, 12, 1)

    let mat: THREE.Material
    if (useHeatmap) {
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
      mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.35,
        metalness: 0.30,
      })
    } else {
      mat = new THREE.MeshStandardMaterial({
        color: 0x2e2e2e,
        roughness: 0.28,
        metalness: 0.85,
      })
    }

    const cylMesh = new THREE.Mesh(cylGeo, mat)
    cylMesh.position.copy(mid)
    cylMesh.quaternion.setFromUnitVectors(up, dir)
    cylMesh.castShadow = true
    cylMesh.receiveShadow = true
    group.add(cylMesh)
  })

  // 2. Create Nodes (Spheres)
  const sphereGeo = new THREE.SphereGeometry(nodeRadius, 14, 14)
  const hotspotNode = predictedModel.fea.critical_hotspot.node_id

  worldNodes.forEach(([x, y, z], idx) => {
    const isHotspot = idx === hotspotNode
    const col = useHeatmap ? getHeatmapColor(scalars[idx] ?? 0.5) : new THREE.Color(0x181818)

    const mat = new THREE.MeshStandardMaterial({
      color: col,
      roughness: 0.25,
      metalness: 0.4,
      emissive: isHotspot ? col.clone().multiplyScalar(0.4) : new THREE.Color(0x000000),
    })

    const sphere = new THREE.Mesh(sphereGeo, mat)
    sphere.position.set(x, y, z)
    sphere.castShadow = true
    sphere.receiveShadow = true
    group.add(sphere)
  })

  // 3. Hotspot Pulsing Indicator Ring
  if (worldNodes[hotspotNode]) {
    const hp = worldNodes[hotspotNode]
    const ringGeo = new THREE.TorusGeometry(nodeRadius * 2.4, strutRadius * 0.45, 8, 24)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff1e00,
      transparent: true,
      opacity: 0.85,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.set(hp[0], hp[1], hp[2])
    ring.rotation.x = Math.PI / 2
    group.add(ring)
  }

  return group
}

/**
 * Serializes the system's predicted conformal lattice into a downloadable JSON file.
 */
export function exportPredictedLatticeToJson(
  model: ModelData,
  fileName: string,
  worldNodes: [number, number, number][]
): string {
  const payload = {
    schema: 'Metalattice-Prediction-v1.0',
    source_model: fileName,
    predicted_candidate: model.name,
    topology_type: model.topology_type,
    relative_density: model.relative_density,
    predicted_mechanical_properties: model.properties,
    fea_summary: {
      max_stress_mpa: model.fea.max_stress_mpa,
      min_stress_mpa: model.fea.min_stress_mpa,
      max_strain: model.fea.max_strain,
      critical_hotspot: model.fea.critical_hotspot,
    },
    n_nodes: worldNodes.length,
    n_edges: model.edges.length,
    nodes: worldNodes,
    edges: model.edges,
  }
  return JSON.stringify(payload, null, 2)
}

/**
 * Serializes the predicted lattice into a standard 3D Wavefront .obj file.
 */
export function exportPredictedLatticeToObj(
  model: ModelData,
  worldNodes: [number, number, number][]
): string {
  let obj = `# Metalattice AI-Predicted Conformal Metamaterial Infill\n`
  obj += `# Candidate: ${model.name}\n`
  obj += `# Topology: ${model.topology_type}\n`
  obj += `# Peak Stress: ${model.properties.peak_stress_mpa} MPa | Young's Modulus: ${model.properties.youngs_modulus_gpa} GPa\n`
  obj += `# Nodes: ${worldNodes.length}, Struts: ${model.edges.length}\n\n`

  worldNodes.forEach(([x, y, z]) => {
    obj += `v ${x.toFixed(4)} ${y.toFixed(4)} ${z.toFixed(4)}\n`
  })

  obj += `\ng predicted_lattice_struts\n`
  model.edges.forEach(([u, v]) => {
    obj += `l ${u + 1} ${v + 1}\n`
  })

  return obj
}

/**
 * Triggers a browser file download of a string blob.
 */
export function triggerFileDownload(
  content: string,
  filename: string,
  mimeType: string = 'application/json'
) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

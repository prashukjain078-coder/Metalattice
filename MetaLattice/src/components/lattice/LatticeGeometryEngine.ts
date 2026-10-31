import * as THREE from 'three'
import type { GeometryParams } from '../../types'

/** Node-and-strut lattice builder */
function cylinder(
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  segments = 6
): THREE.BufferGeometry {
  const dir = new THREE.Vector3().subVectors(to, from)
  const len = dir.length()
  const geo = new THREE.CylinderGeometry(radius, radius, len, segments, 1)
  geo.applyMatrix4(new THREE.Matrix4().makeTranslation(0, len / 2, 0))
  geo.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2))
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    dir.normalize()
  )
  geo.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q))
  geo.applyMatrix4(new THREE.Matrix4().makeTranslation(from.x, from.y, from.z))
  return geo
}

function sphere(pos: THREE.Vector3, r: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(r, 8, 6)
  geo.applyMatrix4(new THREE.Matrix4().makeTranslation(pos.x, pos.y, pos.z))
  return geo
}

function mergeGeos(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geos.length === 0) return new THREE.BufferGeometry()
  // Simple merge via THREE.BufferGeometryUtils approach without importing utils
  let totalVerts = 0
  let totalIdxs = 0
  for (const g of geos) {
    g.computeVertexNormals()
    if (!g.index) {
      const n = g.attributes.position.count
      const idx = new Uint32Array(n)
      for (let i = 0; i < n; i++) idx[i] = i
      g.setIndex(new THREE.BufferAttribute(idx, 1))
    }
    totalVerts += g.attributes.position.count
    totalIdxs += g.index!.count
  }
  const positions = new Float32Array(totalVerts * 3)
  const normals = new Float32Array(totalVerts * 3)
  const indices = new Uint32Array(totalIdxs)
  let vOffset = 0
  let iOffset = 0
  for (const g of geos) {
    const pos = g.attributes.position.array as Float32Array
    const nor = g.attributes.normal?.array as Float32Array | undefined
    const idx = g.index!.array
    positions.set(pos, vOffset * 3)
    if (nor) normals.set(nor, vOffset * 3)
    for (let i = 0; i < idx.length; i++) indices[iOffset + i] = idx[i] + vOffset
    vOffset += g.attributes.position.count
    iOffset += idx.length
    g.dispose()
  }
  const merged = new THREE.BufferGeometry()
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  merged.setIndex(new THREE.BufferAttribute(indices, 1))
  merged.computeVertexNormals()
  return merged
}

function buildStrutLattice(
  params: GeometryParams,
  struts: Array<[number[], number[]]>,
  nodePositions: number[][]
): THREE.BufferGeometry {
  const { cellSize, cellsX, cellsY, cellsZ, strutThickness } = params
  const r = strutThickness / 2
  const geos: THREE.BufferGeometry[] = []
  const nodeSet = new Set<string>()

  for (let ix = 0; ix < cellsX; ix++) {
    for (let iy = 0; iy < cellsY; iy++) {
      for (let iz = 0; iz < cellsZ; iz++) {
        const ox = ix * cellSize, oy = iy * cellSize, oz = iz * cellSize
        for (const [a, b] of struts) {
          const [ax, ay, az] = [ox + a[0] * cellSize, oy + a[1] * cellSize, oz + a[2] * cellSize]
          const [bx, by, bz] = [ox + b[0] * cellSize, oy + b[1] * cellSize, oz + b[2] * cellSize]
          const va = new THREE.Vector3(ax, ay, az)
          const vb = new THREE.Vector3(bx, by, bz)
          geos.push(cylinder(va, vb, r))
        }
        for (const np of nodePositions) {
          const key = `${ix + np[0]},${iy + np[1]},${iz + np[2]}`
          if (!nodeSet.has(key)) {
            nodeSet.add(key)
            geos.push(sphere(new THREE.Vector3(
              ox + np[0] * cellSize,
              oy + np[1] * cellSize,
              oz + np[2] * cellSize,
            ), r * 1.4))
          }
        }
      }
    }
  }
  return mergeGeos(geos)
}

export function buildBCC(params: GeometryParams): THREE.BufferGeometry {
  const struts: Array<[number[], number[]]> = [
    [[0,0,0],[0.5,0.5,0.5]], [[1,0,0],[0.5,0.5,0.5]],
    [[0,1,0],[0.5,0.5,0.5]], [[1,1,0],[0.5,0.5,0.5]],
    [[0,0,1],[0.5,0.5,0.5]], [[1,0,1],[0.5,0.5,0.5]],
    [[0,1,1],[0.5,0.5,0.5]], [[1,1,1],[0.5,0.5,0.5]],
  ]
  const nodes = [[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1],[0.5,0.5,0.5]]
  return buildStrutLattice(params, struts, nodes)
}

export function buildFCC(params: GeometryParams): THREE.BufferGeometry {
  const struts: Array<[number[], number[]]> = [
    [[0,0,0],[0.5,0.5,0]], [[1,0,0],[0.5,0.5,0]],
    [[0,1,0],[0.5,0.5,0]], [[1,1,0],[0.5,0.5,0]],
    [[0,0,0],[0.5,0,0.5]], [[1,0,0],[0.5,0,0.5]],
    [[0,0,1],[0.5,0,0.5]], [[1,0,1],[0.5,0,0.5]],
    [[0,0,0],[0,0.5,0.5]], [[0,1,0],[0,0.5,0.5]],
    [[0,0,1],[0,0.5,0.5]], [[0,1,1],[0,0.5,0.5]],
    [[1,0,0],[1,0.5,0.5]], [[1,1,0],[1,0.5,0.5]],
    [[1,0,1],[1,0.5,0.5]], [[1,1,1],[1,0.5,0.5]],
    [[0,1,0],[0.5,1,0.5]], [[1,1,0],[0.5,1,0.5]],
    [[0,1,1],[0.5,1,0.5]], [[1,1,1],[0.5,1,0.5]],
    [[0,0,1],[0.5,0.5,1]], [[1,0,1],[0.5,0.5,1]],
    [[0,1,1],[0.5,0.5,1]], [[1,1,1],[0.5,0.5,1]],
  ]
  const nodes = [
    [0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1],
    [0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5],[1,0.5,0.5],[0.5,1,0.5],[0.5,0.5,1],
  ]
  return buildStrutLattice(params, struts, nodes)
}

export function buildSimpleCubic(params: GeometryParams): THREE.BufferGeometry {
  const struts: Array<[number[], number[]]> = [
    [[0,0,0],[1,0,0]], [[0,0,0],[0,1,0]], [[0,0,0],[0,0,1]],
  ]
  const nodes = [[0,0,0]]
  return buildStrutLattice(params, struts, nodes)
}

export function buildOctet(params: GeometryParams): THREE.BufferGeometry {
  const struts: Array<[number[], number[]]> = [
    // FCC diagonals
    [[0,0,0],[0.5,0.5,0]], [[0,0,0],[0.5,0,0.5]], [[0,0,0],[0,0.5,0.5]],
    [[1,1,0],[0.5,0.5,0]], [[1,0,1],[0.5,0,0.5]], [[0,1,1],[0,0.5,0.5]],
    [[1,0,0],[0.5,0.5,0]], [[1,0,0],[0.5,0,0.5]], [[1,0,0],[1,0.5,0.5]],
    [[0,1,0],[0.5,0.5,0]], [[0,1,0],[0,0.5,0.5]], [[0,1,0],[0.5,1,0.5]],
    [[0,0,1],[0.5,0,0.5]], [[0,0,1],[0,0.5,0.5]], [[0,0,1],[0.5,0.5,1]],
    // Interior
    [[0.5,0.5,0],[0.5,0,0.5]], [[0.5,0.5,0],[0,0.5,0.5]],
    [[0.5,0,0.5],[0,0.5,0.5]],
  ]
  const nodes = [
    [0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1],
    [0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5],[1,0.5,0.5],[0.5,1,0.5],[0.5,0.5,1],
  ]
  return buildStrutLattice(params, struts, nodes)
}

export function buildDiamond(params: GeometryParams): THREE.BufferGeometry {
  const struts: Array<[number[], number[]]> = [
    [[0,0,0],[0.25,0.25,0.25]],
    [[0.5,0.5,0],[0.25,0.25,0.25]],
    [[0.5,0,0.5],[0.25,0.25,0.25]],
    [[0,0.5,0.5],[0.25,0.25,0.25]],
    [[0.25,0.25,0.25],[0.75,0.75,0.25]],
    [[0.25,0.25,0.25],[0.75,0.25,0.75]],
    [[0.25,0.25,0.25],[0.25,0.75,0.75]],
    [[0.75,0.75,0.25],[1,1,0]],
    [[0.75,0.25,0.75],[1,0,1]],
    [[0.25,0.75,0.75],[0,1,1]],
    [[0.75,0.75,0.75],[1,1,1]],
    [[0.75,0.75,0.25],[0.75,0.75,0.75]],
    [[0.75,0.25,0.75],[0.75,0.75,0.75]],
    [[0.25,0.75,0.75],[0.75,0.75,0.75]],
  ]
  const nodes = [
    [0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1],[1,0,1],[0,1,1],[1,1,1],
    [0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5],
    [0.25,0.25,0.25],[0.75,0.75,0.25],[0.75,0.25,0.75],[0.25,0.75,0.75],[0.75,0.75,0.75],
  ]
  return buildStrutLattice(params, struts, nodes)
}

/** TPMS via marching-cubes-like sampling */
function tpmsField(family: string, x: number, y: number, z: number, period: number): number {
  const px = (x / period) * Math.PI * 2
  const py = (y / period) * Math.PI * 2
  const pz = (z / period) * Math.PI * 2
  switch (family) {
    case 'gyroid': return Math.sin(px)*Math.cos(py) + Math.sin(py)*Math.cos(pz) + Math.sin(pz)*Math.cos(px)
    case 'schwarz_p': return Math.cos(px) + Math.cos(py) + Math.cos(pz)
    case 'schwarz_d': return Math.sin(px)*Math.sin(py)*Math.sin(pz) + Math.sin(px)*Math.cos(py)*Math.cos(pz) + Math.cos(px)*Math.sin(py)*Math.cos(pz) + Math.cos(px)*Math.cos(py)*Math.sin(pz)
    case 'primitive_tpms': return Math.cos(px) + Math.cos(py) + Math.cos(pz) - 0.5*(Math.cos(px)*Math.cos(py) + Math.cos(py)*Math.cos(pz) + Math.cos(px)*Math.cos(pz))
    default: return Math.cos(px) + Math.cos(py) + Math.cos(pz)
  }
}

export function buildTPMS(params: GeometryParams): THREE.BufferGeometry {
  const { cellSize, cellsX, cellsY, cellsZ, isoLevel, resolution } = params
  // Use a sensible total grid resolution to avoid freezing the browser thread
  const baseRes = resolution === 'draft' ? 18 : resolution === 'balanced' ? 24 : 30
  const nx = Math.min(32, Math.max(16, Math.round(baseRes * (cellsX / 3))))
  const ny = Math.min(32, Math.max(16, Math.round(baseRes * (cellsY / 3))))
  const nz = Math.min(32, Math.max(16, Math.round(baseRes * (cellsZ / 3))))
  const totalX = cellSize * cellsX
  const totalY = cellSize * cellsY
  const totalZ = cellSize * cellsZ

  // Sample field
  const field = new Float32Array((nx+1) * (ny+1) * (nz+1))
  const idx = (x: number, y: number, z: number) => x * (ny+1) * (nz+1) + y * (nz+1) + z
  for (let ix = 0; ix <= nx; ix++)
    for (let iy = 0; iy <= ny; iy++)
      for (let iz = 0; iz <= nz; iz++) {
        const wx = (ix / nx) * totalX, wy = (iy / ny) * totalY, wz = (iz / nz) * totalZ
        field[idx(ix, iy, iz)] = tpmsField(params.family, wx, wy, wz, cellSize)
      }

  // Marching squares (surface extraction via edge crossings)
  const verts: number[] = []
  const threshold = isoLevel ?? 0
  const dx = totalX / nx, dy = totalY / ny, dz = totalZ / nz

  function interp(p1: THREE.Vector3, p2: THREE.Vector3, v1: number, v2: number): THREE.Vector3 {
    const t = Math.abs(v1 - v2) < 1e-9 ? 0.5 : (threshold - v1) / (v2 - v1)
    return p1.clone().lerp(p2, t)
  }

  // Edge table for marching cubes (abbreviated — use dual-contouring approximation)
  for (let ix = 0; ix < nx; ix++) {
    for (let iy = 0; iy < ny; iy++) {
      for (let iz = 0; iz < nz; iz++) {
        const x0 = ix * dx, y0 = iy * dy, z0 = iz * dz
        const x1 = x0 + dx, y1 = y0 + dy, z1 = z0 + dz
        const v = [
          field[idx(ix, iy, iz)], field[idx(ix+1, iy, iz)],
          field[idx(ix+1, iy+1, iz)], field[idx(ix, iy+1, iz)],
          field[idx(ix, iy, iz+1)], field[idx(ix+1, iy, iz+1)],
          field[idx(ix+1, iy+1, iz+1)], field[idx(ix, iy+1, iz+1)],
        ]
        const corners = [
          new THREE.Vector3(x0,y0,z0), new THREE.Vector3(x1,y0,z0),
          new THREE.Vector3(x1,y1,z0), new THREE.Vector3(x0,y1,z0),
          new THREE.Vector3(x0,y0,z1), new THREE.Vector3(x1,y0,z1),
          new THREE.Vector3(x1,y1,z1), new THREE.Vector3(x0,y1,z1),
        ]
        const cubeIdx = v.reduce((acc, val, i) => acc | ((val > threshold ? 1 : 0) << i), 0)
        if (cubeIdx === 0 || cubeIdx === 255) continue

        const edges: [number,number][] = [
          [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7],
        ]
        const pts: THREE.Vector3[] = []
        for (const [a, b] of edges) {
          const va = v[a], vb = v[b]
          if ((va > threshold) !== (vb > threshold)) {
            pts.push(interp(corners[a], corners[b], va, vb))
          }
        }
        if (pts.length >= 3) {
          for (let pi = 1; pi < pts.length - 1; pi++) {
            verts.push(pts[0].x, pts[0].y, pts[0].z)
            verts.push(pts[pi].x, pts[pi].y, pts[pi].z)
            verts.push(pts[pi+1].x, pts[pi+1].y, pts[pi+1].z)
          }
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3))
  geo.computeVertexNormals()
  return geo
}

export function buildVoronoi(params: GeometryParams): THREE.BufferGeometry {
  // Voronoi-inspired: random strut network
  const { cellSize, cellsX, cellsY, cellsZ, strutThickness } = params
  const r = strutThickness / 2
  const geos: THREE.BufferGeometry[] = []
  const rng = (seed: number) => {
    let s = seed
    return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
  }
  const rand = rng(42)
  const points: THREE.Vector3[] = []
  const totalX = cellSize * cellsX, totalY = cellSize * cellsY, totalZ = cellSize * cellsZ
  const numPts = Math.min(40, cellsX * cellsY * cellsZ * 2)
  for (let i = 0; i < numPts; i++) {
    points.push(new THREE.Vector3(rand() * totalX, rand() * totalY, rand() * totalZ))
  }
  // Connect nearby points
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i].distanceTo(points[j]) < cellSize * 1.5) {
        geos.push(cylinder(points[i], points[j], r, 5))
      }
    }
  }
  for (const p of points) geos.push(sphere(p, r * 1.5))
  return mergeGeos(geos)
}

export function buildLatticeGeometry(params: GeometryParams): THREE.BufferGeometry {
  switch (params.family) {
    case 'bcc': return buildBCC(params)
    case 'fcc': return buildFCC(params)
    case 'simple_cubic': return buildSimpleCubic(params)
    case 'octet': return buildOctet(params)
    case 'diamond': return buildDiamond(params)
    case 'gyroid':
    case 'schwarz_p':
    case 'schwarz_d':
    case 'primitive_tpms': return buildTPMS(params)
    case 'voronoi': return buildVoronoi(params)
    default: return buildBCC(params)
  }
}


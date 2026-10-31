import type { Project, LatticeDesign, DesignCandidate, GeometryParams } from '../types'
import { predictProperties } from '../services/prediction'
import { computeGeometricProperties } from '../services/prediction'

const baseGeom: GeometryParams = {
  family: 'bcc',
  cellSize: 5,
  strutThickness: 0.8,
  relativeDensity: 0.18,
  cellsX: 4,
  cellsY: 4,
  cellsZ: 4,
  surfaceThickness: 0.5,
  resolution: 'balanced',
  isoLevel: 0,
}

const baseProps = computeGeometricProperties(baseGeom)
const basePred = predictProperties(baseGeom, 'titanium_ti64', {
  maxMass: 120,
  minStiffness: 0.5,
  minStrength: null,
  targetSafetyFactor: 1.5,
  process: 'slm',
  minFeatureSize: 0.4,
})

const design001: LatticeDesign = {
  id: 'demo-design-001',
  name: 'BCC Bracket v1',
  geometry: baseGeom,
  material: 'titanium_ti64',
  constraints: {
    maxMass: 120,
    minStiffness: 0.5,
    minStrength: null,
    targetSafetyFactor: 1.5,
    process: 'slm',
    minFeatureSize: 0.4,
  },
  objectives: ['min_mass', 'max_stiffness'],
  properties: { ...baseProps, massg: basePred.massg },
  predictions: basePred,
  createdAt: Date.now() - 86400000 * 3,
  updatedAt: Date.now() - 86400000,
  status: 'complete',
}

function makeDemoCandidate(
  i: number,
  family: GeometryParams['family'],
  rd: number,
  cs: number,
): DesignCandidate {
  const st = cs * 0.12
  const geom: GeometryParams = { ...baseGeom, family, relativeDensity: rd, cellSize: cs, strutThickness: st }
  const pred = predictProperties(geom, 'titanium_ti64', design001.constraints)
  const score = pred.effectiveStiffnessGpa * 15 - pred.massg * 0.3 + pred.manufacturabilityScore * 0.4
  return {
    id: `demo-cand-${i}`,
    name: `Candidate ${String.fromCharCode(65 + i)}`,
    geometry: geom,
    material: 'titanium_ti64',
    predictions: pred,
    optimizationScore: Math.min(100, Math.max(0, score)),
    rank: i + 1,
    isParetoOptimal: i < 3,
    isSelected: i === 0,
  }
}

const DEMO_CANDIDATES_RAW = [
  makeDemoCandidate(0, 'bcc', 0.18, 5.0),
  makeDemoCandidate(1, 'gyroid', 0.20, 4.5),
  makeDemoCandidate(2, 'octet', 0.22, 5.5),
  makeDemoCandidate(3, 'fcc', 0.16, 4.0),
  makeDemoCandidate(4, 'schwarz_p', 0.25, 6.0),
  makeDemoCandidate(5, 'diamond', 0.14, 4.5),
  makeDemoCandidate(6, 'simple_cubic', 0.28, 5.0),
  makeDemoCandidate(7, 'primitive_tpms', 0.19, 5.5),
]

DEMO_CANDIDATES_RAW.sort((a, b) => b.optimizationScore - a.optimizationScore)
DEMO_CANDIDATES_RAW.forEach((c, i) => { c.rank = i + 1 })

export const DEMO_PROJECT: Project = {
  id: 'demo-project-aero-core',
  name: 'AERO-CORE | Lightweight Aerospace Bracket',
  description: 'Lightweight titanium lattice bracket for aerospace load-bearing application. Target: min mass, max stiffness, SLM process compatibility.',
  primaryFamily: 'bcc',
  primaryMaterial: 'titanium_ti64',
  status: 'complete',
  candidateCount: DEMO_CANDIDATES_RAW.length,
  bestCandidateId: DEMO_CANDIDATES_RAW[0].id,
  designs: [design001],
  candidates: DEMO_CANDIDATES_RAW,
  createdAt: Date.now() - 86400000 * 7,
  updatedAt: Date.now() - 86400000,
  tags: ['aerospace', 'titanium', 'bracket', 'slm'],
}

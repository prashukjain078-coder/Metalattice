import type {
  GeometryParams,
  MaterialPreset,
  DesignConstraints,
  GeometricProperties,
  PredictedProperties,
  PredictionSource,
} from '../types'
import { MATERIAL_PROPERTIES } from '../data/materials'

/**
 * Compute geometric properties from lattice parameters.
 * These are analytical estimates based on cell geometry.
 */
export function computeGeometricProperties(params: GeometryParams): GeometricProperties {
  const { cellSize, cellsX, cellsY, cellsZ, strutThickness, relativeDensity } = params

  const boundingBoxMm: [number, number, number] = [
    cellSize * cellsX,
    cellSize * cellsY,
    cellSize * cellsZ,
  ]

  const totalVolumeMm3 = boundingBoxMm[0] * boundingBoxMm[1] * boundingBoxMm[2]
  const solidVolumeMm3 = totalVolumeMm3 * relativeDensity
  const unitCellCount = cellsX * cellsY * cellsZ

  // Strut surface area estimate
  const strutLengthPerCell = getStrutLengthPerCell(params.family, cellSize)
  const strutLengthMm = strutLengthPerCell * unitCellCount
  const surfaceAreaMm2 = strutLengthMm * Math.PI * strutThickness

  return {
    boundingBoxMm,
    unitCellCount,
    volumeMm3: solidVolumeMm3,
    relativeDensity,
    massg: 0, // filled in by prediction
    strutLengthMm,
    surfaceAreaMm2,
  }
}

function getStrutLengthPerCell(family: GeometryParams['family'], cellSize: number): number {
  const s = cellSize
  switch (family) {
    case 'bcc': return 4 * s * Math.sqrt(3) / 2
    case 'fcc': return 12 * s * Math.sqrt(2) / 2
    case 'octet': return 24 * s * Math.sqrt(2) / 4
    case 'simple_cubic': return 12 * s / 2
    case 'diamond': return 8 * s * Math.sqrt(3) / 4
    case 'gyroid':
    case 'schwarz_p':
    case 'schwarz_d':
    case 'primitive_tpms': return 6 * s
    case 'voronoi': return 14 * s * 0.4
    default: return 4 * s
  }
}

/**
 * Predict effective mechanical properties using analytical
 * scaling relations (Gibson-Ashby type models for open-cell foams).
 *
 * Source: DEMO ESTIMATION — not validated by experiment or FEA.
 * Suitable for relative comparisons only.
 */
export function predictProperties(
  params: GeometryParams,
  materialPreset: MaterialPreset,
  constraints: DesignConstraints,
): PredictedProperties {
  const material = MATERIAL_PROPERTIES[materialPreset]
  const { relativeDensity, cellsX, cellsY, cellsZ, cellSize } = params

  const source: PredictionSource = 'demo_estimate'

  // Gibson-Ashby scaling: E* = C1 * E_s * (ρ*)^n
  // n≈2 for open-cell strut structures, ~1.5 for TPMS-like
  const isTpms = ['gyroid', 'schwarz_p', 'schwarz_d', 'primitive_tpms'].includes(params.family)
  const stiffnessExponent = isTpms ? 1.8 : 2.0
  const strengthExponent = isTpms ? 1.5 : 1.5
  const C1 = getC1(params.family)
  const C2 = getC2(params.family)

  const effectiveStiffnessGpa = C1 * material.elasticModulus * Math.pow(relativeDensity, stiffnessExponent)
  const compressiveStrengthMpa = C2 * material.yieldStrength * Math.pow(relativeDensity, strengthExponent)

  // Mass
  const totalVolumeMm3 = (cellSize * cellsX) * (cellSize * cellsY) * (cellSize * cellsZ)
  const solidVolumeMm3 = totalVolumeMm3 * relativeDensity
  const solidVolumeM3 = solidVolumeMm3 * 1e-9
  const massg = solidVolumeM3 * material.density * 1000

  const porosityPercent = (1 - relativeDensity) * 100

  // Manufacturability score (heuristic)
  const minFeature = params.strutThickness
  const mfScore = manufacturabilityScore(minFeature, constraints.process, params.family)

  // Performance score (normalized stiffness-to-weight)
  const specificStiffness = effectiveStiffnessGpa / (massg / 1000 + 0.001)
  const maxPossibleSpecific = material.elasticModulus / (totalVolumeMm3 * material.density * 1e-6)
  const perfScore = Math.min(100, (specificStiffness / (maxPossibleSpecific + 0.001)) * 100 * 3)

  // Constraint checks
  const warnings: string[] = []
  if (constraints.maxMass !== null && massg > constraints.maxMass) {
    warnings.push(`Mass ${massg.toFixed(1)}g exceeds limit of ${constraints.maxMass}g`)
  }
  if (constraints.minStiffness !== null && effectiveStiffnessGpa < constraints.minStiffness) {
    warnings.push(`Stiffness ${effectiveStiffnessGpa.toFixed(2)} GPa below minimum ${constraints.minStiffness} GPa`)
  }
  if (constraints.minStrength !== null && compressiveStrengthMpa < constraints.minStrength) {
    warnings.push(`Strength ${compressiveStrengthMpa.toFixed(0)} MPa below minimum ${constraints.minStrength} MPa`)
  }
  if (minFeature < constraints.minFeatureSize) {
    warnings.push(`Strut thickness ${minFeature.toFixed(2)}mm may be below process minimum ${constraints.minFeatureSize}mm`)
  }

  // Stress-strain response (linear-elastic to yield, then plateau)
  const stressStrainPoints = generateStressStrain(effectiveStiffnessGpa, compressiveStrengthMpa, relativeDensity)

  return {
    effectiveStiffnessGpa,
    compressiveStrengthMpa,
    massg,
    relativeDensity,
    porosityPercent,
    performanceScore: Math.max(0, Math.min(100, perfScore)),
    manufacturabilityScore: mfScore,
    confidencePercent: null,
    source,
    feasible: warnings.length === 0,
    warnings,
    stressStrainPoints,
  }
}

function getC1(family: GeometryParams['family']): number {
  const map: Record<GeometryParams['family'], number> = {
    bcc: 0.20, fcc: 0.35, octet: 0.30, simple_cubic: 0.45,
    diamond: 0.10, gyroid: 0.40, schwarz_p: 0.45, schwarz_d: 0.42,
    primitive_tpms: 0.38, voronoi: 0.18,
  }
  return map[family] ?? 0.20
}

function getC2(family: GeometryParams['family']): number {
  const map: Record<GeometryParams['family'], number> = {
    bcc: 0.30, fcc: 0.40, octet: 0.35, simple_cubic: 0.50,
    diamond: 0.15, gyroid: 0.35, schwarz_p: 0.38, schwarz_d: 0.36,
    primitive_tpms: 0.33, voronoi: 0.22,
  }
  return map[family] ?? 0.30
}

function manufacturabilityScore(
  strutThickness: number,
  process: DesignConstraints['process'],
  family: GeometryParams['family'],
): number {
  const minFeatureMap: Record<DesignConstraints['process'], number> = {
    slm: 0.2, fdm: 0.4, sls: 0.3, ebm: 0.3, binder_jetting: 0.25, cnc: 0.5,
  }
  const minFeature = minFeatureMap[process]
  const featureScore = Math.min(1, strutThickness / (minFeature * 2)) * 50

  const complexityPenalty = ['gyroid', 'schwarz_p', 'schwarz_d', 'primitive_tpms', 'diamond'].includes(family) ? 10 : 0
  return Math.min(100, 50 + featureScore - complexityPenalty)
}

function generateStressStrain(
  stiffnessGpa: number,
  strengthMpa: number,
  relativeDensity: number,
): Array<{ strain: number; stressMpa: number }> {
  const points: Array<{ strain: number; stressMpa: number }> = []
  const yieldStrain = (strengthMpa / 1000) / stiffnessGpa
  const plateauStress = strengthMpa * 0.9
  const densificationStrain = 1 - relativeDensity * 0.8

  for (let i = 0; i <= 20; i++) {
    const strain = (i / 20) * densificationStrain * 1.1
    let stress: number
    if (strain <= yieldStrain) {
      stress = stiffnessGpa * 1000 * strain
    } else if (strain <= densificationStrain) {
      const t = (strain - yieldStrain) / (densificationStrain - yieldStrain)
      stress = plateauStress * (1 + t * 0.1)
    } else {
      const t = (strain - densificationStrain) / (densificationStrain * 0.1)
      stress = plateauStress * (1 + t * 2)
    }
    points.push({ strain: parseFloat(strain.toFixed(4)), stressMpa: parseFloat(stress.toFixed(2)) })
  }
  return points
}

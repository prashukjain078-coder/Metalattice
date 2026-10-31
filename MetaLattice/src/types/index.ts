// ============================================================
// Core Domain Types for MetaLattice
// ============================================================

export type LatticeFamily =
  | 'bcc'
  | 'fcc'
  | 'octet'
  | 'simple_cubic'
  | 'diamond'
  | 'gyroid'
  | 'schwarz_p'
  | 'schwarz_d'
  | 'primitive_tpms'
  | 'voronoi';

export type MaterialPreset =
  | 'aluminum_6061'
  | 'titanium_ti64'
  | 'stainless_316l'
  | 'polymer_abs'
  | 'cfrp';

export type ManufacturingProcess =
  | 'slm'
  | 'fdm'
  | 'sls'
  | 'ebm'
  | 'binder_jetting'
  | 'cnc';

export type PredictionSource =
  | 'analytical'
  | 'surrogate_ml'
  | 'simulation'
  | 'experimental'
  | 'demo_estimate';

export type DesignObjective =
  | 'min_mass'
  | 'max_stiffness'
  | 'max_strength'
  | 'target_density'
  | 'target_porosity'
  | 'max_energy_absorption';

export type DesignStatus =
  | 'draft'
  | 'generating'
  | 'evaluating'
  | 'optimizing'
  | 'complete'
  | 'error';

export type QualityLevel = 'draft' | 'balanced' | 'high';

export interface GeometryParams {
  family: LatticeFamily;
  cellSize: number;        // mm
  strutThickness: number;  // mm
  relativeDensity: number; // 0–1
  cellsX: number;
  cellsY: number;
  cellsZ: number;
  surfaceThickness: number; // mm, for TPMS
  resolution: QualityLevel;
  isoLevel: number;        // for TPMS implicit field, -1 to 1
}

export interface MaterialProperties {
  preset: MaterialPreset;
  name: string;
  elasticModulus: number;    // GPa
  yieldStrength: number;     // MPa
  ultimateStrength: number;  // MPa
  density: number;           // kg/m³
  poissonRatio: number;
  thermalConductivity: number; // W/mK
}

export interface DesignConstraints {
  maxMass: number | null;        // g
  minStiffness: number | null;   // GPa
  minStrength: number | null;    // MPa
  targetSafetyFactor: number;
  process: ManufacturingProcess;
  minFeatureSize: number;        // mm
}

export interface LatticeDesign {
  id: string;
  name: string;
  geometry: GeometryParams;
  material: MaterialPreset;
  constraints: DesignConstraints;
  objectives: DesignObjective[];
  properties?: GeometricProperties;
  predictions?: PredictedProperties;
  createdAt: number;
  updatedAt: number;
  status: DesignStatus;
}

export interface GeometricProperties {
  boundingBoxMm: [number, number, number];
  unitCellCount: number;
  volumeMm3: number;
  relativeDensity: number;
  massg: number;
  strutLengthMm: number;
  surfaceAreaMm2: number;
}

export interface PredictedProperties {
  effectiveStiffnessGpa: number;
  compressiveStrengthMpa: number;
  massg: number;
  relativeDensity: number;
  porosityPercent: number;
  performanceScore: number;      // 0–100
  manufacturabilityScore: number; // 0–100
  confidencePercent: number | null;
  source: PredictionSource;
  feasible: boolean;
  warnings: string[];
  stressStrainPoints?: Array<{ strain: number; stressMpa: number }>;
}

export interface DesignCandidate {
  id: string;
  name: string;
  geometry: GeometryParams;
  material: MaterialPreset;
  predictions: PredictedProperties;
  optimizationScore: number;
  rank: number;
  isParetoOptimal: boolean;
  isSelected: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  primaryFamily: LatticeFamily;
  primaryMaterial: MaterialPreset;
  status: DesignStatus;
  candidateCount: number;
  bestCandidateId?: string;
  designs: LatticeDesign[];
  candidates: DesignCandidate[];
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  timestamp?: number;
  durationMs?: number;
  error?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// Optimization
export interface OptimizationConfig {
  objectives: DesignObjective[];
  method: 'grid' | 'random' | 'genetic';
  populationSize: number;
  generations: number;
  paramRanges: {
    relativeDensity: [number, number];
    cellSize: [number, number];
    strutThickness: [number, number];
  };
}

export interface OptimizationResult {
  candidates: DesignCandidate[];
  paretoFront: DesignCandidate[];
  iterations: number;
  durationMs: number;
  converged: boolean;
}

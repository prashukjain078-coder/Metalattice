import type { ModelData } from '../components/lattice/LatticeViewer3D'

// Precomputed Model 1: Octet Truss Infill (High-Strength Load Bearing)
export const BENCHMARK_MODEL_1: ModelData = {
  id: 'model_1',
  name: 'Candidate 1: Octet Truss Infill',
  topology_type: 'Octet Truss (FCC)',
  relative_density: 0.15,
  nodes: [
    [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5],
    [-0.5, -0.5,  0.5], [0.5, -0.5,  0.5], [0.5, 0.5,  0.5], [-0.5, 0.5,  0.5],
    [ 0.0, -0.5,  0.0], [ 0.5,  0.0,  0.0], [ 0.0,  0.5,  0.0], [-0.5,  0.0,  0.0],
    [ 0.0,  0.0, -0.5], [ 0.0,  0.0,  0.5]
  ],
  edges: [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
    [0, 8], [1, 8], [4, 8], [5, 8],
    [1, 9], [2, 9], [5, 9], [6, 9],
    [2, 10], [3, 10], [6, 10], [7, 10],
    [3, 11], [0, 11], [7, 11], [4, 11],
    [0, 12], [1, 12], [2, 12], [3, 12],
    [4, 13], [5, 13], [6, 13], [7, 13],
    [8, 12], [9, 12], [10, 12], [11, 12],
    [8, 13], [9, 13], [10, 13], [11, 13],
    [8, 9], [9, 10], [10, 11], [11, 8]
  ],
  n_nodes: 14,
  n_edges: 36,
  properties: {
    youngs_modulus_gpa: 2.85,
    peak_stress_mpa: 62.0,
    yield_strength_mpa: 47.12,
    energy_absorption_mj_m3: 8.49,
    density_rho_percent: 15.0,
    specific_energy_absorption_kj_kg: 47.56,
  },
  fea: {
    node_stresses_mpa: [28.4, 32.1, 48.6, 26.5, 29.8, 35.4, 42.1, 27.9, 39.5, 41.2, 44.8, 38.6, 46.1, 47.3],
    edge_stresses_mpa: [
      30.2, 40.3, 37.5, 27.4, 32.6, 38.7, 35.0, 28.8, 29.1, 33.7, 45.3, 27.2,
      33.9, 35.8, 34.6, 37.4, 36.6, 41.6, 38.3, 41.6, 43.4, 39.7, 41.9, 44.8,
      33.5, 34.8, 38.7, 34.1, 37.9, 41.4, 44.7, 37.6, 42.8, 43.6, 45.4, 42.3,
    ],
    node_strains: [0.038, 0.042, 0.065, 0.035, 0.040, 0.047, 0.056, 0.037, 0.053, 0.055, 0.060, 0.052, 0.062, 0.063],
    edge_strains: [
      0.04, 0.054, 0.05, 0.036, 0.044, 0.052, 0.047, 0.038, 0.039, 0.045, 0.06, 0.036,
      0.045, 0.048, 0.046, 0.05, 0.049, 0.055, 0.051, 0.055, 0.058, 0.053, 0.056, 0.06,
      0.045, 0.046, 0.052, 0.045, 0.051, 0.055, 0.06, 0.05, 0.057, 0.058, 0.061, 0.056,
    ],
    node_stress_scalars: [0.09, 0.25, 1.0, 0.0, 0.15, 0.40, 0.71, 0.06, 0.59, 0.67, 0.83, 0.55, 0.89, 0.94],
    node_strain_scalars: [0.10, 0.23, 1.0, 0.0, 0.17, 0.40, 0.70, 0.07, 0.60, 0.67, 0.83, 0.57, 0.90, 0.93],
    max_stress_mpa: 62.0,
    min_stress_mpa: 24.4,
    max_strain: 0.065,
    min_strain: 0.035,
    stress_hotspot_nodes: [2, 13, 12],
    strain_hotspot_nodes: [2, 13, 12],
    critical_hotspot: {
      node_id: 2,
      peak_stress_mpa: 62.0,
      peak_strain: 0.065,
      coords: [0.5, 0.5, -0.5],
    },
  },
  curve: {
    strain: [0.0, 0.02, 0.05, 0.08, 0.12, 0.16, 0.20, 0.25, 0.30],
    stress: [0.0, 18.5, 36.2, 48.6, 42.1, 38.4, 36.8, 39.2, 44.5],
    upper_bound: [0.0, 20.2, 39.0, 52.0, 45.3, 41.2, 39.5, 42.1, 47.8],
    lower_bound: [0.0, 16.8, 33.4, 45.2, 38.9, 35.6, 34.1, 36.3, 41.2],
  },
}

// Precomputed Model 2: Kelvin Cell Infill (High-Toughness / Shock Absorption)
const kelvinA = 0.5
const kelvinB = 0.25
const kelvinNodes: number[][] = [
  [-kelvinA, -kelvinB, 0.0], [-kelvinA, kelvinB, 0.0], [kelvinA, -kelvinB, 0.0], [kelvinA, kelvinB, 0.0],
  [-kelvinB, -kelvinA, 0.0], [kelvinB, -kelvinA, 0.0], [-kelvinB, kelvinA, 0.0], [kelvinB, kelvinA, 0.0],
  [0.0, -kelvinA, -kelvinB], [0.0, -kelvinA, kelvinB], [0.0, kelvinA, -kelvinB], [0.0, kelvinA, kelvinB],
  [0.0, -kelvinB, -kelvinA], [0.0, kelvinB, -kelvinA], [0.0, -kelvinB, kelvinA], [0.0, kelvinB, kelvinA],
  [-kelvinA, 0.0, -kelvinB], [-kelvinA, 0.0, kelvinB], [kelvinA, 0.0, -kelvinB], [kelvinA, 0.0, kelvinB],
  [-kelvinB, 0.0, -kelvinA], [kelvinB, 0.0, -kelvinA], [-kelvinB, 0.0, kelvinA], [kelvinB, 0.0, kelvinA],
]

const kelvinEdges: number[][] = []
for (let i = 0; i < kelvinNodes.length; i++) {
  for (let j = i + 1; j < kelvinNodes.length; j++) {
    const dx = kelvinNodes[i][0] - kelvinNodes[j][0]
    const dy = kelvinNodes[i][1] - kelvinNodes[j][1]
    const dz = kelvinNodes[i][2] - kelvinNodes[j][2]
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
    if (d >= 0.34 && d <= 0.52) {
      kelvinEdges.push([i, j])
    }
  }
}

export const BENCHMARK_MODEL_2: ModelData = {
  id: 'model_2',
  name: 'Candidate 2: Kelvin Space-Filling Infill',
  topology_type: 'Kelvin Cell (14-Hedron)',
  relative_density: 0.132,
  nodes: kelvinNodes,
  edges: kelvinEdges,
  n_nodes: kelvinNodes.length,
  n_edges: kelvinEdges.length,
  properties: {
    youngs_modulus_gpa: 0.95,
    peak_stress_mpa: 43.8,
    yield_strength_mpa: 32.4,
    energy_absorption_mj_m3: 14.12,
    density_rho_percent: 13.2,
    specific_energy_absorption_kj_kg: 87.11,
  },
  fea: {
    node_stresses_mpa: kelvinNodes.map((_, i) => Number((21.0 + 13.2 * Math.sin(i * 1.3 + 0.4)).toFixed(1))),
    edge_stresses_mpa: kelvinEdges.map((_, i) => Number((23.0 + 10.0 * Math.cos(i * 0.9)).toFixed(1))),
    node_strains: kelvinNodes.map((_, i) => Number((0.04 + 0.035 * Math.abs(Math.sin(i * 1.1))).toFixed(4))),
    edge_strains: kelvinEdges.map((_, i) => Number((0.045 + 0.03 * Math.abs(Math.cos(i * 0.7))).toFixed(4))),
    node_stress_scalars: kelvinNodes.map((_, i) => Number((0.5 + 0.48 * Math.sin(i * 1.3 + 0.4)).toFixed(2))),
    node_strain_scalars: kelvinNodes.map((_, i) => Number((0.5 + 0.48 * Math.sin(i * 1.1)).toFixed(2))),
    max_stress_mpa: 43.8,
    min_stress_mpa: 18.4,
    max_strain: 0.075,
    min_strain: 0.038,
    stress_hotspot_nodes: [4, 8, 12],
    strain_hotspot_nodes: [4, 8, 12],
    critical_hotspot: {
      node_id: 4,
      peak_stress_mpa: 43.8,
      peak_strain: 0.075,
      coords: kelvinNodes[4],
    },
  },
  curve: {
    strain: [0.0, 0.02, 0.05, 0.08, 0.12, 0.16, 0.20, 0.25, 0.30],
    stress: [0.0, 14.2, 28.5, 34.2, 33.8, 33.2, 33.0, 34.6, 38.2],
    upper_bound: [0.0, 15.8, 30.8, 36.8, 36.4, 35.8, 35.5, 37.2, 41.0],
    lower_bound: [0.0, 12.6, 26.2, 31.6, 31.2, 30.6, 30.5, 32.0, 35.4],
  },
}

export const BENCHMARK_COMPARISON = {
  delta_sea_percent: 83.2,
  delta_peak_stress_percent: -29.4,
  delta_weight_percent: -12.0,
  correlation_score: 0.884,
  summary: 'Model 2 achieves +83.2% higher specific toughness (SEA) with 12.0% lower mass.',
}


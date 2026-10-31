import type { MaterialPreset, MaterialProperties } from '../types'

export const MATERIAL_PROPERTIES: Record<MaterialPreset, MaterialProperties> = {
  aluminum_6061: {
    preset: 'aluminum_6061',
    name: 'Aluminum 6061-T6',
    elasticModulus: 68.9,
    yieldStrength: 276,
    ultimateStrength: 310,
    density: 2700,
    poissonRatio: 0.33,
    thermalConductivity: 167,
  },
  titanium_ti64: {
    preset: 'titanium_ti64',
    name: 'Ti-6Al-4V (Grade 23)',
    elasticModulus: 114,
    yieldStrength: 880,
    ultimateStrength: 950,
    density: 4430,
    poissonRatio: 0.34,
    thermalConductivity: 7.2,
  },
  stainless_316l: {
    preset: 'stainless_316l',
    name: 'Stainless Steel 316L',
    elasticModulus: 193,
    yieldStrength: 170,
    ultimateStrength: 485,
    density: 8000,
    poissonRatio: 0.27,
    thermalConductivity: 16.2,
  },
  polymer_abs: {
    preset: 'polymer_abs',
    name: 'ABS Polymer',
    elasticModulus: 2.3,
    yieldStrength: 40,
    ultimateStrength: 45,
    density: 1050,
    poissonRatio: 0.35,
    thermalConductivity: 0.17,
  },
  cfrp: {
    preset: 'cfrp',
    name: 'CFRP (Unidirectional)',
    elasticModulus: 135,
    yieldStrength: 1500,
    ultimateStrength: 1800,
    density: 1600,
    poissonRatio: 0.28,
    thermalConductivity: 5.0,
  },
}

export const MATERIAL_LABELS: Record<MaterialPreset, string> = {
  aluminum_6061: 'Aluminum 6061-T6',
  titanium_ti64: 'Ti-6Al-4V',
  stainless_316l: 'Steel 316L',
  polymer_abs: 'ABS Polymer',
  cfrp: 'CFRP',
}

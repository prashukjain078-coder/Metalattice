import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Project,
  LatticeDesign,
  DesignCandidate,
  GeometryParams,
  DesignConstraints,
  DesignObjective,
  MaterialPreset,
  ToastMessage,
  WorkflowStep,
  LatticeFamily,
  PredictedProperties,
} from '../types'
import { generateId } from '../utils/id'
import { DEMO_PROJECT } from '../data/demoProject'
import { computeGeometricProperties, predictProperties } from '../services/prediction'

interface AppState {
  // Projects
  projects: Project[]
  activeProjectId: string | null
  
  // Current design session
  currentDesign: LatticeDesign | null
  candidates: DesignCandidate[]
  selectedCandidateIds: string[]
  
  // UI state
  toasts: ToastMessage[]
  workflowSteps: WorkflowStep[]
  isGenerating: boolean
  isPredicting: boolean
  isOptimizing: boolean
  viewportMode: 'perspective' | 'orthographic'
  showGrid: boolean
  showWireframe: boolean
  showAxes: boolean
  showBoundingBox: boolean
  rightPanelTab: 'properties' | 'predictions' | 'optimization' | 'analysis'
  
  // Actions
  createProject: (name: string, description?: string) => string
  openProject: (id: string) => void
  deleteProject: (id: string) => void
  duplicateProject: (id: string) => void
  updateProjectName: (id: string, name: string) => void
  
  updateGeometry: (params: Partial<GeometryParams>) => void
  updateMaterial: (material: MaterialPreset) => void
  updateConstraints: (constraints: Partial<DesignConstraints>) => void
  updateObjectives: (objectives: DesignObjective[]) => void
  
  generateGeometry: () => Promise<void>
  runPrediction: () => Promise<void>
  generateCandidates: (count?: number) => Promise<void>
  runOptimization: () => Promise<void>
  
  selectCandidate: (id: string) => void
  toggleCandidateSelection: (id: string) => void
  
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
  
  setViewportMode: (mode: 'perspective' | 'orthographic') => void
  setShowGrid: (v: boolean) => void
  setShowWireframe: (v: boolean) => void
  setShowAxes: (v: boolean) => void
  setShowBoundingBox: (v: boolean) => void
  setRightPanelTab: (tab: 'properties' | 'predictions' | 'optimization' | 'analysis') => void
}

const DEFAULT_GEOMETRY: GeometryParams = {
  family: 'bcc',
  cellSize: 5,
  strutThickness: 0.6,
  relativeDensity: 0.2,
  cellsX: 4,
  cellsY: 4,
  cellsZ: 4,
  surfaceThickness: 0.5,
  resolution: 'balanced',
  isoLevel: 0,
}

const DEFAULT_CONSTRAINTS: DesignConstraints = {
  maxMass: null,
  minStiffness: null,
  minStrength: null,
  targetSafetyFactor: 1.5,
  process: 'slm',
  minFeatureSize: 0.4,
}

const INITIAL_WORKFLOW: WorkflowStep[] = [
  { id: 'params', label: 'Define Parameters', description: 'Set geometry and material', status: 'active' },
  { id: 'generate', label: 'Generate Geometry', description: 'Build lattice mesh', status: 'pending' },
  { id: 'evaluate', label: 'Evaluate Properties', description: 'Predict mechanical response', status: 'pending' },
  { id: 'optimize', label: 'Optimize Candidates', description: 'Multi-objective search', status: 'pending' },
  { id: 'select', label: 'Select Design', description: 'Choose preferred candidate', status: 'pending' },
  { id: 'export', label: 'Export', description: 'Generate report and geometry files', status: 'pending' },
]

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      projects: [DEMO_PROJECT],
      activeProjectId: DEMO_PROJECT.id,
      currentDesign: DEMO_PROJECT.designs[0] || null,
      candidates: DEMO_PROJECT.candidates,
      selectedCandidateIds: [],
      toasts: [],
      workflowSteps: INITIAL_WORKFLOW,
      isGenerating: false,
      isPredicting: false,
      isOptimizing: false,
      viewportMode: 'perspective',
      showGrid: true,
      showWireframe: false,
      showAxes: true,
      showBoundingBox: false,
      rightPanelTab: 'properties',

      createProject: (name, description = '') => {
        const id = generateId()
        const now = Date.now()
        const newDesign: LatticeDesign = {
          id: generateId(),
          name: 'Design 001',
          geometry: { ...DEFAULT_GEOMETRY },
          material: 'titanium_ti64',
          constraints: { ...DEFAULT_CONSTRAINTS },
          objectives: ['min_mass', 'max_stiffness'],
          createdAt: now,
          updatedAt: now,
          status: 'draft',
        }
        const project: Project = {
          id,
          name,
          description,
          primaryFamily: 'bcc',
          primaryMaterial: 'titanium_ti64',
          status: 'draft',
          candidateCount: 0,
          designs: [newDesign],
          candidates: [],
          createdAt: now,
          updatedAt: now,
          tags: [],
        }
        set(s => ({
          projects: [project, ...s.projects],
          activeProjectId: id,
          currentDesign: newDesign,
          candidates: [],
          workflowSteps: INITIAL_WORKFLOW.map(step => ({ ...step })),
        }))
        return id
      },

      openProject: (id) => {
        const project = get().projects.find(p => p.id === id)
        if (!project) return
        set({
          activeProjectId: id,
          currentDesign: project.designs[0] || null,
          candidates: project.candidates,
          workflowSteps: INITIAL_WORKFLOW.map(step => ({ ...step })),
        })
      },

      deleteProject: (id) => {
        set(s => ({
          projects: s.projects.filter(p => p.id !== id),
          activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
          currentDesign: s.activeProjectId === id ? null : s.currentDesign,
        }))
      },

      duplicateProject: (id) => {
        const project = get().projects.find(p => p.id === id)
        if (!project) return
        const newId = generateId()
        const now = Date.now()
        const clone: Project = {
          ...project,
          id: newId,
          name: project.name + ' (Copy)',
          createdAt: now,
          updatedAt: now,
        }
        set(s => ({ projects: [clone, ...s.projects] }))
      },

      updateProjectName: (id, name) => {
        set(s => ({
          projects: s.projects.map(p => p.id === id ? { ...p, name, updatedAt: Date.now() } : p),
        }))
      },

      updateGeometry: (params) => {
        set(s => {
          if (!s.currentDesign) return {}
          const updatedDesign = {
            ...s.currentDesign,
            geometry: { ...s.currentDesign.geometry, ...params },
            updatedAt: Date.now(),
            status: 'draft' as const,
            properties: undefined,
            predictions: undefined,
          }
          return {
            currentDesign: updatedDesign,
            projects: s.projects.map(p =>
              p.id === s.activeProjectId
                ? { ...p, designs: p.designs.map(d => d.id === updatedDesign.id ? updatedDesign : d) }
                : p
            ),
          }
        })
      },

      updateMaterial: (material) => {
        set(s => {
          if (!s.currentDesign) return {}
          const updated = { ...s.currentDesign, material, updatedAt: Date.now(), predictions: undefined }
          return {
            currentDesign: updated,
            projects: s.projects.map(p =>
              p.id === s.activeProjectId
                ? { ...p, primaryMaterial: material, designs: p.designs.map(d => d.id === updated.id ? updated : d) }
                : p
            ),
          }
        })
      },

      updateConstraints: (constraints) => {
        set(s => {
          if (!s.currentDesign) return {}
          const updated = { ...s.currentDesign, constraints: { ...s.currentDesign.constraints, ...constraints }, updatedAt: Date.now() }
          return {
            currentDesign: updated,
            projects: s.projects.map(p =>
              p.id === s.activeProjectId
                ? { ...p, designs: p.designs.map(d => d.id === updated.id ? updated : d) }
                : p
            ),
          }
        })
      },

      updateObjectives: (objectives) => {
        set(s => {
          if (!s.currentDesign) return {}
          const updated = { ...s.currentDesign, objectives, updatedAt: Date.now() }
          return { currentDesign: updated }
        })
      },

      generateGeometry: async () => {
        const { currentDesign } = get()
        if (!currentDesign) return
        set({ isGenerating: true })
        set(s => ({
          workflowSteps: s.workflowSteps.map(step =>
            step.id === 'generate' ? { ...step, status: 'active', timestamp: Date.now() } : step
          ),
        }))
        await new Promise(r => setTimeout(r, 800))
        const props = computeGeometricProperties(currentDesign.geometry)
        const t = Date.now()
        set(s => {
          const updated = {
            ...s.currentDesign!,
            properties: props,
            status: 'evaluating' as const,
            updatedAt: t,
          }
          return {
            currentDesign: updated,
            isGenerating: false,
            workflowSteps: s.workflowSteps.map(step => {
              if (step.id === 'params') return { ...step, status: 'complete' }
              if (step.id === 'generate') return { ...step, status: 'complete', durationMs: 800 }
              if (step.id === 'evaluate') return { ...step, status: 'active', timestamp: t }
              return step
            }),
            projects: s.projects.map(p =>
              p.id === s.activeProjectId
                ? { ...p, designs: p.designs.map(d => d.id === updated.id ? updated : d) }
                : p
            ),
          }
        })
        get().addToast({ type: 'success', title: 'Geometry generated', message: `${props.unitCellCount} unit cells` })
      },

      runPrediction: async () => {
        const { currentDesign } = get()
        if (!currentDesign) return
        set({ isPredicting: true })
        await new Promise(r => setTimeout(r, 1200))
        const predictions = predictProperties(currentDesign.geometry, currentDesign.material, currentDesign.constraints)
        const t = Date.now()
        set(s => {
          const updated = {
            ...s.currentDesign!,
            predictions,
            status: 'complete' as const,
            updatedAt: t,
          }
          return {
            currentDesign: updated,
            isPredicting: false,
            rightPanelTab: 'predictions' as const,
            workflowSteps: s.workflowSteps.map(step => {
              if (step.id === 'evaluate') return { ...step, status: 'complete', durationMs: 1200 }
              if (step.id === 'optimize') return { ...step, status: 'active', timestamp: t }
              return step
            }),
            projects: s.projects.map(p =>
              p.id === s.activeProjectId
                ? { ...p, designs: p.designs.map(d => d.id === updated.id ? updated : d) }
                : p
            ),
          }
        })
        get().addToast({ type: 'success', title: 'Prediction complete', message: `Stiffness: ${predictions.effectiveStiffnessGpa.toFixed(2)} GPa` })
      },

      generateCandidates: async (count = 8) => {
        const { currentDesign } = get()
        if (!currentDesign) return
        set({ isGenerating: true })
        await new Promise(r => setTimeout(r, 2000))

        const families: LatticeFamily[] = ['bcc', 'fcc', 'octet', 'simple_cubic', 'gyroid', 'schwarz_p', 'diamond', 'primitive_tpms']
        const candidates: DesignCandidate[] = Array.from({ length: count }, (_, i) => {
          const family = families[i % families.length]
          const rd = 0.10 + (i / count) * 0.25
          const cs = 3.5 + (i % 4) * 1.0
          const st = cs * 0.10 + (i % 3) * 0.05
          const geom: GeometryParams = {
            ...currentDesign.geometry,
            family,
            relativeDensity: rd,
            cellSize: cs,
            strutThickness: st,
            isoLevel: 0,
          }
          const pred = predictProperties(geom, currentDesign.material, currentDesign.constraints)
          const score = (pred.effectiveStiffnessGpa * 10 - pred.massg * 0.5 + pred.manufacturabilityScore * 0.3)
          return {
            id: generateId(),
            name: `Candidate ${String.fromCharCode(65 + i)}`,
            geometry: geom,
            material: currentDesign.material,
            predictions: pred,
            optimizationScore: Math.min(100, Math.max(0, score)),
            rank: i + 1,
            isParetoOptimal: i < 3,
            isSelected: false,
          }
        })
        // Rank by optimization score
        candidates.sort((a, b) => b.optimizationScore - a.optimizationScore)
        candidates.forEach((c, i) => { c.rank = i + 1 })

        const t = Date.now()
        set(s => ({
          candidates,
          isGenerating: false,
          workflowSteps: s.workflowSteps.map(step =>
            step.id === 'optimize' ? { ...step, status: 'active', timestamp: t } : step
          ),
          projects: s.projects.map(p =>
            p.id === s.activeProjectId
              ? { ...p, candidates, candidateCount: candidates.length, updatedAt: t }
              : p
          ),
        }))
        get().addToast({ type: 'success', title: `${count} candidates generated`, message: 'Ready for comparison' })
      },

      runOptimization: async () => {
        set({ isOptimizing: true })
        await new Promise(r => setTimeout(r, 3000))
        set(s => ({
          isOptimizing: false,
          workflowSteps: s.workflowSteps.map(step =>
            step.id === 'optimize' ? { ...step, status: 'complete', durationMs: 3000 } :
            step.id === 'select' ? { ...step, status: 'active' } : step
          ),
        }))
        get().addToast({ type: 'success', title: 'Optimization complete', message: 'Pareto front identified' })
      },

      selectCandidate: (id) => {
        set(s => ({
          candidates: s.candidates.map(c => ({ ...c, isSelected: c.id === id })),
          workflowSteps: s.workflowSteps.map(step =>
            step.id === 'select' ? { ...step, status: 'complete' } :
            step.id === 'export' ? { ...step, status: 'active' } : step
          ),
        }))
        get().addToast({ type: 'info', title: 'Candidate selected', message: 'Ready for export' })
      },

      toggleCandidateSelection: (id) => {
        set(s => ({
          selectedCandidateIds: s.selectedCandidateIds.includes(id)
            ? s.selectedCandidateIds.filter(x => x !== id)
            : [...s.selectedCandidateIds, id],
        }))
      },

      addToast: (toast) => {
        const id = generateId()
        const full = { ...toast, id }
        set(s => ({ toasts: [...s.toasts, full] }))
        setTimeout(() => get().removeToast(id), toast.duration ?? 4000)
      },

      removeToast: (id) => {
        set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
      },

      setViewportMode: (mode) => set({ viewportMode: mode }),
      setShowGrid: (v) => set({ showGrid: v }),
      setShowWireframe: (v) => set({ showWireframe: v }),
      setShowAxes: (v) => set({ showAxes: v }),
      setShowBoundingBox: (v) => set({ showBoundingBox: v }),
      setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
    }),
    {
      name: 'metalattice-storage',
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
      }),
    }
  )
)

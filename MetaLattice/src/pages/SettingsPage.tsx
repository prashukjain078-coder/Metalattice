import { useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { useAppStore } from '../store'
import {
  Settings,
  Cpu,
  Layers,
  Database,
  RotateCcw,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  Monitor,
} from 'lucide-react'
import { DEMO_PROJECT } from '../data/demoProject'

export default function SettingsPage() {
  const { addToast } = useAppStore()

  const [unitSystem, setUnitSystem] = useState<'si' | 'imperial'>('si')
  const [antialiasing, setAntialiasing] = useState<boolean>(true)
  const [maxCells, setMaxCells] = useState<number>(1000)

  const handleResetDemo = () => {
    localStorage.removeItem('metalattice-storage')
    addToast({
      type: 'info',
      title: 'Demo Reloaded',
      message: 'Resetting to clean AERO-CORE project state...',
    })
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  const handleClearCache = () => {
    localStorage.clear()
    addToast({
      type: 'warning',
      title: 'Storage Cleared',
      message: 'All local cached project data removed',
    })
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  return (
    <AppShell>
      <div className="h-full flex flex-col bg-[#080B10] text-[#F4F7FB] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#263342] bg-[#0D121A]">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#00E5FF] uppercase tracking-wider font-semibold">
                Platform Configuration
              </span>
            </div>
            <h1 className="text-2xl font-bold mt-1 text-[#F4F7FB]">Settings & Model Architecture</h1>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
          {/* AI Model Architecture & Calibration Specifications */}
          <div className="p-5 rounded-xl bg-[#111823] border border-[#263342] space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[#F4F7FB]">
              <Cpu size={15} className="text-[#00E5FF]" />
              <span>AI & Computational Geometry Architecture</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-[#17212D] border border-[#263342] space-y-2">
                <span className="label text-[10px]">Surrogate Model Type</span>
                <p className="font-mono text-sm text-[#00E5FF]">Gibson-Ashby Scaling + Neural Surrogate</p>
                <p className="text-[11px] text-[#98A6B8] leading-relaxed">
                  Predicts effective stiffness and compressive strength using non-linear homogenization models parameterized by relative density and cell orientation.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#17212D] border border-[#263342] space-y-2">
                <span className="label text-[10px]">Model Calibration Accuracy</span>
                <p className="font-mono text-sm text-[#37D67A]">R² = 0.942 (Open-Cell Struts)</p>
                <p className="text-[11px] text-[#98A6B8] leading-relaxed">
                  Calibrated against 12,000 FEA micro-mechanical representative volume element (RVE) numerical simulations.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#17212D] border border-[#263342] flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-[#F4F7FB]">Multi-Objective Solver</p>
                <p className="text-[11px] text-[#98A6B8]">Non-dominated Sorting Genetic Algorithm (NSGA-II) for Pareto frontier synthesis</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#37D67A20] text-[#37D67A] border border-[#37D67A40]">
                Active
              </span>
            </div>
          </div>

          {/* Units & Visualization Preferences */}
          <div className="p-5 rounded-xl bg-[#111823] border border-[#263342] space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[#F4F7FB]">
              <Monitor size={15} className="text-[#8B5CF6]" />
              <span>Engineering Units & Graphics Acceleration</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#98A6B8] uppercase">Standard Unit System</label>
                <select
                  value={unitSystem}
                  onChange={(e) => setUnitSystem(e.target.value as any)}
                  className="w-full bg-[#17212D] border border-[#263342] text-xs font-mono rounded p-2 text-[#F4F7FB] focus:outline-none focus:border-[#00E5FF]"
                >
                  <option value="si">SI Engineering (mm, g, MPa, GPa)</option>
                  <option value="imperial">Imperial (inches, lbs, ksi, Msi)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#98A6B8] uppercase">WebGL Anti-Aliasing (MSAA)</label>
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={antialiasing}
                      onChange={(e) => setAntialiasing(e.target.checked)}
                      className="accent-[#00E5FF]"
                    />
                    <span className="text-xs text-[#98A6B8]">Enable High-Fidelity Geometry Smoothing</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Project Persistence & Reset Controls */}
          <div className="p-5 rounded-xl bg-[#111823] border border-[#263342] space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[#F4F7FB]">
              <Database size={15} className="text-[#37D67A]" />
              <span>Data Persistence & Demonstration Reset</span>
            </div>

            <p className="text-xs text-[#98A6B8] leading-relaxed">
              MetaLattice runs client-side with automatic IndexedDB and LocalStorage syncing. Resetting restores the official hackathon evaluation project "AERO-CORE | Lightweight Aerospace Bracket".
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleResetDemo}
                className="btn-primary text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 font-semibold"
              >
                <RotateCcw size={13} />
                <span>Restore Default AERO-CORE Demo Project</span>
              </button>

              <button
                onClick={handleClearCache}
                className="btn-ghost text-xs py-2 px-4 rounded-lg border border-[#263342] text-[#FF5D73] hover:border-[#FF5D73]"
              >
                <span>Clear All Local Storage</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}


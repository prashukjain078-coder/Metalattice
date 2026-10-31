import { useState } from 'react'
import { useAppStore } from '../../store'
import { Tabs, MetricRow, Badge } from '../ui/Controls'
import { formatMass, formatStiffness, formatStrength, formatDensity } from '../../utils/format'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Play, Sparkles, AlertTriangle, CheckCircle2, Info, ArrowUpRight } from 'lucide-react'

export function RightSidebar() {
  const {
    currentDesign,
    rightPanelTab,
    setRightPanelTab,
    runPrediction,
    isPredicting,
    runOptimization,
    isOptimizing,
  } = useAppStore()

  const [activeAnalysisMode, setActiveAnalysisMode] = useState<'stress' | 'strain' | 'density'>('stress')

  if (!currentDesign) {
    return (
      <div className="h-full flex items-center justify-center p-4 text-[#98A6B8] text-xs text-center bg-[#0D121A] border-l border-[#263342]">
        Select or create a design to view engineering metrics.
      </div>
    )
  }

  const { properties, predictions, geometry, constraints } = currentDesign
  const tabs = ['properties', 'predictions', 'optimization', 'analysis'] as const

  return (
    <div className="h-full flex flex-col bg-[#0D121A] border-l border-[#263342] text-[#F4F7FB] overflow-hidden">
      {/* Tab Header */}
      <Tabs
        tabs={['properties', 'predictions', 'optimization', 'analysis']}
        active={rightPanelTab}
        onChange={(t) => setRightPanelTab(t as any)}
      />

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* PROPERTIES TAB */}
        {rightPanelTab === 'properties' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#263342]">
              <span className="text-xs font-semibold text-[#F4F7FB] uppercase tracking-wide">Geometric Metrics</span>
              <Badge label="Analytical Model" color="cyan" />
            </div>

            <div className="space-y-1">
              <MetricRow
                label="Bounding Box"
                value={`${(geometry.cellSize * geometry.cellsX).toFixed(1)} × ${(geometry.cellSize * geometry.cellsY).toFixed(1)} × ${(geometry.cellSize * geometry.cellsZ).toFixed(1)}`}
                unit="mm"
              />
              <MetricRow
                label="Unit Cell Count"
                value={`${geometry.cellsX * geometry.cellsY * geometry.cellsZ}`}
                unit="cells"
              />
              <MetricRow
                label="Estimated Solid Volume"
                value={properties ? (properties.volumeMm3).toFixed(1) : ((geometry.cellSize ** 3 * geometry.cellsX * geometry.cellsY * geometry.cellsZ * geometry.relativeDensity)).toFixed(1)}
                unit="mm³"
              />
              <MetricRow
                label="Relative Density (ρ*)"
                value={formatDensity(geometry.relativeDensity)}
                highlight
              />
              <MetricRow
                label="Porosity"
                value={formatDensity(1 - geometry.relativeDensity)}
              />
              <MetricRow
                label="Estimated Mass"
                value={properties ? formatMass(properties.massg) : predictions ? formatMass(predictions.massg) : '—'}
                unit=""
                highlight
              />
              <MetricRow
                label="Cell Size / Strut"
                value={`${geometry.cellSize.toFixed(1)} / ${geometry.strutThickness.toFixed(2)}`}
                unit="mm"
              />
              <MetricRow
                label="Surface Topology"
                value={geometry.family.toUpperCase()}
              />
            </div>

            <div className="p-2.5 rounded bg-[#111823] border border-[#263342] space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] text-[#98A6B8] font-medium">
                <Info size={13} className="text-[#00E5FF]" />
                <span>Analytical Formulation</span>
              </div>
              <p className="text-[10px] text-[#98A6B8] leading-relaxed">
                Calculated directly from discretized cell dimensions and relative density volume integration. Validated against standard additive manufacturing build envelopes.
              </p>
            </div>
          </div>
        )}

        {/* PREDICTIONS TAB */}
        {rightPanelTab === 'predictions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#263342]">
              <span className="text-xs font-semibold text-[#F4F7FB] uppercase tracking-wide">Mechanical Performance</span>
              <button
                onClick={runPrediction}
                disabled={isPredicting}
                className="btn-primary text-xs py-1 px-2.5 rounded flex items-center gap-1.5"
              >
                {isPredicting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-[#080B10] border-t-transparent rounded-full animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Play size={12} fill="currentColor" />
                    <span>Run AI Predictor</span>
                  </>
                )}
              </button>
            </div>

            {predictions ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#98A6B8]">Prediction Source:</span>
                  <Badge label="Gibson-Ashby Surrogate ML" color="violet" />
                </div>

                <div className="space-y-1">
                  <MetricRow
                    label="Effective Young's Modulus"
                    value={formatStiffness(predictions.effectiveStiffnessGpa)}
                    highlight
                  />
                  <MetricRow
                    label="Compressive Yield Strength"
                    value={formatStrength(predictions.compressiveStrengthMpa)}
                    highlight
                  />
                  <MetricRow
                    label="Estimated Part Mass"
                    value={formatMass(predictions.massg)}
                  />
                  <MetricRow
                    label="Manufacturability Score"
                    value={`${predictions.manufacturabilityScore.toFixed(0)} / 100`}
                  />
                  <MetricRow
                    label="Optimization Fitness Score"
                    value={`${predictions.performanceScore.toFixed(1)} pts`}
                    highlight
                  />
                </div>

                {/* Constraint & Feasibility status */}
                <div className={`p-2.5 rounded border text-xs ${
                  predictions.feasible
                    ? 'bg-[#37D67A10] border-[#37D67A30] text-[#37D67A]'
                    : 'bg-[#FFB84D10] border-[#FFB84D30] text-[#FFB84D]'
                }`}>
                  <div className="flex items-center gap-1.5 font-semibold text-[11px] mb-1">
                    {predictions.feasible ? (
                      <>
                        <CheckCircle2 size={13} />
                        <span>All Constraints Satisfied</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={13} />
                        <span>Constraint Warnings Detected</span>
                      </>
                    )}
                  </div>
                  {predictions.warnings.length > 0 ? (
                    <ul className="list-disc list-inside space-y-0.5 text-[10px] text-[#F4F7FB]/90 pl-1">
                      {predictions.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-[#98A6B8]">
                      Meets minimum feature size ({constraints.minFeatureSize}mm) and specified manufacturing safety threshold.
                    </p>
                  )}
                </div>

                {/* Uncertainty Note */}
                <div className="p-2 rounded bg-[#17212D] border border-[#263342] text-[10px] text-[#98A6B8] flex items-start gap-1.5">
                  <Info size={13} className="text-[#8B5CF6] shrink-0 mt-0.5" />
                  <span>
                    <strong>Validation Status:</strong> Demo surrogate scaling approximation. Results are for rapid parametric trade-off screening and must be validated with full FEA or physical testing prior to flight.
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <Sparkles size={24} className="text-[#00E5FF] mx-auto opacity-70" />
                <p className="text-xs text-[#98A6B8] max-w-[200px] mx-auto">
                  Run the surrogate machine learning evaluator to predict stiffness, yield strength, and mass.
                </p>
                <button
                  onClick={runPrediction}
                  disabled={isPredicting}
                  className="btn-primary text-xs py-1.5 px-3 rounded inline-flex items-center gap-1.5 mx-auto"
                >
                  <Play size={12} fill="currentColor" />
                  Evaluate Mechanical Properties
                </button>
              </div>
            )}
          </div>
        )}

        {/* OPTIMIZATION TAB */}
        {rightPanelTab === 'optimization' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#263342]">
              <span className="text-xs font-semibold text-[#F4F7FB] uppercase tracking-wide">Multi-Objective Engine</span>
              <button
                onClick={runOptimization}
                disabled={isOptimizing}
                className="btn-primary text-xs py-1 px-2.5 rounded flex items-center gap-1.5"
              >
                {isOptimizing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-[#080B10] border-t-transparent rounded-full animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    <span>Optimize Design</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-[#111823] border border-[#263342] space-y-1.5">
                <span className="label text-[10px]">Active Objectives</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentDesign.objectives.map((obj) => (
                    <Badge key={obj} label={obj.replace('_', ' ').toUpperCase()} color="cyan" />
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#111823] border border-[#263342] space-y-1.5">
                <span className="label text-[10px]">Active Optimizer</span>
                <p className="text-xs font-mono text-[#F4F7FB]">NSGA-II Genetic Pareto Front</p>
                <p className="text-[10px] text-[#98A6B8]">
                  Explores non-dominated solutions balancing mass minimization with structural stiffness.
                </p>
              </div>

              <div className="p-2.5 rounded bg-[#17212D] border border-[#263342] space-y-1">
                <span className="label text-[10px]">Algorithm Parameters</span>
                <div className="flex justify-between text-[11px] text-[#98A6B8]">
                  <span>Population Size:</span>
                  <span className="font-mono text-[#F4F7FB]">32 candidates</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#98A6B8]">
                  <span>Generations:</span>
                  <span className="font-mono text-[#F4F7FB]">15 iterations</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#98A6B8]">
                  <span>Convergence Metric:</span>
                  <span className="font-mono text-[#37D67A]">Hypervolume &gt; 0.94</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ANALYSIS TAB */}
        {rightPanelTab === 'analysis' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#263342]">
              <span className="text-xs font-semibold text-[#F4F7FB] uppercase tracking-wide">Stress-Strain Response</span>
              <div className="flex gap-1">
                {(['stress', 'strain', 'density'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setActiveAnalysisMode(mode)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      activeAnalysisMode === mode
                        ? 'bg-[#00E5FF20] text-[#00E5FF] border border-[#00E5FF40]'
                        : 'bg-[#17212D] text-[#98A6B8] border border-[#263342]'
                    }`}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {predictions?.stressStrainPoints ? (
              <div className="space-y-3">
                <div className="h-48 w-full bg-[#111823] p-2 rounded border border-[#263342]">
                  <p className="text-[10px] font-mono text-[#98A6B8] mb-1">Compressive Stress (MPa) vs Engineering Strain</p>
                  <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={predictions.stressStrainPoints}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#263342" />
                      <XAxis
                        dataKey="strain"
                        tick={{ fill: '#98A6B8', fontSize: 9 }}
                        stroke="#263342"
                      />
                      <YAxis
                        tick={{ fill: '#98A6B8', fontSize: 9 }}
                        stroke="#263342"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#17212D',
                          borderColor: '#263342',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#F4F7FB'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="stressMpa"
                        stroke="#00E5FF"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-[#111823] border border-[#263342]">
                    <span className="label text-[9px]">Linear-Elastic Plateau</span>
                    <p className="font-mono text-sm text-[#00E5FF] mt-0.5">
                      {predictions.compressiveStrengthMpa.toFixed(1)} <span className="text-[10px] text-[#98A6B8]">MPa</span>
                    </p>
                  </div>
                  <div className="p-2 rounded bg-[#111823] border border-[#263342]">
                    <span className="label text-[9px]">Densification Regime</span>
                    <p className="font-mono text-sm text-[#8B5CF6] mt-0.5">
                      ~{( (1 - predictions.relativeDensity * 0.8) * 100 ).toFixed(0)}% <span className="text-[10px] text-[#98A6B8]">Strain</span>
                    </p>
                  </div>
                </div>

                <div className="p-2 rounded bg-[#17212D] border border-[#263342] text-[10px] text-[#98A6B8]">
                  <p className="font-medium text-[#F4F7FB] mb-0.5">Constitutive Cellular Plasticity:</p>
                  Demonstrates elastic deformation up to compressive yield, followed by stress plateau during progressive cell collapse and ultimate densification stiffening.
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-2">
                <p className="text-xs text-[#98A6B8]">Generate properties to inspect constitutive curves.</p>
                <button
                  onClick={runPrediction}
                  className="btn-secondary text-xs py-1 px-3 rounded inline-flex items-center gap-1"
                >
                  Calculate Response
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


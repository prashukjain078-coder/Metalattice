import { Routes, Route, Navigate } from 'react-router-dom'
import { Component, ReactNode, ErrorInfo } from 'react'
import { ToastContainer } from './components/ui/ToastContainer'

import LandingPage from './pages/LandingPage'
import WorkspacePage from './pages/WorkspacePage'
import GeneratorPage from './pages/GeneratorPage'
import ExplorationPage from './pages/ExplorationPage'
import PredictionPage from './pages/PredictionPage'
import OptimizationPage from './pages/OptimizationPage'
import ComparisonPage from './pages/ComparisonPage'
import ProjectLibraryPage from './pages/ProjectLibraryPage'
import ExportPage from './pages/ExportPage'
import SettingsPage from './pages/SettingsPage'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MetaLattice ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#080B10] text-[#F4F7FB] p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FF5D7315] border border-[#FF5D7330] flex items-center justify-center text-[#FF5D73] mb-4 text-2xl font-bold">
            !
          </div>
          <h1 className="text-xl font-bold mb-2">MetaLattice Recovery Mode</h1>
          <p className="text-xs text-[#98A6B8] max-w-md mb-4 font-mono">
            {this.state.error?.message || 'An unexpected rendering condition occurred.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                localStorage.clear()
                window.location.href = '#/'
                window.location.reload()
              }}
              className="px-4 py-2 bg-[#00E5FF] text-[#080B10] text-xs font-bold rounded-lg hover:shadow-[0_0_15px_rgba(0,229,255,0.4)]"
            >
              Reset & Reload
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#17212D] border border-[#263342] text-xs rounded-lg hover:bg-[#263342]"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/generator" element={<GeneratorPage />} />
        <Route path="/exploration" element={<ExplorationPage />} />
        <Route path="/prediction" element={<PredictionPage />} />
        <Route path="/optimization" element={<OptimizationPage />} />
        <Route path="/comparison" element={<ComparisonPage />} />
        <Route path="/library" element={<ProjectLibraryPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </ErrorBoundary>
  )
}

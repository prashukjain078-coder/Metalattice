import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { useAppStore } from '../store'
import {
  BookOpen,
  Plus,
  Search,
  Folder,
  Copy,
  Trash2,
  ExternalLink,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { formatDate } from '../utils/format'
import LatticeViewer from '../components/viewport/LatticeViewer'

export default function ProjectLibraryPage() {
  const navigate = useNavigate()
  const {
    projects,
    activeProjectId,
    openProject,
    createProject,
    duplicateProject,
    deleteProject,
    addToast,
  } = useAppStore()

  const [search, setSearch] = useState('')
  const [newProjectName, setNewProjectName] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpen = (id: string) => {
    openProject(id)
    addToast({
      type: 'info',
      title: 'Project Opened',
      message: 'Workspace loaded successfully',
    })
    navigate('/workspace')
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return
    const id = createProject(newProjectName.trim(), 'User computational lattice design session')
    setNewProjectName('')
    setShowCreateModal(false)
    addToast({
      type: 'success',
      title: 'Project Created',
      message: `${newProjectName} initialized`,
    })
    navigate('/workspace')
  }

  return (
    <AppShell>
      <div className="h-full flex flex-col bg-[#080B10] text-[#F4F7FB] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#263342] bg-[#0D121A]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#00E5FF] uppercase tracking-wider font-semibold">
                  Engineering Repository
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#37D67A20] text-[#37D67A] border border-[#37D67A40]">
                  Local Storage Persisted
                </span>
              </div>
              <h1 className="text-2xl font-bold mt-1 text-[#F4F7FB]">Project Library</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A6B8]" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-[#111823] border border-[#263342] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F4F7FB] placeholder-[#4a5568] focus:outline-none focus:border-[#00E5FF]"
                />
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 font-semibold"
              >
                <Plus size={14} />
                <span>New Project</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body: Projects Grid */}
        <div className="p-6 max-w-6xl mx-auto w-full flex-1">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p) => {
              const isActive = p.id === activeProjectId
              const design = p.designs[0]

              return (
                <div
                  key={p.id}
                  className={`rounded-xl bg-[#111823] border overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 ${
                    isActive
                      ? 'border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                      : 'border-[#263342] hover:border-[#00E5FF40]'
                  }`}
                >
                  {/* 3D Model Thumbnail */}
                  <div className="h-44 w-full bg-[#080B10] relative border-b border-[#263342]">
                    {design ? (
                      <LatticeViewer params={design.geometry} compact showGrid={false} showAxes={false} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[#98A6B8] text-xs font-mono">
                        No geometry
                      </div>
                    )}

                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#17212D]/90 border border-[#263342] text-[#00E5FF] uppercase font-semibold">
                        {p.primaryFamily}
                      </span>
                    </div>

                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-[#37D67A20] text-[#37D67A] border border-[#37D67A40] font-semibold">
                          ACTIVE
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-[#F4F7FB]">{p.name}</h3>
                      <p className="text-xs text-[#98A6B8] line-clamp-2 mt-1 leading-relaxed">
                        {p.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#98A6B8] pt-2 border-t border-[#1a2535]">
                      <div className="flex justify-between">
                        <span>Material:</span>
                        <span className="font-mono text-[#F4F7FB] uppercase">{p.primaryMaterial}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Generated Candidates:</span>
                        <span className="font-mono text-[#F4F7FB]">{p.candidates.length} variants</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>Last Modified:</span>
                        <span className="font-mono">{formatDate(p.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#1a2535]">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => duplicateProject(p.id)}
                          className="p-1.5 rounded text-[#98A6B8] hover:text-[#F4F7FB] hover:bg-[#17212D]"
                          title="Duplicate Project"
                        >
                          <Copy size={13} />
                        </button>
                        {projects.length > 1 && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete "${p.name}"?`)) {
                                deleteProject(p.id)
                              }
                            }}
                            className="p-1.5 rounded text-[#98A6B8] hover:text-[#FF5D73] hover:bg-[#FF5D7310]"
                            title="Delete Project"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpen(p.id)}
                        className="btn-primary text-xs py-1 px-3 rounded flex items-center gap-1 font-medium"
                      >
                        <span>Open Studio</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080B10]/80 backdrop-blur-sm p-4">
            <div className="bg-[#111823] border border-[#263342] rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="font-bold text-base text-[#F4F7FB]">Create New Lattice Design Project</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#98A6B8] uppercase block mb-1">
                    Project Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AERO-STRUT | Lightweight Satellite Bracket"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-[#17212D] border border-[#263342] focus:border-[#00E5FF] rounded-lg p-2.5 text-xs text-[#F4F7FB] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-ghost text-xs py-1.5 px-3 rounded"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary text-xs py-1.5 px-4 rounded font-semibold">
                    Create & Launch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}


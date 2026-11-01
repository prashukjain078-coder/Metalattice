# MetaLattice 🔬✨
> **AI-Driven Conformal Metamaterial Lattice Synthesis & 3D FEA Digital Twin**

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-000000?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?style=flat-square&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

MetaLattice transforms raw 3D CAD models (`.stl`, `.step`, `.obj`, `.3mf`) into high-performance, lightweight cellular metamaterial lattices with real-time FEA (Finite Element Analysis) stress and strain simulation.

---

## 🚀 Key Capabilities

- **Conformal Volumetric Infill**: Voxelizes arbitrary closed CAD geometries into structurally sound periodic unit cells (Octet-Truss & Kelvin Space-Filling cells) with adaptive boundary trimming.
- **Physical FEA Heatmaps**: Real-time continuous color gradients (Blue $\to$ Cyan $\to$ Green $\to$ Amber $\to$ Crimson Red) mapped directly onto individual 3D struts:
  - **Stress Mode**: Highlights structural load paths and base fillet stress concentrations.
  - **Strain Mode**: Highlights compliance zones, tip deflections, and energy-absorbing deformations.
- **Dual Candidate Comparison**:
  - **Candidate 1 (Octet Truss)**: Stretch-dominated topology maximized for stiffness ($E = 2.85\text{ GPa}$, $\sigma_{\text{peak}} = 62.0\text{ MPa}$).
  - **Candidate 2 (Kelvin Cell)**: Bending-dominated topology maximized for shock absorption ($SEA = 87.1\text{ kJ/kg}$, $+83.2\%$ toughness with $12\%$ less mass).
- **Streamlined Engineering Metrics**: High-contrast, clean KPI bar displaying Young's Modulus ($E$), Peak Compressive Stress ($\sigma$), Volumetric Energy Absorption ($W_v$), and Critical Hotspot coordinates.
- **CAD Export**: One-click `.obj` export of synthesized conformal lattice geometries ready for additive manufacturing (SLS, SLM, DMLS 3D printing).

---

## 📁 Repository Architecture

```text
Metalattice/
├── src/                          # Frontend Application
│   ├── components/
│   │   ├── lattice/              # 3D Viewers, Heatmap Shaders & Spec Bars
│   │   │   ├── LatticeViewer3D.tsx
│   │   │   └── MechanicalPropsGrid.tsx
│   │   └── viewer/               # CAD Mesh Loader & Cutaway Viewers
│   ├── pages/
│   │   └── MaterializePage.tsx   # Dual-Window Comparison Workspace
│   └── utils/
│       ├── volumetricInfillGenerator.ts # Raycasting & Adaptive Voxelizer
│       ├── cadMeshLoader.ts             # Multi-format CAD Parser
│       └── benchmarkModels.ts          # Physical Gibson-Ashby FEA baselines
├── backend/                      # Python ML & Simulation Backend
│   ├── server.py                 # REST API Engine (Port 8000)
│   ├── requirements.txt          # Python dependencies
│   ├── config_*.yaml             # Model hyperparameters & configs
│   └── src/
│       └── lattice_service.py    # GNN Inference & Dual Metamaterial Synthesis
├── package.json
└── vite.config.ts
```

---

## ⚡ Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js** v18+ & **npm**
- **Python** 3.9+ with `pip`

---

### 2. Start the Backend API Server

```bash
# Navigate to the backend folder
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the Python ML simulation server (Runs on port 8000)
python server.py --port 8000 --device cpu --task stress_strain
```

Backend health check: [`http://localhost:8000/health`](http://localhost:8000/health)

---

### 3. Start the Frontend Web Application

Open a second terminal window:

```bash
# From the root repository directory
npm install

# Start Vite dev server
npm run dev
```

Open your browser to: **[`http://localhost:5173/materialize`](http://localhost:5173/materialize)**

---

## 🌐 Going Live (Production Deployment)

### Option A: Deploy Frontend to Vercel (Recommended)
1. Push this repository to your GitHub account (already linked to `prashukjain078-coder/Metalattice`).
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import `prashukjain078-coder/Metalattice`.
4. Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**. Your frontend is live on a global CDN!

### Option B: Deploy Backend to Railway / Render / AWS
1. For [Railway](https://railway.app) or [Render](https://render.com):
   - Connect repository and set root directory to `backend/`.
   - Start Command: `python server.py --port $PORT --device cpu --task stress_strain`
2. Add your production backend URL to your frontend's environment variable:
   `VITE_BACKEND_URL=https://your-backend.railway.app`

---

## 🛠️ Supported CAD & 3D Formats

| Format | Extension | Notes |
|---|---|---|
| Stereolithography | `.stl` | Binary & ASCII meshes |
| Wavefront | `.obj` | Polygonal geometry |
| Standard STEP | `.step`, `.stp` | AP203/AP214 boundary representation |
| 3D Manufacturing | `.3mf` | High-fidelity additive manufacturing |
| Graph Metamaterial | `.json`, `.gpkl` | Network graphs with node/edge tensors |

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

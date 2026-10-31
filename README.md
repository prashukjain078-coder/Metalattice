# Metalattice

React + Vite + TypeScript + Tailwind v4.

    npm install
    npm run dev      # open the URL it prints (http://localhost:5173)

Do NOT open index.html by double-click: module scripts do not run from file://
and the page will be blank. For a build, run `npm run build && npm run preview`.

## Components
- `MetalFrameCross` — Originkit metal-frame-cross (base preset), hero visual.
- `WobblingLatticeSphere` — Originkit wobbling-lattice-sphere (base preset), unmodified.

## Split sphere
One sphere is centred on the seam between the hero and the next section
(first div in `App.tsx`): hero shows the top half, section 2 the bottom half.

Runtime errors show on screen (ErrorBoundary) instead of a blank page.

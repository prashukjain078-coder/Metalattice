import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import MaterializePage from './pages/MaterializePage'

export default function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/materialize" element={<MaterializePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

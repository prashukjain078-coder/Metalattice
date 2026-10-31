import { createRoot } from "react-dom/client"
import App from "./App"
import ErrorBoundary from "./ErrorBoundary"
import "lenis/dist/lenis.css"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)

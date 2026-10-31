import { createRoot } from "react-dom/client"
import Root from "./Root"
import ErrorBoundary from "./ErrorBoundary"
import "lenis/dist/lenis.css"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <Root />
  </ErrorBoundary>
)

import { Component, type ReactNode } from "react"

// Shows the real error on screen instead of a blank page.
export default class ErrorBoundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null }
  static getDerivedStateFromError(err: Error) { return { err } }
  render() {
    if (this.state.err) {
      return <pre className="whitespace-pre-wrap p-6 text-sm text-white">{String(this.state.err.stack || this.state.err)}</pre>
    }
    return this.props.children
  }
}

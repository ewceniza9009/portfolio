import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: (error: Error, reset: () => void) => React.ReactNode
  label?: string
}

interface ErrorBoundaryState {
  error: Error | null
}

// Isolates a single render failure (e.g. one code block) so it can't unmount
// the entire article. Shows a fallback instead of crashing the whole page.
export class BlockErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[BlockErrorBoundary] render failed:', this.props.label, error, info)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset)
      return (
        <div
          className="my-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          <div className="font-bold text-red-400 mb-1">
            {this.props.label || 'This block'} failed to render.
          </div>
          <div className="text-xs opacity-70 break-words">{this.state.error.message}</div>
        </div>
      )
    }
    return this.props.children
  }
}

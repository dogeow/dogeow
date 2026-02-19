'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * 错误边界组件 - 捕获子组件的渲染错误
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 p-6">
          <div className="text-center">
            <div className="mb-3 text-4xl">⚠️</div>
            <h3 className="mb-2 text-lg font-semibold text-red-400">出现错误</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {this.state.error?.message ?? '发生了未知错误'}
            </p>
            <button
              onClick={this.handleRetry}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              重试
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

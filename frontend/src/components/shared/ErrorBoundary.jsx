import React from 'react';
import { AlertOctagon, RefreshCw, Compass } from 'lucide-react';
import { Button } from '../ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    if (import.meta.env.DEV) {
      console.error('[ChiefNet ErrorBoundary caught error]:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-10 my-6 bg-white rounded-3xl border border-terracotta-200 shadow-warm text-center max-w-xl mx-auto space-y-4 animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-2xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center mx-auto shadow-xs">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-neutral-900">
            Something Went Wrong in this Section
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-md mx-auto">
            {this.state.error?.message ||
              'A client-side error occurred while rendering this section. Your account session remains active.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="sm"
              icon={RefreshCw}
              onClick={this.handleReset}
            >
              Retry View
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Compass}
              onClick={() => (window.location.href = '/customer/discover')}
            >
              Back to Discovery
            </Button>
          </div>
          {import.meta.env.DEV && this.state.errorInfo && (
            <details className="text-left text-[11px] font-mono bg-cream-100 p-3 rounded-xl overflow-x-auto text-neutral-700 mt-4 border border-cream-200">
              <summary className="cursor-pointer font-bold mb-1 text-terracotta-800">
                Technical Stack Trace (Development Only)
              </summary>
              <pre className="whitespace-pre-wrap">{this.state.error?.stack}</pre>
              <pre className="whitespace-pre-wrap text-neutral-500 mt-2">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}


import React from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`🚨 [Nirvighna ErrorBoundary] Caught exception in ${this.props.sectionName || 'Component'}:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-slate-900 text-white rounded-2xl border-2 border-red-500/40 shadow-2xl space-y-4 my-4 max-w-2xl mx-auto font-body">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/40 flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-red-400 uppercase tracking-wider font-mono">
                Component Fault Isolation Protocol Active
              </span>
              <h3 className="text-base font-extrabold text-white font-heading">
                {this.props.sectionName ? `${this.props.sectionName} Recovered` : 'Component Error Recovered'}
              </h3>
            </div>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            Nirvighna's fault-tolerant architecture isolated a runtime glitch in this module. The rest of the platform remains fully active and operational.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-gold text-indigo-dark font-black text-xs rounded-xl shadow-lg uppercase tracking-wider hover:from-amber-400 hover:to-gold transition-all font-heading flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload This View</span>
            </button>

            <a
              href="/"
              className="px-4 py-2 bg-black/60 border border-white/20 text-gray-200 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return to Pilgrim Home</span>
            </a>
          </div>

          {/* Technical Diagnostics Details */}
          {this.state.error && (
            <details open className="mt-3 text-[10px] font-mono text-gray-400 bg-black/60 p-3 rounded-xl border border-red-500/30">
              <summary className="cursor-pointer font-bold text-amber-300 hover:underline">
                🔍 Developer Diagnostic Trace
              </summary>
              <p className="mt-2 text-red-300 font-mono font-bold break-all">{this.state.error.toString()}</p>
              {this.state.errorInfo?.componentStack && (
                <pre className="mt-2 text-[9px] text-gray-400 font-mono whitespace-pre-wrap overflow-x-auto p-2 bg-black/80 rounded border border-white/10">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

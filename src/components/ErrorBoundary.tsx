import React from 'react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'Something went wrong.' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d0608] text-white flex flex-col items-center justify-center gap-6 p-8">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-black text-white mb-2">Something crashed</h1>
            <p className="text-white/50 text-sm mb-1">{this.state.errorMessage}</p>
            <p className="text-white/30 text-xs">Your data is safe. Please reload to continue.</p>
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, errorMessage: '' }); window.location.reload(); }}
            className="px-6 py-3 bg-white text-[#0d0608] font-black rounded-full text-sm hover:bg-white/90 active:scale-95 transition-all"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

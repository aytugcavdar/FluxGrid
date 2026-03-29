import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  screenName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ScreenErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Screen error in ${this.props.screenName || 'Unknown'}:`, error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ background: '#0a0e1a' }}
        >
          <div
            className="max-w-md w-full rounded-xl p-6 text-center"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(239,68,68,0.3)',
            }}
          >
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">
              Bir Hata Oluştu
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {this.props.screenName || 'Bu ekran'} yüklenirken bir sorun oluştu.
            </p>
            {this.state.error && (
              <p className="text-xs text-red-400 mb-4 font-mono">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all"
              style={{
                background: '#3b82f6',
              }}
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

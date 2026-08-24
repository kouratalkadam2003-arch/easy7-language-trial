import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onSkip?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleSkip = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onSkip) {
      this.props.onSkip();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] h-full w-full bg-red-50 p-6 text-center rounded-2xl border-4 border-red-200" dir="rtl">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-2 font-nunito">عذراً، حدث خطأ!</h2>
          <p className="text-red-600 mb-6 max-w-md font-cairo">
            يبدو أن هناك مشكلة في هذا الجزء من التطبيق. يمكنك تخطي هذه الخطوة حتى يتم إصلاحها.
          </p>
          <button
            onClick={this.handleSkip}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all w-full max-w-xs font-cairo text-lg"
          >
            تخطى هذا إلى أن يتم إصلاحه
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

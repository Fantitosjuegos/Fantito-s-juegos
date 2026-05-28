import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this would go to Sentry or similar
    if (import.meta.env.DEV) {
      console.error('App crashed:', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'sans-serif',
          background: '#0a0a0a',
          color: '#ffffff',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😵</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#888', marginBottom: '2rem', fontSize: '0.95rem' }}>
            The app ran into an unexpected error. Tap below to restart.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#534AB7',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Restart app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
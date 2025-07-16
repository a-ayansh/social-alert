import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 React Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#111827',
          color: '#f9fafb',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚨</div>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#dc2626' }}>Missing Alert System Error</h1>
            <p style={{ marginBottom: '2rem', color: '#9ca3af' }}>Something went wrong. Please refresh the page.</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
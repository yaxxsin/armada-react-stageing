import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="wrap" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h2>Terjadi kesalahan</h2>
          <p style={{ color: 'var(--text-dim)', marginBottom: '16px' }}>
            {this.state.error?.message || 'Terjadi kesalahan yang tidak terduga.'}
          </p>
          <button
            className="btn"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Muat ulang halaman
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
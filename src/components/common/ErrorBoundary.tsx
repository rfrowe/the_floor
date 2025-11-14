import React, { Component, type ReactNode } from 'react';
import { Card, Button } from '@components/common';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  override render() {
    if (this.state.hasError) {
      return (
        <Card header="⚠️ Component Error">
          <div style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--danger-color)', fontWeight: 'bold', marginBottom: '1rem' }}>
              This component encountered an error:
            </p>
            <pre
              style={{
                backgroundColor: 'var(--bg-primary)',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}
            >
              {this.state.error?.toString()}
            </pre>
            <Button onClick={this.handleReset} variant="primary">
              🔄 Reset Component
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

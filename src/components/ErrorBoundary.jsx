import React from 'react';
import ServerErrorPage from '@/pages/errors/ServerErrorPage';

export default class ErrorBoundary extends React.Component {
  state = {hasError: false};

  static getDerivedStateFromError() {
    return {hasError: true};
  }

  componentDidCatch(error, info) {
    console.error('Application error boundary caught an error:', error, info);
  }

  reset = () => {
    this.setState({hasError: false});
  };

  render() {
    if (this.state.hasError) {
      return <ServerErrorPage onRetry={this.reset} />;
    }

    return this.props.children;
  }
}

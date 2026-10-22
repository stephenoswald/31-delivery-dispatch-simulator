import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Workspace error', error.message, info.componentStack);
  }
  render() {
    return this.state.error ? (
      <div className="not-found">
        <h1>Let’s try that again.</h1>
        <p>The workspace hit an unexpected problem.</p>
        <button className="button button-primary" onClick={() => window.location.reload()}>
          Reload workspace
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

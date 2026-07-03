import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-paper px-4 py-8 text-center text-ink">
          <div className="mx-auto max-w-xl rounded-2xl border border-stone bg-white p-8 shadow-sm">
            <h1 className="mb-4 text-2xl font-semibold">Something went wrong</h1>
            <p className="mb-4 text-sm text-muted">An unexpected error occurred while loading the app.</p>
            <pre className="max-h-64 overflow-auto rounded bg-stone-light p-4 text-left text-xs text-pulse">{String(this.state.error)}</pre>
            <p className="mt-4 text-xs text-muted">Check the browser console for more details.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from "react";

type ErrorBoundaryState = {
  hasError: boolean;
  msg?: string;
};

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      msg: (error as { message?: string } | null)?.message || "Error",
    };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("UI Error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 16,
            border: "1px solid #eee",
            borderRadius: 8,
          }}
        >
          <b>Something went wrong.</b>
          <div style={{ opacity: 0.7 }}>{this.state.msg}</div>
          <button onClick={() => location.reload()}>Reload</button>
        </div>
      );
    }

    return this.props.children;
  }
}

"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import DashboardErrorState from "../DashboardErrorState";

type Props = {
  children: ReactNode;
  viewName?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export default class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[Dashboard${this.props.viewName ? `:${this.props.viewName}` : ""}]`, error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <DashboardErrorState
          title="Something went wrong"
          message={this.state.error?.message || "An unexpected error occurred in this view."}
          actionLabel="Reload"
          onAction={this.handleRetry}
          compact
        />
      );
    }

    return this.props.children;
  }
}

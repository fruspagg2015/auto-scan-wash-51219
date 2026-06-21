import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-gray-50">
          <Alert variant="destructive" className="max-w-2xl overflow-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro no Aplicativo</AlertTitle>
            <AlertDescription className="mt-4">
              <p className="font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
              <pre className="text-xs bg-red-100 p-2 rounded whitespace-pre-wrap">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class DashboardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in Dashboard:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl bg-destructive/10 p-8 text-center text-destructive border border-destructive/20 shadow-lg">
          <div className="mb-4 rounded-full bg-destructive/20 p-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="mb-2 text-xl font-bold font-display">Une erreur est survenue</h2>
          <p className="mb-6 max-w-md text-sm text-destructive-foreground opacity-90 leading-relaxed">
            Un problème technique empêche l'affichage de cette section. Cela est souvent dû à une mise à jour de la base de données en cours.
          </p>
          <div className="flex gap-4">
            <Button
              variant="default"
              className="rounded-full bg-destructive text-white hover:bg-destructive/90 px-8"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Réactualiser la page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;

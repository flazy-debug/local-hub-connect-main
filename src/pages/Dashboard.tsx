import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { SellerDashboard } from "@/components/dashboard/SellerDashboard";
import { BuyerDashboard } from "@/components/dashboard/BuyerDashboard";
import { PartnerDashboard } from "@/components/dashboard/PartnerDashboard";
import DashboardErrorBoundary from "@/components/dashboard/DashboardErrorBoundary";

export default function Dashboard() {
  const { user, profile, isSeller, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Initialisation de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Determine which dashboard to show
  const isPartner = profile?.subscription_type === "PARTNER";

  return (
    <DashboardErrorBoundary>
      <div className="min-h-screen bg-secondary/30 pb-24 pt-4 md:py-8">
        <div className="container px-4">
          {isPartner ? (
            <PartnerDashboard />
          ) : isSeller ? (
            <SellerDashboard />
          ) : (
            <BuyerDashboard />
          )}
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}

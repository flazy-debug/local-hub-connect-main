import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cart-store";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import BottomTabBar from "@/components/BottomTabBar";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import ShopDetail from "./pages/ShopDetail";
import Catalogue from "./pages/Catalogue";
import ProductDetail from "./pages/ProductDetail";
import OrderTracking from "./pages/OrderTracking";
import Boutiques from "./pages/Boutiques";
import Auth from "./pages/Auth";
import DevenirVendeur from "./pages/DevenirVendeur";
import Dashboard from "./pages/Dashboard";
import PromoLanding from "./pages/PromoLanding";
import AdminPanel from "./pages/AdminPanel";
import AdminPortal from "./pages/AdminPortal";
import AdminApprobation from "./pages/AdminApprobation";
import Profil from "./pages/Profil";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";
import BoostExpirationManager from "@/components/BoostExpirationManager";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/catalogue" element={<Catalogue />} />
        <Route path="/produit/:id" element={<ProductDetail />} />
        <Route path="/suivi" element={<OrderTracking />} />
        <Route path="/boutiques" element={<Boutiques />} />
        <Route path="/boutique/:id" element={<ShopDetail />} />
        <Route path="/s/:slug" element={<ShopDetail />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/verifier-email" element={<VerifyEmail />} />
        <Route path="/devenir-vendeur" element={<DevenirVendeur />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vendeur/dashboard" element={<Dashboard />} />
        <Route path="/promo/:id" element={<PromoLanding />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/admin-portal" element={<AdminPortal />} />
        <Route path="/admin/approbation" element={<AdminApprobation />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <BoostExpirationManager />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navbar />
            <main className="pb-16 md:pb-0">
              <AnimatedRoutes />
            </main>
            <div className="hidden md:block">
              <Footer />
            </div>
            <BottomTabBar />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

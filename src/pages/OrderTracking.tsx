import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import OrderTimeline from "@/components/OrderTimeline";
import { formatCFA } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  preparing: "En préparation",
  shipped: "Expédié",
  delivered: "Livré",
  completed: "Terminé",
};

const statusColors: Record<string, string> = {
  pending: "bg-destructive text-destructive-foreground",
  paid: "bg-info text-info-foreground",
  preparing: "bg-warning text-warning-foreground",
  shipped: "bg-info text-info-foreground",
  delivered: "bg-success text-success-foreground",
  completed: "bg-success text-success-foreground",
};

export default function OrderTracking() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) fetchOrders();
  }, [user, authLoading]);

  const fetchOrders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const confirmReception = async (orderId: string) => {
    // Update order status to delivered
    const { error } = await supabase
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", orderId);

    if (error) {
      toast.error("Erreur : " + error.message);
      return;
    }

    // Update transaction to completed (release funds)
    await supabase
      .from("transactions")
      .update({ status: "completed" })
      .eq("order_id", orderId);

    toast.success("Réception confirmée ! Les fonds ont été débloqués pour le vendeur.");
    fetchOrders();
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-3xl">
        <h1 className="font-display text-3xl font-bold">Mes Commandes</h1>
        <p className="mt-1 text-muted-foreground">Suivez vos commandes en temps réel</p>

        <div className="mt-8 space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display font-bold">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <Badge className={statusColors[order.status]}>
                  {statusLabels[order.status]}
                </Badge>
              </div>

              {/* Order items */}
              <div className="mt-4 space-y-1">
                {(order.items as any[])?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span className="font-medium">{formatCFA(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <OrderTimeline status={order.status} />
              </div>

              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <p className="text-sm text-muted-foreground">Total : <span className="font-bold text-accent">{formatCFA(order.total)}</span></p>
                {order.status === "shipped" && (
                  <Button
                    size="sm"
                    className="bg-success text-success-foreground hover:bg-success/90"
                    onClick={() => confirmReception(order.id)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Confirmer la réception
                  </Button>
                )}
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="rounded-xl border bg-card p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <p className="mt-3 text-lg font-medium text-muted-foreground">Aucune commande</p>
              <Link to="/tous-les-produits">
                <Button className="mt-4 bg-primary text-white hover:bg-primary/90">
                  Découvrir nos produits
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

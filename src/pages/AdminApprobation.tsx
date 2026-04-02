import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatCFA } from "@/lib/mock-data";
import { Check, X, ShieldCheck, UserCheck, Settings } from "lucide-react";

export default function AdminApprobation() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      if (profile.role !== "admin") {
        toast.error("Accès réservé aux administrateurs");
        navigate("/");
        return;
      }
      setIsAdmin(true);
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pending products
      const { data: prods } = await (supabase
        .from("products") as any)
        .select("*, profiles(display_name, shop_name)")
        .eq("is_approved", false);
      setPendingProducts(prods || []);

      // Fetch partners
      const { data: parts } = await supabase
        .from("profiles")
        .select("*")
        .eq("subscription_type", "PARTNER");
      setPartners(parts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const approveProduct = async (id: string) => {
    const { error } = await (supabase
      .from("products") as any)
      .update({ is_approved: true })
      .eq("id", id);
    
    if (!error) {
      toast.success("Produit approuvé");
      fetchData();
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);
    
    if (!error) {
      toast.success("Produit rejeté (supprimé)");
      fetchData();
    }
  };

  const updateMarkup = async (userId: string, markup: string) => {
    const val = parseFloat(markup);
    if (isNaN(val)) return;

    const { error } = await supabase
      .from("profiles")
      .update({ partner_markup_percent: val } as any)
      .eq("user_id", userId);
    
    if (!error) {
      toast.success("Markup mis à jour");
      fetchData();
    } else {
      toast.error("Erreur mise à jour markup");
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Portail d'Approbation VOIKET</h1>
        <ShieldCheck className="h-8 w-8 text-accent" />
      </div>

      <Tabs defaultValue="products">
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="products">Produits en attente ({pendingProducts.length})</TabsTrigger>
          <TabsTrigger value="partners">Gestion Partenaires ({partners.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="grid gap-4">
            {pendingProducts.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">Aucun produit en attente d'approbation.</p>
            ) : (
              pendingProducts.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-xl">{p.name}</CardTitle>
                      <CardDescription>Par {p.profiles?.shop_name || p.profiles?.display_name}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-success text-success-foreground" onClick={() => approveProduct(p.id)}>
                        <Check className="mr-2 h-4 w-4" /> Approuver
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteProduct(p.id)}>
                        <X className="mr-2 h-4 w-4" /> Rejeter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      {p.images?.[0] && (
                        <img src={p.images[0]} alt="" className="h-24 w-24 rounded-lg object-cover" />
                      )}
                      <div className="space-y-1 text-sm">
                        <p><strong>Prix Fournisseur:</strong> {formatCFA(p.supplier_price || 0)}</p>
                        <p><strong>Description:</strong> {p.description}</p>
                        {p.video_url && (
                          <a href={p.video_url} target="_blank" rel="noreferrer" className="text-xs text-accent underline">
                            Voir la vidéo démo
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="partners">
          <div className="grid gap-4">
            {partners.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">Aucun partenaire enregistré.</p>
            ) : (
              partners.map((u) => (
                <Card key={u.user_id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-lg">{u.shop_name || u.display_name}</CardTitle>
                      <CardDescription>{u.whatsapp_number}</CardDescription>
                    </div>
                    <UserCheck className="h-5 w-5 text-success" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid w-full max-w-xs items-center gap-1.5">
                      <Label htmlFor={`markup-${u.user_id}`}>Markup (%)</Label>
                      <div className="flex gap-2">
                        <Input 
                          id={`markup-${u.user_id}`}
                          type="number" 
                          defaultValue={u.partner_markup_percent || 0}
                          onBlur={(e) => updateMarkup(u.user_id, e.target.value)}
                        />
                        <Button size="icon" variant="outline" className="shrink-0">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Ce markup s'appliquera automatiquement à tous ses produits.</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

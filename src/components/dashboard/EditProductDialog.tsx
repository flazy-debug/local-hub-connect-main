import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImageUpload from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { categories, neighborhoods } from "@/lib/mock-data";

interface Props {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function EditProductDialog({ product, open, onOpenChange, onSaved }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    condition: "neuf",
    stock: "1",
    neighborhood: "",
    pickup_available: true,
    delivery_available: false,
    pickup_address: "",
    images: [] as string[],
    transaction_type: "vente" as "vente" | "location" | "service",
    specifications: {} as Record<string, any>,
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        description: product.description || "",
        price: String(product.price || ""),
        category: product.category || "",
        condition: product.condition || "neuf",
        stock: String(product.stock || 1),
        neighborhood: product.neighborhood || "",
        pickup_available: product.pickup_available ?? true,
        delivery_available: product.delivery_available ?? false,
        pickup_address: product.pickup_address || "",
        images: product.images || [],
        transaction_type: product.transaction_type || "vente",
        specifications: product.specifications || {},
      });
    }
  }, [product]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("products").update({
        name: form.name,
        description: form.description,
        price: parseInt(form.price),
        category: form.category,
        condition: form.condition,
        stock: parseInt(form.stock),
        neighborhood: form.neighborhood,
        pickup_available: form.pickup_available,
        delivery_available: form.delivery_available,
        pickup_address: form.pickup_address || null,
        images: form.images.length > 0 ? form.images : ["/placeholder.svg"],
        transaction_type: form.transaction_type,
        specifications: form.specifications,
      }).eq("id", product.id);
      if (error) throw error;
      toast({ title: "Produit mis à jour ✅" });
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="pb-4 border-b border-slate-50">
          <DialogTitle className="font-display text-2xl font-black uppercase tracking-tighter text-primary">Configuration du Produit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{form.category.toLowerCase().includes('service') ? "Tarif base / Déplacement (CFA) *" : "Prix (CFA) *"}</Label>
              <div className="relative">
                <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} required min={1} className="pr-16" />
                {form.transaction_type === 'location' && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">/ MOIS</span>}
              </div>
            </div>
            {!(form.category === 'immobilier' || form.category === 'vehicules') && (
              <div className="space-y-2">
                <Label>Stock *</Label>
                <Input type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} required min={0} />
              </div>
            )}
          </div>

          {/* Specialized Fields: Immobilier */}
          {form.category === 'immobilier' && (
            <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="space-y-2">
                <Label>Type de Transaction</Label>
                <div className="flex bg-white p-1 rounded-xl gap-1">
                  {['vente', 'location'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("transaction_type", t as any)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${form.transaction_type === t ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:bg-slate-50"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Surface (m²)</Label>
                  <Input type="number" value={form.specifications?.surface || ""} onChange={(e) => set("specifications", { ...form.specifications, surface: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Pièces</Label>
                  <Input type="number" value={form.specifications?.rooms || ""} onChange={(e) => set("specifications", { ...form.specifications, rooms: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {/* Specialized Fields: Automobile */}
          {form.category === 'vehicules' && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="space-y-2">
                <Label>Année</Label>
                <Input type="number" value={form.specifications?.year || ""} onChange={(e) => set("specifications", { ...form.specifications, year: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Kilométrage (km)</Label>
                <Input type="number" value={form.specifications?.km || ""} onChange={(e) => set("specifications", { ...form.specifications, km: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Carburant</Label>
                <Select value={form.specifications?.fuel || "essence"} onValueChange={(v) => set("specifications", { ...form.specifications, fuel: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essence">Essence</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="hybride">Hybride</SelectItem>
                    <SelectItem value="electrique">Électrique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transmission</Label>
                <Select value={form.specifications?.transmission || "automatique"} onValueChange={(v) => set("specifications", { ...form.specifications, transmission: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatique">Automatique</SelectItem>
                    <SelectItem value="manuelle">Manuelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Catégorie *</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>État *</Label>
              <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="neuf">Neuf</SelectItem>
                  <SelectItem value="occasion">Occasion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Quartier *</Label>
            <Select value={form.neighborhood} onValueChange={(v) => set("neighborhood", v)}>
              <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
              <SelectContent>
                {neighborhoods.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.pickup_available} onCheckedChange={(v) => set("pickup_available", v)} />
              <Label>Pick-up</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.delivery_available} onCheckedChange={(v) => set("delivery_available", v)} />
              <Label>Livraison</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Photos</Label>
            <ImageUpload images={form.images} onChange={(imgs) => set("images", imgs)} maxImages={5} />
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full bg-accent hover:bg-accent-hover text-white h-14 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-accent/20 transition-all hover:scale-[1.02]" disabled={saving}>
              {saving ? "Synchronisation..." : "Mettre à jour la collection"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

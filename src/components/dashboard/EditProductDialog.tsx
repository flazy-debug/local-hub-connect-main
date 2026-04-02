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
        <DialogHeader>
          <DialogTitle className="font-display">Modifier le produit</DialogTitle>
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
              <Label>Prix (CFA) *</Label>
              <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} required min={1} />
            </div>
            <div className="space-y-2">
              <Label>Stock *</Label>
              <Input type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} required min={0} />
            </div>
          </div>
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
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

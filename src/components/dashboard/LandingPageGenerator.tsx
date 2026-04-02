import { useState } from "react";
import { Megaphone, Copy, ExternalLink, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCFA } from "@/lib/mock-data";

interface Props {
  products: any[];
}

export default function LandingPageGenerator({ products }: Props) {
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [headline, setHeadline] = useState("");
  const [cta, setCta] = useState("Commander maintenant");
  const [promoPrice, setPromoPrice] = useState("");
  const [copied, setCopied] = useState(false);

  const product = products.find((p) => p.id === selectedProductId);

  const generateLink = () => {
    if (!product) return "";
    const base = window.location.origin;
    const params = new URLSearchParams();
    if (headline) params.set("h", headline);
    if (cta) params.set("cta", cta);
    if (promoPrice) params.set("promo", promoPrice);
    return `${base}/promo/${product.id}?${params.toString()}`;
  };

  const link = generateLink();

  const copyLink = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Lien copié !" });
    setTimeout(() => setCopied(false), 2000);
  };

  const autofillHeadline = () => {
    if (!product) return;
    setHeadline(`🔥 ${product.name} — Offre Spéciale !`);
  };

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Megaphone className="mx-auto h-12 w-12 opacity-30" />
          <p className="mt-3">Ajoutez d'abord un produit pour créer une page de destination.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Megaphone className="h-5 w-5 text-accent" />
            Créer une page de destination marketing
          </div>

          <div className="space-y-2">
            <Label>Sélectionner un produit *</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger><SelectValue placeholder="Choisir un produit" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {formatCFA(p.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {product && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Titre accrocheur</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={autofillHeadline} className="gap-1 text-xs">
                    <Sparkles className="h-3 w-3" /> Générer
                  </Button>
                </div>
                <Input
                  placeholder="Ex: 🔥 Offre limitée — Ne ratez pas !"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Texte du bouton CTA</Label>
                  <Input value={cta} onChange={(e) => setCta(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Prix promo (CFA)</Label>
                  <Input
                    type="number"
                    placeholder={String(product.price)}
                    value={promoPrice}
                    onChange={(e) => setPromoPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 p-4">
                <p className="mb-1 text-xs font-medium text-accent">Aperçu</p>
                <h3 className="font-display text-lg font-bold">{headline || product.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                <div className="mt-2 flex items-center gap-3">
                  {promoPrice && (
                    <>
                      <span className="text-lg font-bold text-accent">{formatCFA(Number(promoPrice))}</span>
                      <span className="text-sm text-muted-foreground line-through">{formatCFA(product.price)}</span>
                    </>
                  )}
                  {!promoPrice && <span className="text-lg font-bold">{formatCFA(product.price)}</span>}
                </div>
                <div className="mt-3">
                  <Badge className="bg-accent text-accent-foreground">{cta || "Commander"}</Badge>
                </div>
              </div>

              {/* Link */}
              <div className="space-y-2">
                <Label>Lien de partage</Label>
                <div className="flex gap-2">
                  <Input value={link} readOnly className="font-mono text-xs" />
                  <Button type="button" variant="outline" size="icon" onClick={copyLink}>
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button type="button" variant="outline" size="icon" asChild>
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Partagez ce lien sur WhatsApp, Facebook ou Instagram pour promouvoir votre produit.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

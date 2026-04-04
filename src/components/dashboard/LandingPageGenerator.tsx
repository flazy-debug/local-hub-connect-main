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
    <div className="space-y-8">
      <Card className="border-none shadow-soft rounded-[2.5rem] bg-white overflow-hidden">
        <div className="bg-gradient-to-br from-accent to-accent-hover p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-2xl">
              <Megaphone className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-black uppercase tracking-tighter leading-none mb-1">
                Générateur de Campagne
              </h2>
              <p className="text-white/60 text-xs font-medium uppercase tracking-[0.2em]">Marketing Digital Elite</p>
            </div>
          </div>
        </div>
        
        <CardContent className="space-y-6 p-10 bg-[#f9f9ff]">

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

              {/* Preview - Digital Curator Style */}
              <div className="space-y-3 pt-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Aperçu de la Galerie</Label>
                <div className="rounded-[2.5rem] border-none bg-white p-8 shadow-premium relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4">
                    <Badge className="bg-accent/10 text-accent border-none font-bold text-[10px] uppercase tracking-widest px-3">
                      Digital Banner
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="h-24 w-24 rounded-2xl overflow-hidden shadow-soft group-hover:scale-105 transition-transform duration-500">
                       <img src={product.images?.[0]} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-2 text-center md:text-left">
                      <h3 className="font-display text-2xl font-black text-primary uppercase tracking-tighter leading-none">
                        {headline || product.name}
                      </h3>
                      <p className="text-sm text-slate-400 font-medium line-clamp-2 italic">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                        {promoPrice ? (
                          <>
                            <span className="text-2xl font-black text-accent">{formatCFA(Number(promoPrice))}</span>
                            <span className="text-sm font-bold text-slate-300 line-through decoration-accent/30">{formatCFA(product.price)}</span>
                          </>
                        ) : (
                          <span className="text-2xl font-black text-primary">{formatCFA(product.price)}</span>
                        )}
                        <Badge className="bg-primary text-white font-black text-[10px] uppercase tracking-widest px-4 py-1 rounded-full ml-auto md:ml-4">
                          {cta || "Réserver"}
                        </Badge>
                      </div>
                    </div>
                  </div>
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

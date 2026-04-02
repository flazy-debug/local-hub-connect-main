import { useState } from "react";
import { Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DEMO_PRODUCTS = [
  {
    name: "Robe Wax Ankara Élégante",
    description: "Magnifique robe en tissu wax authentique, coupe moderne et ajustée. Idéale pour cérémonies.",
    price: 15000,
    category: "mode",
    condition: "neuf",
    stock: 8,
    neighborhood: "Tokoin",
    pickup_available: true,
    delivery_available: true,
    pickup_address: "Marché de Tokoin, Allée B",
  },
  {
    name: "Écouteurs Bluetooth Sport",
    description: "Écouteurs sans fil avec réduction de bruit, autonomie 12h. Parfait pour le sport.",
    price: 8500,
    category: "electronique",
    condition: "neuf",
    stock: 15,
    neighborhood: "Agbalépédogan",
    pickup_available: true,
    delivery_available: true,
    pickup_address: "Carrefour Agbalépédogan",
  },
  {
    name: "Panier Tressé Artisanal",
    description: "Panier fait main par des artisanes locales. Idéal pour la décoration ou le rangement.",
    price: 5000,
    category: "artisanat",
    condition: "neuf",
    stock: 20,
    neighborhood: "Bè",
    pickup_available: true,
    delivery_available: false,
    pickup_address: "Marché de Bè, Stand 12",
  },
  {
    name: "Beurre de Karité Bio 500g",
    description: "Beurre de karité pur et non raffiné du Nord Togo. Soin visage, corps et cheveux.",
    price: 3500,
    category: "beaute",
    condition: "neuf",
    stock: 30,
    neighborhood: "Hédzranawoé",
    pickup_available: true,
    delivery_available: true,
    pickup_address: "",
  },
  {
    name: "Chemise Homme Bazin Brodé",
    description: "Chemise en bazin riche brodé à la main. Disponible en blanc, bleu et beige.",
    price: 12000,
    category: "mode",
    condition: "neuf",
    stock: 5,
    neighborhood: "Nyékonakpoè",
    pickup_available: true,
    delivery_available: true,
    pickup_address: "Boulevard du 13 Janvier",
  },
];

interface Props {
  sellerId: string;
  onDone: () => void;
}

export default function DemoDataGenerator({ sellerId, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    try {
      const rows = DEMO_PRODUCTS.map((p) => ({
        ...p,
        seller_id: sellerId,
        images: ["/placeholder.svg"],
      }));
      const { error } = await supabase.from("products").insert(rows);
      if (error) throw error;
      toast({ title: "5 produits démo ajoutés ✅" });
      onDone();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={generate} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
      Générer 5 produits démo
    </Button>
  );
}

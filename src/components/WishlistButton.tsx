import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

interface WishlistButtonProps {
  productId: string;
  size?: "sm" | "md";
}

export default function WishlistButton({ productId, size = "md" }: WishlistButtonProps) {
  const { user } = useAuth();
  const [isWished, setIsWished] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("wishlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle()
      .then(({ data }) => setIsWished(!!data));
  }, [user, productId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setLoading(true);
    if (isWished) {
      await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", productId);
      setIsWished(false);
    } else {
      await supabase.from("wishlist").insert({ user_id: user.id, product_id: productId });
      setIsWished(true);
    }
    setLoading(false);
  };

  if (!user) return null;

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const btnSize = size === "sm" ? "h-7 w-7" : "h-9 w-9";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`${btnSize} flex items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-colors hover:bg-card ${isWished ? "text-destructive" : "text-muted-foreground"}`}
      title={isWished ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Heart className={`${iconSize} ${isWished ? "fill-current" : ""}`} />
    </button>
  );
}

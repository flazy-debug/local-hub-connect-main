import { useState, useEffect } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

interface FollowButtonProps {
  sellerId: string;
  size?: "sm" | "default";
  onFollowChange?: () => void;
}

export default function FollowButton({ sellerId, size = "default", onFollowChange }: FollowButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("seller_id", sellerId)
      .maybeSingle()
      .then(({ data }) => setIsFollowing(!!data));
  }, [user, sellerId]);

  const toggle = async () => {
    if (!user) {
      toast({ title: "Connectez-vous pour suivre cette boutique", variant: "destructive" });
      return;
    }
    setLoading(true);
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("seller_id", sellerId);
      setIsFollowing(false);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, seller_id: sellerId });
      setIsFollowing(true);
    }
    setLoading(false);
    onFollowChange?.();
  };

  // Don't show follow button on own shop
  if (user?.id === sellerId) return null;

  return (
    <Button
      variant={isFollowing ? "secondary" : "outline"}
      size={size === "sm" ? "sm" : "default"}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
      disabled={loading}
      className={isFollowing ? "gap-1.5" : "gap-1.5"}
    >
      {isFollowing ? (
        <><UserCheck className="h-4 w-4" /> Suivi ✅</>
      ) : (
        <><UserPlus className="h-4 w-4" /> Suivre</>
      )}
    </Button>
  );
}

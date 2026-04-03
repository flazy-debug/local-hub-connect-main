import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Headless component that handles checking for expired boosts
 * and resetting them. In a real production environment, this would
 * be handled by a Supabase Edge Function or a Cron job.
 * Here we run it on client-side for demonstration and immediate feedback.
 */
export default function BoostExpirationManager() {
  useEffect(() => {
    let isSilenced = false;

    const cleanupExpiredBoosts = async () => {
      if (isSilenced) return;

      const now = new Date().toISOString();
      
      const { error, count } = await (supabase
        .from("products") as any)
        .update({ is_boosted: false, boost_expiry: null } as any)
        .lt("boost_expiry" as any, now)
        .eq("is_boosted" as any, true)
        .select("id");

      if (error) {
        // PGRST204 = Column not found
        if (error.code === "PGRST204") {
          console.warn("Boost system skipped: boost_expiry column missing from database.");
          isSilenced = true;
        } else {
          console.error("Error cleaning up expired boosts:", error);
        }
      } else if (count && count > 0) {
        console.log(`Cleaned up ${count} expired boosts.`);
      }
    };

    // Run on mount
    cleanupExpiredBoosts();

    // Check every 5 minutes while the app is open
    const interval = setInterval(cleanupExpiredBoosts, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return null; // Headless
}

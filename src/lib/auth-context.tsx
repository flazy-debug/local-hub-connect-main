import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isSeller: boolean;
  isPartner: boolean;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role: string, whatsappNumber?: string, plan?: string, shopName?: string, locationNeighborhood?: string) => Promise<void>;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProfile(data);
  };

  const checkRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (data || []).map((r: any) => r.role);
    setIsSeller(roles.includes("seller"));
    setIsPartner(roles.includes("partner"));
    setIsAdmin(roles.includes("admin"));
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            checkRoles(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsSeller(false);
          setIsPartner(false);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        checkRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string, role: string, whatsappNumber?: string, plan?: string, shopName?: string, locationNeighborhood?: string) => {
    // Map French roles to DB Enum roles
    let dbRole = "buyer";
    if (role === "vendeur") dbRole = "seller";
    if (role === "partner") dbRole = "partner";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          display_name: displayName,
          role: dbRole,
          whatsapp_number: whatsappNumber,
        },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;

    if (data.user) {
      try {
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: dbRole as any });
        
        const profileData: any = { 
          user_id: data.user.id,
          display_name: displayName,
          subscription_type: role.toUpperCase(), // Save role in subscription_type as requested
        };
        
        if (whatsappNumber) profileData.whatsapp_number = whatsappNumber;
        if (shopName) profileData.shop_name = shopName;
        if (locationNeighborhood) profileData.location_neighborhood = locationNeighborhood;
        
        // Handle initial plan enhancements
        if (role === "vendeur" && plan === "pro") {
          profileData.subscription_type = "monthly_flat";
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1);
          profileData.pro_expires_at = expiresAt.toISOString();
        }

        await supabase.from("profiles").upsert(profileData, { onConflict: 'user_id' });
      } catch (err) {
        console.warn("Ignored manual insert error", err);
      }
    }
  };

  const signIn = async (identifier: string, password: string) => {
    let credentials;
    if (identifier.includes("@")) {
      credentials = { email: identifier, password };
    } else {
      credentials = { phone: identifier, password };
    }
    const { error } = await supabase.auth.signInWithPassword(credentials);
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isSeller, isPartner, isAdmin, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

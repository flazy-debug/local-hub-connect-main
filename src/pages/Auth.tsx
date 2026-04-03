import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Store, Mail, Lock, User, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WEST_AFRICA_COUNTRIES = [
  { code: "+228", name: "Togo", flag: "🇹🇬" },
  { code: "+229", name: "Bénin", flag: "🇧🇯" },
  { code: "+225", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "+221", name: "Sénégal", flag: "🇸🇳" },
  { code: "+223", name: "Mali", flag: "🇲🇱" },
  { code: "+226", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "+227", name: "Niger", flag: "🇳🇪" },
];

import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "login";
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState(searchParams.get("type") || "acheteur");
  const plan = searchParams.get("plan");
  const [whatsappCode, setWhatsappCode] = useState("+228");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [shopName, setShopName] = useState("");
  const [locationNeighborhood, setLocationNeighborhood] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(loginIdentifier, loginPassword);
      toast({ title: "Connexion réussie", description: "Bienvenue sur VoiketMarket !" });
      
      const intendedRole = localStorage.getItem("intended_role");
      if (intendedRole === "seller") {
        localStorage.removeItem("intended_role");
        navigate("/devenir-vendeur");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupRole === "vendeur" && !whatsappNumber) {
      toast({ title: "Erreur", description: "Le numéro WhatsApp est obligatoire pour les vendeurs.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const fullWhatsapp = (signupRole === "vendeur" || signupRole === "partner") ? `${whatsappCode}${whatsappNumber}` : undefined;
      await signUp(
        signupEmail, 
        signupPassword, 
        signupName, 
        signupRole, 
        fullWhatsapp, 
        plan || undefined,
        signupRole === "acheteur" ? undefined : shopName,
        locationNeighborhood
      );
      
      toast({ 
        title: "Inscription réussie !", 
        description: signupRole === "partner" ? "Votre demande est en cours de validation." : "Bienvenue sur VoiketMarket !" 
      });

      // Redirect based on role
      if (signupRole === "vendeur") {
        navigate("/dashboard/seller");
      } else if (signupRole === "partner") {
        navigate("/dashboard/partner");
      } else {
        navigate("/dashboard/buyer");
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Email envoyé", description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe." });
      setForgotOpen(false);
      setForgotEmail("");
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setForgotLoading(false);
    }
  };

  const googleButton = null; // Temporairement désactivé en attendant la configuration des clés Supabase

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Store className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight italic">VOIKET</h1>
          <p className="mt-1 text-sm text-muted-foreground font-medium">La Marketplace Hybride & Sociale</p>
        </div>

        <Card>
          <Tabs defaultValue={defaultTab}>
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-identifier">Email ou Téléphone</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="login-identifier" type="text" inputMode="email" placeholder="votre@email.com" className="pl-9" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Mot de passe</Label>
                      <button type="button" onClick={() => setForgotOpen(true)} className="text-xs text-accent hover:underline">
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="login-password" type={showLoginPassword ? "text" : "password"} placeholder="••••••••" className="pl-9 pr-10" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                      <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
                    {isLoading ? "Connexion..." : "Se connecter"}
                  </Button>
                  {googleButton}
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-3 pb-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Type de compte :</Label>
                    <RadioGroup defaultValue="acheteur" value={signupRole} onValueChange={setSignupRole} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="relative">
                        <RadioGroupItem value="acheteur" id="role-acheteur" className="peer sr-only" />
                        <Label
                          htmlFor="role-acheteur"
                          className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent/5 peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/5 cursor-pointer transition-all duration-300 h-full text-center group"
                        >
                          <User className="mb-2 h-6 w-6 text-muted-foreground group-hover:scale-110 transition-transform peer-data-[state=checked]:text-accent" />
                          <span className="font-bold text-sm">Acheteur</span>
                          <span className="text-[9px] text-muted-foreground mt-1">Shopping de proximité</span>
                        </Label>
                      </div>
                      <div className="relative">
                        <RadioGroupItem value="vendeur" id="role-vendeur" className="peer sr-only" />
                        <Label
                          htmlFor="role-vendeur"
                          className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent/5 peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/5 cursor-pointer transition-all duration-300 h-full text-center group"
                        >
                          <Store className="mb-2 h-6 w-6 text-muted-foreground group-hover:scale-110 transition-transform peer-data-[state=checked]:text-accent" />
                          <span className="font-bold text-sm">Vendeur</span>
                          <span className="text-[9px] text-muted-foreground mt-1">Vendre et Booster</span>
                        </Label>
                      </div>
                      <div className="relative">
                        <RadioGroupItem value="partner" id="role-partner" className="peer sr-only" />
                        <Label
                          htmlFor="role-partner"
                          className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent/5 peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/5 cursor-pointer transition-all duration-300 h-full text-center group"
                        >
                          <CheckCircle className="mb-2 h-6 w-6 text-muted-foreground group-hover:scale-110 transition-transform peer-data-[state=checked]:text-accent" />
                          <span className="font-bold text-sm">Partenaire</span>
                          <span className="text-[9px] text-muted-foreground mt-1 italic">Soumis à validation</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nom complet</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-name" placeholder="Prénom Nom" className="pl-9" value={signupName} onChange={e => setSignupName(e.target.value)} required />
                    </div>
                  </div>

                  {(signupRole === "vendeur" || signupRole === "partner") && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      <Label htmlFor="signup-shop-name">Nom de la Boutique</Label>
                      <div className="relative">
                        <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="signup-shop-name" placeholder="Ex: Boutique Luxe Lomé" className="pl-9" value={shopName} onChange={e => setShopName(e.target.value)} required />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-neighborhood">Quartier / Ville</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-neighborhood" placeholder="Ex: Adidogomé, Lomé" className="pl-9" value={locationNeighborhood} onChange={e => setLocationNeighborhood(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-email" type="email" placeholder="votre@email.com" className="pl-9" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="signup-password" type={showSignupPassword ? "text" : "password"} placeholder="Min. 6 caractères" className="pl-9 pr-10" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required minLength={6} />
                      <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {(signupRole === "vendeur" || signupRole === "partner") && (
                    <>
                      <div className="space-y-2 animate-in fade-in slide-in-from-right-2 duration-300">
                        <Label htmlFor="whatsapp-number">Numéro WhatsApp (Obligatoire)</Label>
                        <div className="flex gap-2">
                          <Select value={whatsappCode} onValueChange={setWhatsappCode}>
                            <SelectTrigger className="w-[110px]">
                              <SelectValue placeholder="Code" />
                            </SelectTrigger>
                            <SelectContent>
                              {WEST_AFRICA_COUNTRIES.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  <span className="mr-2">{country.flag}</span>
                                  {country.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            id="whatsapp-number"
                            type="tel"
                            placeholder="90000000"
                            className="flex-1"
                            value={whatsappNumber}
                            onChange={e => setWhatsappNumber(e.target.value)}
                            required={signupRole === "vendeur" || signupRole === "partner"}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
                    {isLoading ? "Inscription..." : (signupRole === "vendeur" ? "Ouvrir ma boutique maintenant" : "Créer mon compte")}
                  </Button>
                  {googleButton}
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </motion.div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mot de passe oublié</DialogTitle>
            <DialogDescription>Entrez votre email pour recevoir un lien de réinitialisation.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="votre@email.com" className="pl-9" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={forgotLoading}>
              {forgotLoading ? "Envoi..." : "Envoyer le lien"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

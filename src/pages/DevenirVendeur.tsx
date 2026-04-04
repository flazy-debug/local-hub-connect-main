import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Store, ShieldCheck, CreditCard, Smartphone, Truck, Star, CheckCircle, ArrowRight, PartyPopper, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { neighborhoods, formatCFA } from "@/lib/mock-data";
import PageTransition from "@/components/PageTransition";

const advantages = [
  { icon: CreditCard, title: "Commencez gratuitement", desc: "Mode Standard à 0 CFA ou passez PRO pour 0% commission." },
  { icon: Smartphone, title: "Notifications WhatsApp", desc: "Recevez les commandes directement sur votre WhatsApp." },
  { icon: ShieldCheck, title: "Paiement sécurisé", desc: "Les fonds sont sécurisés et débloqués après confirmation." },
  { icon: Truck, title: "Pick-up & Livraison", desc: "Proposez le retrait ou la livraison à domicile." },
  { icon: Star, title: "Avis vérifiés", desc: "Les avis clients boostent votre crédibilité." },
  { icon: Store, title: "Votre vitrine digitale", desc: "Page boutique personnalisée visible par tous." },
];

const steps = [
  { num: "1", title: "Inscrivez-vous", desc: "Créez votre compte vendeur." },
  { num: "2", title: "Ajoutez vos produits", desc: "Photos, descriptions, prix." },
  { num: "3", title: "Recevez des commandes", desc: "Notifié par WhatsApp." },
  { num: "4", title: "Encaissez", desc: "Argent débloqué à réception." },
];

const PLATFORM_NAME = "VoiketMarket";

export default function DevenirVendeur() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopDesc, setShopDesc] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const initialPlan = (location.state as any)?.plan || "commission";
  const [plan, setPlan] = useState<"commission" | "monthly_flat">(initialPlan);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate("/auth?tab=signup"); return; }
    setIsLoading(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          shop_name: shopName,
          shop_description: shopDesc,
          whatsapp_number: whatsapp,
          neighborhood,
          subscription_type: plan,
          verification_status: plan === "monthly_flat" ? "pro" : "none",
        })
        .eq("user_id", user.id);
      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "seller" as any });
      if (roleError && !roleError.message.includes("duplicate")) throw roleError;

      setShowSuccess(true);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getWhatsAppWelcomeLink = () => {
    const phone = whatsapp.replace("+", "");
    const dashboardLink = `${window.location.origin}/dashboard`;

    let message: string;
    if (plan === "commission") {
      message = `Bonjour ${shopName} ! 🎉 Bienvenue sur ${PLATFORM_NAME}. Votre boutique est créée en mode Standard (10% de commission). Vous pouvez dès maintenant publier votre premier produit ici : ${dashboardLink}. Bonnes ventes !`;
    } else {
      message = `Félicitations ${shopName} ! 🏆 Vous avez choisi le Pass Boutique PRO. Votre badge certifié et la visibilité prioritaire sont activés. Forfait : ${formatCFA(5000)}/mois. Accédez à votre dashboard : ${dashboardLink}. Bienvenue dans la communauté !`;
    }
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  // Success / Confirmation page
  if (showSuccess) {
    return (
      <PageTransition>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-accent/5 to-background px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-lg text-center"
          >
            {/* Confetti emojis */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 text-6xl"
            >
              🎉🎊🥳
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                <PartyPopper className="h-10 w-10 text-success" />
              </div>

              <h1 className="font-display text-3xl font-bold">
                Boutique créée avec succès !
              </h1>
              <p className="mt-2 text-muted-foreground">
                <strong>{shopName}</strong> est maintenant en ligne sur {PLATFORM_NAME}
              </p>

              {plan === "monthly_flat" && (
                <Badge className="mt-3 bg-accent/10 text-accent px-4 py-1">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Badge PRO activé
                </Badge>
              )}
              {plan === "commission" && (
                <Badge className="mt-3 bg-muted text-muted-foreground px-4 py-1">
                  Mode Standard — 10% commission
                </Badge>
              )}
            </motion.div>

            {/* Next steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 space-y-4"
            >
              <h3 className="font-display font-semibold">Prochaines étapes :</h3>
              <div className="space-y-3 text-left">
                {[
                  { num: "1", text: "Vérifiez votre WhatsApp pour le message de bienvenue" },
                  { num: "2", text: "Ajoutez votre premier produit depuis le dashboard" },
                  { num: "3", text: "Partagez le lien de votre boutique à vos clients" },
                ].map((step) => (
                  <div key={step.num} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                      {step.num}
                    </div>
                    <span className="text-sm">{step.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 flex flex-col gap-3"
            >
              <a href={getWhatsAppWelcomeLink()} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-success text-success-foreground hover:bg-success/90" size="lg">
                  <ExternalLink className="mr-2 h-4 w-4" /> Ouvrir WhatsApp pour finaliser
                </Button>
              </a>
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                size="lg"
              >
                Accéder à mon Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="bg-primary px-4 py-20 text-primary-foreground">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center">
              <h1 className="font-display text-4xl font-bold md:text-5xl">
                Passez du quartier au <span className="text-accent">digital</span>
              </h1>
              <p className="mt-4 text-lg opacity-80">
                Rejoignez {PLATFORM_NAME} et vendez à des milliers de clients locaux.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" })}>
                  Devenir Vendeur <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Link to="/pricing">
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    Voir les tarifs
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Advantages */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-center font-display text-3xl font-bold">Pourquoi vendre sur {PLATFORM_NAME} ?</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {advantages.map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                  <Card className="h-full border-0 shadow-md">
                    <CardContent className="flex gap-4 p-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                        <a.icon className="h-6 w-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold">{a.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="bg-slate-50 py-16">
          <div className="container">
            <h2 className="text-center font-display text-3xl font-bold">Comment ça marche ?</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-4">
              {steps.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} viewport={{ once: true }} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-bold text-accent-foreground">{s.num}</div>
                  <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <section id="form-section" className="py-16">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-lg">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="font-display text-2xl">Créer ma boutique</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {user ? "Complétez les infos de votre boutique" : "Connectez-vous d'abord"}
                  </p>
                </CardHeader>
                <CardContent>
                  {!user ? (
                    <div className="space-y-4 text-center">
                      <p className="text-muted-foreground">Vous devez avoir un compte pour devenir vendeur.</p>
                      <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/auth?tab=signup")}>Créer un compte</Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nom de la boutique *</Label>
                        <Input placeholder="Ex: Boutique Afi Mode" value={shopName} onChange={e => setShopName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Décrivez votre boutique..." value={shopDesc} onChange={e => setShopDesc(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Numéro WhatsApp *</Label>
                        <Input placeholder="+22890123456" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required pattern="^\+228[0-9]{8}$" title="Doit commencer par +228 suivi de 8 chiffres" />
                      </div>
                      <div className="space-y-2">
                        <Label>Quartier *</Label>
                        <Select value={neighborhood} onValueChange={setNeighborhood} required>
                          <SelectTrigger><SelectValue placeholder="Choisir un quartier" /></SelectTrigger>
                          <SelectContent>{neighborhoods.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>

                      {/* Plan selection */}
                      <div className="space-y-3">
                        <Label>Choisir votre forfait</Label>
                        <RadioGroup value={plan} onValueChange={(v) => setPlan(v as any)} className="space-y-3">
                          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${plan === "commission" ? "border-accent bg-accent/5" : "hover:bg-slate-50"}`}>
                            <RadioGroupItem value="commission" className="mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-display font-semibold">Standard</span>
                                <Badge variant="outline" className="text-[10px]">GRATUIT</Badge>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">0 CFA / mois — 10% de commission sur chaque vente</p>
                            </div>
                          </label>
                          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all ${plan === "monthly_flat" ? "border-accent bg-accent/5" : "border-accent/30 hover:bg-slate-50"}`}>
                            <RadioGroupItem value="monthly_flat" className="mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-display font-semibold">PRO</span>
                                <Badge className="bg-accent text-accent-foreground text-[10px]"><ShieldCheck className="mr-0.5 h-2.5 w-2.5" /> RECOMMANDÉ</Badge>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">{formatCFA(5000)} / mois — 0% commission, badge PRO, visibilité prioritaire</p>
                            </div>
                          </label>
                        </RadioGroup>
                      </div>

                      <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
                        {isLoading ? "Création..." : "Créer ma boutique"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Star, ShieldCheck, Zap, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCFA } from "@/lib/mock-data";
import PageTransition from "@/components/PageTransition";

const plans = [
  {
    id: "commission",
    name: "Standard",
    subtitle: "Simple & Gratuit",
    price: "0 CFA / mois",
    highlight: false,
    icon: Zap,
    color: "text-muted-foreground",
    features: [
      "Inscription gratuite",
      "10% de commission / vente",
      "Notifications WhatsApp",
      "Boutique personnalisée",
      "Virement sous 48h",
    ],
    cta: "Commencer",
  },
  {
    id: "monthly_flat",
    name: "PRO",
    subtitle: "Vendeur Sérieux",
    price: "5 000 CFA / mois",
    highlight: true,
    icon: Star,
    color: "text-primary",
    features: [
      "0% de commission",
      "Gardez 100% de vos gains",
      "Badge PRO certifié ⭐",
      "Visibilité accrue",
      "Virement Prioritaire",
    ],
    cta: "Passer PRO",
  },
  {
    id: "partner",
    name: "Partenaire",
    subtitle: "Business Premium",
    price: "15 000 CFA / mois",
    highlight: false,
    icon: ShieldCheck,
    color: "text-accent",
    features: [
      "0% de commission",
      "Badge Certifié Officiel",
      "Support WhatsApp 24/7",
      "5 Boosts produits / mois",
      "Analyse de marché",
    ],
    cta: "Devenir Partenaire",
  },
  {
    id: "boost",
    name: "Boost",
    subtitle: "Visibilité Flash",
    price: "1 000 CFA / 3j",
    highlight: false,
    icon: TrendingUp,
    color: "text-orange-500",
    features: [
      "Top du catalogue",
      "Badge 🔥 VENTE FLASH",
      "Cible 5x plus de clients",
      "Idéal pour déstocage",
      "Activation instantanée",
    ],
    cta: "Booster un produit",
  },
];

export default function Pricing() {
  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Hero */}
        <section className="bg-primary px-4 py-20 text-primary-foreground">
          <div className="container text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="mb-4 bg-accent/20 text-accent">Tarification</Badge>
              <h1 className="font-display text-4xl font-bold md:text-5xl">
                Choisissez votre <span className="text-accent">forfait</span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg opacity-80">
                Deux options simples. Zéro frais cachés. Commencez gratuitement ou passez PRO pour maximiser vos gains.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Plans */}
        <section className="container -mt-10 pb-16 px-4">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`relative h-full overflow-hidden rounded-3xl border-none shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1 ${plan.highlight ? "ring-2 ring-primary bg-primary/5 shadow-primary/10" : "bg-card shadow-black/5"}`}>
                  {plan.highlight && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg">
                        POPULAIRE
                      </div>
                    </div>
                  )}
                  <CardHeader className="text-center pt-8 pb-4">
                    <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 ${plan.color}`}>
                      <plan.icon className="h-8 w-8" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-2xl font-bold">{plan.name}</CardTitle>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">{plan.subtitle}</p>
                    </div>
                    <div className="mt-4">
                      <p className="font-display text-2xl font-black text-primary">{plan.price}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 flex flex-col justify-between">
                    <ul className="space-y-3">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-3 text-[13px]">
                          <div className="h-5 w-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 text-success" />
                          </div>
                          <span className="text-muted-foreground font-medium">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to={plan.id === "boost" ? "/dashboard?tab=ads" : "/devenir-vendeur"} state={{ plan: plan.id }}>
                      <Button
                        className={`w-full h-12 rounded-xl text-sm font-bold shadow-lg transition-all ${plan.highlight ? "bg-primary text-primary-foreground hover:scale-105" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                        variant="default"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Comparison */}
        <section className="bg-secondary/50 py-16">
          <div className="container">
            <h2 className="text-center font-display text-2xl font-bold">Exemple concret</h2>
            <div className="mx-auto mt-8 max-w-2xl rounded-xl border bg-card p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-display font-semibold">Mode Standard</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Vous vendez pour <strong>{formatCFA(100000)}</strong> ce mois-ci.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Commission (10%) : <span className="text-destructive font-medium">-{formatCFA(10000)}</span></p>
                  <p className="mt-1 text-sm font-bold">Vous recevez : <span className="text-success">{formatCFA(90000)}</span></p>
                </div>
                <div className="rounded-lg border-2 border-accent/30 bg-accent/5 p-4">
                  <h3 className="font-display font-semibold flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-accent" /> Mode PRO</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Vous vendez pour <strong>{formatCFA(100000)}</strong> ce mois-ci.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Forfait : <span className="text-muted-foreground">-{formatCFA(5000)}</span></p>
                  <p className="mt-1 text-sm font-bold">Vous recevez : <span className="text-success">{formatCFA(100000)}</span></p>
                  <p className="mt-2 text-xs text-accent font-medium flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +{formatCFA(5000)} de bénéfice net</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

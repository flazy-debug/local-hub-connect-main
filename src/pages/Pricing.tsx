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
    subtitle: "Idéal pour commencer",
    price: "0 CFA / mois",
    highlight: false,
    features: [
      "Inscription 100% gratuite",
      "10% de commission sur chaque vente",
      "Notifications WhatsApp",
      "Page boutique personnalisée",
      "Support par messagerie",
    ],
    cta: "Commencer gratuitement",
  },
  {
    id: "monthly_flat",
    name: "PRO",
    subtitle: "Le meilleur choix pour les boutiques",
    price: formatCFA(5000) + " / mois",
    highlight: true,
    features: [
      "0% de commission — gardez 100% de vos ventes",
      "Badge PRO certifié ⭐",
      "Visibilité prioritaire dans les résultats",
      "Support prioritaire",
      "Statistiques avancées",
      "Page boutique mise en avant",
    ],
    cta: "Devenir PRO",
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
        <section className="container -mt-10 pb-16">
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
              >
                <Card className={`relative h-full ${plan.highlight ? "border-2 border-accent shadow-xl shadow-accent/10" : "border"}`}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-accent text-accent-foreground px-4 py-1 text-xs font-bold">
                        <Star className="mr-1 h-3 w-3 fill-current" /> RECOMMANDÉ
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pt-8">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                      {plan.highlight ? <ShieldCheck className="h-7 w-7 text-accent" /> : <Zap className="h-7 w-7 text-accent" />}
                    </div>
                    <CardTitle className="font-display text-2xl">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                    <p className="mt-4 font-display text-3xl font-bold text-accent">{plan.price}</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/devenir-vendeur" state={{ plan: plan.id }}>
                      <Button
                        className={`w-full ${plan.highlight ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}`}
                        variant={plan.highlight ? "default" : "outline"}
                        size="lg"
                      >
                        {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
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

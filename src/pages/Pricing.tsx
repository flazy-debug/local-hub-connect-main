import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Star, ShieldCheck, Zap, TrendingUp, Info, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCFA } from "@/lib/mock-data";
import PageTransition from "@/components/PageTransition";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const plans = [
  {
    id: "standard",
    name: "Standard",
    subtitle: "Simple & Gratuit",
    price: "0 CFA / mois",
    highlight: false,
    icon: Zap,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    features: [
      "Inscription immédiate",
      "Galerie photos illimitée",
      "Gestion des commandes",
      "10% Commission plateforme",
      "4% Frais réseau opérateur",
    ],
    cta: "Commencer gratuitement",
    link: "/auth?type=vendeur&plan=standard",
  },
  {
    id: "pro",
    name: "PRO",
    subtitle: "Vendeur Sérieux",
    price: "5 000 CFA / mois",
    highlight: true,
    icon: Star,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    features: [
      "Tout le Standard +",
      "0% Commission plateforme",
      "Bouton WhatsApp Direct",
      "Badge PRO certifié ⭐",
      "2 Boosts offerts / mois",
      "4% Frais réseau opérateur",
    ],
    cta: "Passer PRO",
    link: "/auth?type=vendeur&plan=pro",
  },
  {
    id: "partner",
    name: "Partenaire",
    subtitle: "Sourcing Premium",
    price: "GRATUIT",
    highlight: false,
    icon: ShieldCheck,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    features: [
      "Sur invitation uniquement",
      "Prix Fournisseur direct",
      "Markup auto (Admin)",
      "Zéro gestion client",
      "Paiements groupés sécurisés",
      "Accès aux stocks Epure",
    ],
    cta: "Postuler (Admin)",
    link: "https://wa.me/221770000000?text=Je%20souhaite%20devenir%20Partenaire%20Sourcing",
  },
  {
    id: "boost",
    name: "Boost",
    subtitle: "Visibilité Flash",
    price: "1 000 CFA / 3j",
    highlight: false,
    icon: TrendingUp,
    color: "text-rose-500",
    bgColor: "bg-rose-50",
    features: [
      "Top des produits (3 jours)",
      "Badge 🔥 VENTE FLASH",
      "Cible 5x plus de clients",
      "Notifications push locales",
      "Activation instantanée",
    ],
    cta: "Booster maintenant",
    link: "/dashboard?tab=ads",
  },
];

export default function Pricing() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC]">
        {/* Header */}
        <section className="relative overflow-hidden bg-[#0A0A0B] pt-24 pb-32 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-50" />
          <div className="container relative z-10 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-3xl"
            >
              <Badge className="mb-6 rounded-full bg-accent/20 px-4 py-1 text-accent border-none text-[11px] font-bold tracking-wider">
                TRANSPARENCE TOTALE
              </Badge>
              <h1 className="font-display text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Outils puissants, <br />
                <span className="bg-gradient-to-r from-accent to-amber-400 bg-clip-text text-transparent">Gains maximums.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400 leading-relaxed">
                Choisissez le plan qui correspond à votre ambition. Pas de frais cachés, pas de surprises. 
                <span className="block mt-2 text-sm text-slate-500">Note : Les frais de réseau (4%) s'appliquent à tous les retraits mobiles.</span>
              </p>
            </motion.div>
          </div>
        </section>

        {/* Plans Grid */}
        <section className="container relative z-20 -mt-16 px-4 pb-20">
          <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`${i % 2 === 1 ? "lg:mt-8" : ""} h-full`} // Stairs effect
              >
                <Card className={`group relative flex h-full flex-col border-none shadow-2xl transition-all duration-300 hover:shadow-primary/5 hover:-translate-y-2 rounded-[2.5rem] overflow-hidden ${plan.highlight ? "ring-2 ring-accent bg-white" : "bg-white/80 backdrop-blur-md"}`}>
                  {plan.highlight && (
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-accent" />
                  )}
                  
                  <CardHeader className="p-8 pb-4">
                    <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${plan.bgColor} ${plan.color} group-hover:scale-110 transition-transform duration-300`}>
                      <plan.icon className="h-7 w-7" strokeWidth={2.5} />
                    </div>
                    <div>
                      <CardTitle className="font-display text-2xl font-bold tracking-tight">{plan.name}</CardTitle>
                      <p className="mt-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{plan.subtitle}</p>
                    </div>
                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="font-display text-3xl font-black text-slate-900">{plan.price.split(' ')[0]}</span>
                      <span className="text-sm font-medium text-slate-500">{plan.price.split(' ').slice(1).join(' ')}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col p-8 pt-0">
                    <div className="h-[1px] w-full bg-slate-100 mb-8" />
                    <ul className="flex-1 space-y-4 mb-10">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${plan.bgColor} ${plan.color}`}>
                            <Check className="h-2.5 w-2.5" strokeWidth={4} />
                          </div>
                          <span className="text-[13px] font-medium text-slate-600 leading-tight">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      className={`h-14 w-full rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
                        plan.highlight 
                        ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-accent/20" 
                        : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"
                      }`}
                    >
                      <Link to={plan.link}>{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Advanced Math Visualization */}
        <section className="bg-white py-24 px-4 overflow-hidden">
          <div className="container relative">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl font-black md:text-4xl text-slate-900">Audit de gains (100k CFA)</h2>
              <p className="mt-4 text-slate-500">Voyez exactement combien vous recevez selon votre mode de vente.</p>
            </div>

            <div className="mx-auto max-w-4xl">
              <div className="grid gap-12 lg:grid-cols-2 flex-items-stretch">
                {/* Standard Card */}
                <div className="relative rounded-[2rem] border-2 border-slate-100 p-8 pt-10">
                  <div className="absolute -top-4 left-8 rounded-full bg-white px-4 py-1 text-[10px] font-bold text-slate-400 border uppercase tracking-widest">
                    Mode Standard
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-dashed pb-4">
                      <span className="text-sm font-medium text-slate-400">Total Ventes</span>
                      <span className="text-xl font-black text-slate-900">{formatCFA(100000)}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-slate-500">Comm. Plateforme (10%)</span>
                        <span className="font-bold text-rose-500">-{formatCFA(10000)}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          Frais Réseau (4%) 
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                              <TooltipContent>Frais prélevés par les opérateurs mobiles (Orange, Wave, etc.)</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                        <span className="font-bold text-rose-400">-{formatCFA(4000)}</span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-6">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Gain Net Réel</p>
                      <p className="text-3xl font-black text-slate-900">{formatCFA(86000)}</p>
                      <p className="mt-1 text-xs text-slate-400 italic">Retrait Mobile Money inclus</p>
                    </div>
                  </div>
                </div>

                {/* PRO Card */}
                <div className="relative rounded-[2rem] border-2 border-accent bg-accent/5 p-8 pt-10 shadow-2xl shadow-accent/10">
                  <div className="absolute -top-4 left-8 rounded-full bg-accent px-4 py-1 text-[10px] font-bold text-accent-foreground uppercase tracking-widest">
                    Recommandé : Mode PRO
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-accent/20 pb-4">
                      <span className="text-sm font-medium text-slate-500">Total Ventes</span>
                      <span className="text-xl font-black text-slate-900">{formatCFA(100000)}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-slate-500">Abonnement Mensuel</span>
                        <span className="font-bold text-slate-900">-{formatCFA(5000)}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-slate-500 font-semibold text-accent">Comm. Plateforme (0%)</span>
                        <span className="font-black text-emerald-600">-{formatCFA(0)}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-slate-500">Frais Réseau (4%)</span>
                        <span className="font-bold text-rose-400">-{formatCFA(4000)}</span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-6 shadow-xl shadow-accent/5">
                      <p className="text-[10px] font-black uppercase text-accent tracking-widest mb-1 underline">Gain Net Réel</p>
                      <p className="text-3xl font-black text-slate-900">{formatCFA(91000)}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-600">
                        <TrendingUp className="h-4 w-4" />
                        <span>+{formatCFA(5000)} de profit pur vs Standard</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Break-even mention */}
              <div className="mt-12 text-center rounded-3xl bg-slate-900 p-8 text-white">
                <p className="text-slate-400 text-sm mb-2">Le saviez-vous ?</p>
                <h4 className="text-xl font-bold">L'abonnement PRO est <span className="text-accent underline">rentabilisé dès 50 000 CFA</span> de ventes par mois.</h4>
                <p className="mt-4 text-[13px] text-slate-500 max-w-lg mx-auto">Calcul : À 50k de ventes, vous payez 5000 de commission en Standard. En PRO, vous payez 5000 d'abonnement. Au-delà, chaque CFA est 10% plus rentable.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Minimal FAQ/Support */}
        <section className="container py-20 text-center border-t border-slate-100">
          <HelpCircle className="mx-auto h-12 w-12 text-slate-200 mb-6" />
          <h3 className="font-display text-2xl font-bold mb-4">Besoin d'un conseil personnalisé ?</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Nos experts vendeurs vous aident à choisir le meilleur mode de croissance pour votre business.</p>
          <Button asChild variant="outline" className="h-14 px-8 rounded-2xl gap-2 font-bold hover:bg-slate-50">
            <a href="https://wa.me/221770000000" target="_blank" rel="noreferrer">
              Parler à un conseiller <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </section>
      </div>
    </PageTransition>
  );
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

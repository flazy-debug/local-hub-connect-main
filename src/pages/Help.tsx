import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Search, ShoppingBag, Store, Handshake, ShieldCheck, Mail, MessageCircle } from "lucide-react";
import PageTransition from "@/components/PageTransition";

export default function Help() {
  const buyerFAQ = [
    { q: "Comment se passe la livraison ?", a: "Vous pouvez choisir entre le retrait en boutique (Pick-up) ou la livraison à domicile. Les frais de livraison sont calculés selon votre quartier et sont affichés lors de la commande." },
    { q: "Comment payer ma commande ?", a: "Nous acceptons les paiements Mobile Money (T-Money, Flooz) ainsi que les cartes bancaires via notre passerelle sécurisée." },
    { q: "Puis-je annuler une commande ?", a: "Oui, tant que le vendeur n'a pas encore 'Expédié' votre colis. Une fois expédié, veuillez contacter le vendeur directement via le chat ou WhatsApp." },
  ];

  const sellerFAQ = [
    { q: "Quelles sont les commissions ?", a: "Le Plan Standard prélève 10% de commission plateforme + 4% de frais réseau par vente. Le Plan PRO (5 000 CFA/mois) réduit la commission plateforme à 0%." },
    { q: "Comment passer en mode PRO ?", a: "Rendez-vous dans la section 'Tarifs' ou cliquez sur 'Devenir PRO' dans votre Dashboard. Le paiement se fait par abonnement mensuel." },
    { q: "Comment retirer mes gains ?", a: "Les gains sont transférés vers votre compte Mobile Money dès que le client confirme la réception du colis. Le délai de 'Séquestre' est de 24h maximum après livraison." },
  ];

  const partnerFAQ = [
    { q: "C'est quoi le Sourcing Partenaire ?", a: "C'est un programme gratuit sur invitation pour les apporteurs d'affaires. Vous listez vos produits, et VoiketMarket s'occupe de la visibilité en échange d'un markup négocié." },
    { q: "Comment devenir Partenaire ?", a: "Inscrivez-vous avec le rôle 'Partenaire'. Notre équipe examinera votre profil et validera votre accès sous 24h à 48h." },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50/50 py-12 md:py-20">
        <div className="container max-w-4xl">
          <div className="text-center space-y-4 mb-12">
            <h1 className="font-display text-4xl font-extrabold text-primary tracking-tight">Centre d'Assistance</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Trouvez des réponses rapides ou contactez notre équipe de support.</p>
          </div>

          <div className="grid gap-8">
            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                    <ShoppingBag className="text-primary h-6 w-6" />
                  </div>
                  <CardTitle className="text-sm">Acheteurs</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-2">
                    <Store className="text-accent h-6 w-6" />
                  </div>
                  <CardTitle className="text-sm">Vendeurs</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center mb-2">
                    <Handshake className="text-success h-6 w-6" />
                  </div>
                  <CardTitle className="text-sm">Partenaires</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* FAQs */}
            <div className="space-y-12 bg-white rounded-3xl p-6 md:p-10 shadow-premium">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <ShoppingBag className="text-primary h-5 w-5" />
                  <h2 className="text-xl font-bold uppercase tracking-widest text-primary">Aide Acheteur</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {buyerFAQ.map((faq, i) => (
                    <AccordionItem key={i} value={`buyer-${i}`}>
                      <AccordionTrigger className="text-sm font-semibold text-left">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Store className="text-accent h-5 w-5" />
                  <h2 className="text-xl font-bold uppercase tracking-widest text-accent">Aide Vendeur</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {sellerFAQ.map((faq, i) => (
                    <AccordionItem key={i} value={`seller-${i}`}>
                      <AccordionTrigger className="text-sm font-semibold text-left">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Handshake className="text-success h-5 w-5" />
                  <h2 className="text-xl font-bold uppercase tracking-widest text-success">Aide Partenaire</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {partnerFAQ.map((faq, i) => (
                    <AccordionItem key={i} value={`partner-${i}`}>
                      <AccordionTrigger className="text-sm font-semibold text-left">{faq.q}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>

              <section className="pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="text-destructive h-5 w-5" />
                  <h2 className="text-xl font-bold uppercase tracking-widest text-destructive">📜 Produits Interdits & Conformité</h2>
                </div>
                <div className="bg-red-50/50 rounded-2xl p-6 border border-red-100">
                  <p className="text-sm text-red-800 font-semibold mb-4">
                    Pour garantir la sécurité de la communauté et l'éligibilité aux publicités (Facebook Ads), les articles suivants sont strictement interdits sur Epuremarket :
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-red-700/80 list-disc pl-4 font-medium">
                    <li>Tabac et produits connexes (Cigarettes, Vapes)</li>
                    <li>Alcool et boissons alcoolisées non autorisées</li>
                    <li>Armes, munitions et explosifs</li>
                    <li>Produits de santé et médicaments sur ordonnance</li>
                    <li>Services ou produits pour adultes / à caractère sexuel</li>
                    <li>Produits contrefaits ou violation de propriété intellectuelle</li>
                    <li>Animaux vivants ou espèces protégées</li>
                    <li>Produits bancaires, crypto-monnaies ou jeux d'argent</li>
                  </ul>
                  <p className="mt-4 text-[10px] text-red-600 italic">
                    Tout compte publiant ces articles sera suspendu sans préavis.
                  </p>
                </div>
              </section>
            </div>

            {/* Contact CTA */}
            <div className="rounded-3xl bg-primary p-8 text-center text-white space-y-6 overflow-hidden relative">
              <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2">Encore des questions ?</h3>
                <p className="opacity-80 mb-6">Notre équipe technique est disponible 7j/7 par WhatsApp et E-mail.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto" asChild>
                    <a href="https://wa.me/22899797499" target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp Support
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto" asChild>
                    <a href="mailto:support@epuregroup.tg">
                      <Mail className="mr-2 h-5 w-5" /> Email Direct
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

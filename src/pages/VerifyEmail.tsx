import { Link } from "react-router-dom";
import { MailCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageTransition from "@/components/PageTransition";

export default function VerifyEmail() {
  return (
    <PageTransition>
      <div className="flex min-h-[80vh] items-center justify-center py-12 px-4">
        <Card className="w-full max-w-lg border-2 border-primary/10 shadow-lg text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-display text-primary">Vérifiez votre boîte mail</CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-2">
              Nous venons de vous envoyer un lien magique pour valider votre compte VoiketMarket.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl bg-secondary/50 p-6 text-sm flex flex-col items-center justify-center">
              <p className="font-medium text-foreground mb-3 text-base">Vous ne le trouvez pas ?</p>
              <ul className="text-muted-foreground space-y-2 text-left list-disc list-inside">
                <li>Vérifiez l'onglet "Promotions" ou "Spams" (courriers indésirables).</li>
                <li>Patientez 2 petites minutes, il est peut-être en route.</li>
              </ul>
            </div>
            
            <div className="pt-4 border-t border-border/50">
              <Button asChild variant="default" className="w-full sm:w-auto mt-2">
                <Link to="/">
                  Retourner à l'accueil <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}

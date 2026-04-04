import { CheckCircle, ShieldCheck } from "lucide-react";

interface VerificationBadgeProps {
  status?: "none" | "verified" | "pro";
  size?: "sm" | "md";
}

export default function VerificationBadge({ status, size = "sm" }: VerificationBadgeProps) {
  if (!status || status === "none") return null;

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  if (status === "pro") {
    return (
      <span className="inline-flex items-center gap-1 text-accent font-black tracking-widest" title="Vendeur PRO">
        <ShieldCheck className={iconSize} />
        {size === "md" && <span className="text-[10px] uppercase">Partenaire Elite</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-green-500 font-bold" title="Vendeur Vérifié">
      <CheckCircle className={iconSize} />
      {size === "md" && <span className="text-[10px] uppercase">Vérifié</span>}
    </span>
  );
}

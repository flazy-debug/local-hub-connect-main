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
      <span className="inline-flex items-center gap-0.5 text-amber-500" title="Vendeur PRO">
        <ShieldCheck className={iconSize} />
        {size === "md" && <span className="text-xs font-semibold">PRO</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-blue-500" title="Vendeur Vérifié">
      <CheckCircle className={iconSize} />
      {size === "md" && <span className="text-xs font-semibold">Vérifié</span>}
    </span>
  );
}

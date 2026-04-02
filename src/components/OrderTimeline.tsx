import { CheckCircle2, Circle, Truck, Package, Clock } from "lucide-react";

interface OrderTimelineProps {
  status: "pending" | "paid" | "preparing" | "shipped" | "delivered" | "completed";
}

const steps = [
  { key: "paid", label: "Payé", icon: CheckCircle2 },
  { key: "preparing", label: "En préparation", icon: Package },
  { key: "shipped", label: "Expédié", icon: Truck },
  { key: "delivered", label: "Reçu", icon: CheckCircle2 },
];

const statusIndex: Record<string, number> = {
  pending: -1,
  paid: 0,
  preparing: 1,
  shipped: 2,
  delivered: 3,
  completed: 3,
};

export default function OrderTimeline({ status }: OrderTimelineProps) {
  const currentIdx = statusIndex[status] ?? -1;

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;
        const Icon = done ? step.icon : (active ? Clock : Circle);

        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                done ? "bg-success text-success-foreground" : active ? "bg-warning text-warning-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-xs font-medium ${done ? "text-success" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 ${idx < currentIdx ? "bg-success" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

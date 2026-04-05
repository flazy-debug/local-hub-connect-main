import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCFA } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface RestaurantOptionsProps {
  options: {
    variants?: { name: string; required: boolean; values: string[] }[];
    extras?: { name: string; price: number }[];
  };
  onUpdate: (selection: any) => void;
  className?: string;
}

export function RestaurantOptions({
  options,
  onUpdate,
  className,
}: RestaurantOptionsProps) {
  const [selectedVariants, setSelectedVariants] = React.useState<Record<string, string>>({});
  const [selectedExtras, setSelectedExtras] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    onUpdate({
      variants: selectedVariants,
      extras: selectedExtras,
      notes,
    });
  }, [selectedVariants, selectedExtras, notes, onUpdate]);

  const toggleExtra = (extraName: string) => {
    setSelectedExtras((prev) =>
      prev.includes(extraName)
        ? prev.filter((e) => e !== extraName)
        : [...prev, extraName]
    );
  };

  return (
    <div className={cn("space-y-8", className)}>
      {/* Variants (Mandatory/Optional Radios) */}
      {options.variants?.map((variant) => (
        <div key={variant.name} className="space-y-4">
          <div className="flex items-center gap-3">
            <h4 className="font-black text-slate-900 uppercase tracking-tighter text-sm">
              {variant.name}
            </h4>
            {variant.required && (
              <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
                Obligatoire
              </span>
            )}
          </div>
          <RadioGroup
            onValueChange={(val) => setSelectedVariants((prev) => ({ ...prev, [variant.name]: val }))}
            className="grid gap-3"
          >
            {variant.values.map((value) => (
              <div
                key={value}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                  selectedVariants[variant.name] === value
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-slate-100 bg-white hover:border-slate-200"
                )}
                onClick={() => setSelectedVariants((prev) => ({ ...prev, [variant.name]: value }))}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={value} id={`${variant.name}-${value}`} className="border-primary" />
                  <Label
                    htmlFor={`${variant.name}-${value}`}
                    className="font-bold text-slate-700 cursor-pointer text-sm"
                  >
                    {value}
                  </Label>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}

      {/* Extras (Checkboxes with Prices) */}
      {options.extras && options.extras.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-black text-slate-900 uppercase tracking-tighter text-sm">
            Suppléments
          </h4>
          <div className="grid gap-3">
            {options.extras.map((extra) => (
              <div
                key={extra.name}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                  selectedExtras.includes(extra.name)
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-slate-100 bg-white hover:border-slate-200"
                )}
                onClick={() => toggleExtra(extra.name)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`extra-${extra.name}`}
                    checked={selectedExtras.includes(extra.name)}
                    onCheckedChange={() => toggleExtra(extra.name)}
                    className="border-primary data-[state=checked]:bg-primary"
                  />
                  <Label
                    htmlFor={`extra-${extra.name}`}
                    className="font-bold text-slate-700 cursor-pointer text-sm"
                  >
                    {extra.name}
                  </Label>
                </div>
                <span className="font-black text-primary text-xs">
                  +{formatCFA(extra.price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kitchen Notes */}
      <div className="space-y-4">
        <h4 className="font-black text-slate-900 uppercase tracking-tighter text-sm">
          Notes de cuisine
        </h4>
        <Textarea
          placeholder="Allergies, préférences (ex: sans piment)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-2xl border-slate-100 bg-white p-4 font-medium text-sm focus-visible:ring-primary min-h-[100px] resize-none"
        />
      </div>
    </div>
  );
}

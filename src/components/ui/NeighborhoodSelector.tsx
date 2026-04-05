import * as React from "react";
import { Check, ChevronsUpDown, Search, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ALL_NEIGHBORHOODS, NEIGHBORHOOD_ZONES, ZONE_PRICES } from "@/lib/delivery-logic";

interface NeighborhoodSelectorProps {
  value?: string;
  onSelect: (neighborhood: string) => void;
  placeholder?: string;
  className?: string;
}

export function NeighborhoodSelector({
  value,
  onSelect,
  placeholder = "Rechercher un quartier...",
  className,
}: NeighborhoodSelectorProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-14 rounded-2xl border-muted/20 bg-white/50 px-6 font-bold text-lg hover:bg-white transition-all",
            className
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden text-slate-900">
            <MapPin className="h-5 w-5 text-primary/40 shrink-0" />
            <span className="truncate">
              {value ? value : placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 border-none shadow-2xl rounded-3xl overflow-hidden" align="start">
        <Command className="rounded-3xl border-none">
          <div className="flex items-center border-b border-muted/10 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder={placeholder} 
              className="h-14 border-none bg-transparent focus:ring-0 font-medium"
            />
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto p-2">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground font-medium">
              Aucun quartier trouvé.
            </CommandEmpty>
            <CommandGroup>
              {ALL_NEIGHBORHOODS.map((neighborhood) => {
                const zone = NEIGHBORHOOD_ZONES[neighborhood];
                const price = zone ? ZONE_PRICES[zone] : 0;
                
                return (
                  <CommandItem
                    key={neighborhood}
                    value={neighborhood}
                    onSelect={() => {
                      onSelect(neighborhood);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between py-3 px-4 rounded-xl cursor-pointer aria-selected:bg-primary/5 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-base">{neighborhood}</span>
                      <span className="text-[11px] text-primary font-black uppercase tracking-[0.15em]">Livraison: {price} CFA • Zone {zone}</span>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 text-primary",
                        value === neighborhood ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

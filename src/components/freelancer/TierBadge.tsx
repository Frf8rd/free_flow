import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { tierName } from "@/mocks/tiers";
import type { TierId } from "@/types";

export function TierBadge({ tier, className }: { tier: TierId; className?: string }) {
  return (
    <Badge variant="outline" className={className}>
      <ShieldCheck aria-hidden />
      Treapta {tierName(tier)}
    </Badge>
  );
}

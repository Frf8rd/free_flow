import { Sprout } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function TalentBadge({ className }: { className?: string }) {
  return (
    <Badge variant="coral" className={className}>
      <Sprout aria-hidden />
      Talent în creștere
    </Badge>
  );
}

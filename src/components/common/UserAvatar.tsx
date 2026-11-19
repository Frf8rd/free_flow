import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

interface UserAvatarProps {
  name: string;
  imageUrl?: string | undefined;
  className?: string;
}

export function UserAvatar({ name, imageUrl, className }: UserAvatarProps) {
  return (
    <Avatar aria-hidden className={cn("bg-primary-soft text-primary-soft-foreground", className)}>
      {imageUrl && <AvatarImage src={imageUrl} alt="" />}
      <AvatarFallback className="bg-primary-soft font-semibold text-primary-soft-foreground">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

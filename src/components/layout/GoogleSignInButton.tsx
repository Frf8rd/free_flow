import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

export function GoogleSignInButton() {
  const { t } = useI18n();

  return (
    <div className="mt-5">
      <div className="mb-4 flex items-center gap-3 text-small text-muted-foreground">
        <span aria-hidden className="h-px flex-1 bg-border" />
        <span>{t("auth.or")}</span>
        <span aria-hidden className="h-px flex-1 bg-border" />
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => toast.info(t("auth.googleNotConfigured"))}
      >
        <span aria-hidden className="font-bold text-[#4285F4]">
          G
        </span>
        {t("auth.continueGoogle")}
      </Button>
    </div>
  );
}

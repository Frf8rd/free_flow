import { Globe2 } from "lucide-react";

import { useI18n, type Locale } from "@/i18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className="relative flex items-center">
      <Globe2 className="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden />
      <span className="sr-only">{t("language.label")}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
        aria-label={t("language.label")}
        className={
          "h-11 cursor-pointer appearance-none rounded-full border border-border bg-panel pr-3 text-sm font-medium text-foreground outline-none transition-colors hover:border-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring " +
          (compact ? "w-11 pl-3 text-transparent" : "w-[132px] pl-10")
        }
      >
        <option value="ro">{t("language.ro")}</option>
        <option value="ru">{t("language.ru")}</option>
        <option value="en">{t("language.en")}</option>
      </select>
    </label>
  );
}

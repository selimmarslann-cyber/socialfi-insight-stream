import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const languages = [
  { code: "en", name: "English", native: "English" },
  { code: "zh", name: "Chinese (Simplified)", native: "中文" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "fr", name: "French", native: "Français" },
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "th", name: "Thai", native: "ไทย" },
  { code: "tl", name: "Filipino (Tagalog)", native: "Filipino" },
];

export const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const currentLang = languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-2 rounded-xl border border-border-subtle bg-surface text-text-primary hover:bg-surface-muted"
          aria-label={t("language.select")}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden text-xs font-medium sm:inline">{currentLang.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-xl border-2 border-border-subtle bg-card shadow-xl"
      >
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t("language.select")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {languages.map((lang) => {
            const isActive = i18n.language === lang.code;
            return (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400"
                    : "text-text-primary hover:bg-surface-muted",
                )}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{lang.native}</span>
                  <span className="text-xs text-text-muted">{lang.name}</span>
                </div>
                {isActive && <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


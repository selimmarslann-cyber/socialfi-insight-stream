import { useEffect, useMemo, useState } from "react";
import { MonitorSmartphone, Moon, Sun, Bell, ShieldCheck } from "lucide-react";
import { Container } from "@/components/layout/Container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useWalletStore } from "@/lib/store";
import {
  getThemePreference,
  setTheme,
  subscribeTheme,
  type ThemePreference,
} from "@/lib/theme";
import { usePageMetadata } from "@/hooks/usePageMetadata";

type LanguageOption = "en" | "tr";

interface NotificationPreferences {
  posts: boolean;
  mentions: boolean;
  rewards: boolean;
  product: boolean;
}

interface StoredSettings {
  language: LanguageOption;
  notifications: NotificationPreferences;
  theme: ThemePreference;
}

const SETTINGS_STORAGE_KEY = "nil.settings.v1";

const defaultNotifications: NotificationPreferences = {
  posts: true,
  mentions: true,
  rewards: true,
  product: false,
};

export default function Settings() {
  usePageMetadata({
    title: "Settings — NOP Intelligence Layer",
    description: "Manage appearance, language, and notification preferences.",
  });

  const { refCode } = useWalletStore();
  const displayRefCode = useMemo(() => refCode || "nop00000", [refCode]);
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => getThemePreference());
  const [language, setLanguage] = useState<LanguageOption>("en");
  const [notifications, setNotifications] = useState<NotificationPreferences>(defaultNotifications);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StoredSettings;
        if (parsed.language) {
          setLanguage(parsed.language);
        }
        if (parsed.notifications) {
          setNotifications({ ...defaultNotifications, ...parsed.notifications });
        }
        if (parsed.theme) {
          setThemePreference(parsed.theme);
          setTheme(parsed.theme);
        }
      }
    } catch {
      // ignore malformed preferences
    }
  }, []);

  useEffect(() => {
    setThemePreference(getThemePreference());
    const unsubscribe = subscribeTheme(setThemePreference);
    return () => unsubscribe();
  }, []);

  const handleThemeSelection = (next: ThemePreference) => {
    setThemePreference(next);
    setTheme(next);
    toast.success(
      next === "system"
        ? "Theme follows your device preference"
        : next === "dark"
          ? "Dark mode activated"
          : "Light mode activated",
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      const payload: StoredSettings = {
        language,
        notifications,
        theme: themePreference,
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
      }
      toast.success("Settings saved");
    } catch {
      toast.error("Unable to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const switchItem = (
    id: keyof NotificationPreferences,
    label: string,
    description: string,
  ) => (
    <div
      key={id}
      className="flex items-center justify-between rounded-2xl border border-[color:var(--ring)] px-4 py-3"
    >
      <div>
        <p className="text-sm font-medium text-[color:var(--text-primary)]">{label}</p>
        <p className="text-xs text-[color:var(--text-secondary)]">{description}</p>
      </div>
      <Switch
        id={`notif-${id}`}
        checked={notifications[id]}
        onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [id]: checked }))}
        aria-label={label}
      />
    </div>
  );

  return (
    <Container>
      <div className="mx-auto max-w-4xl space-y-8 py-10">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
            Preferences
          </p>
          <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">Control center</h1>
          <p className="max-w-2xl text-sm text-[color:var(--text-secondary)]">
            Tune appearance, language, notifications, and experimental features without leaving the feed.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-6">
            <Card className="border-none bg-[color:var(--bg-card)] shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[color:var(--text-primary)]">
                  <MonitorSmartphone className="h-5 w-5 text-indigo-400" />
                  Appearance & language
                </CardTitle>
                <CardDescription>
                  Choose how the interface looks and which language you prefer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">
                    Theme mode
                  </Label>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {[
                      {
                        id: "light",
                        label: "Light",
                        description: "Daytime clarity",
                        icon: Sun,
                      },
                      {
                        id: "dark",
                        label: "Dark",
                        description: "Midnight focus",
                        icon: Moon,
                      },
                      {
                        id: "system",
                        label: "System",
                        description: "Auto adapt",
                        icon: MonitorSmartphone,
                      },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleThemeSelection(option.id as ThemePreference)}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          themePreference === option.id
                            ? "border-indigo-400 bg-indigo-500/10"
                            : "border-[color:var(--ring)] hover:border-indigo-300/60"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4 text-indigo-400" />
                          <span className="text-sm font-semibold text-[color:var(--text-primary)]">
                            {option.label}
                          </span>
                        </div>
                        <p className="text-xs text-[color:var(--text-secondary)]">
                          {option.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">
                    Language
                  </Label>
                  <div className="mt-2 flex items-center gap-3">
                    <Select value={language} onValueChange={(value) => setLanguage(value as LanguageOption)}>
                      <SelectTrigger className="w-52 rounded-2xl border-[color:var(--ring)] bg-[color:var(--bg-base)]">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English (EN)</SelectItem>
                        <SelectItem value="tr">Türkçe (TR)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant="outline" className="rounded-full border border-[color:var(--ring)]">
                      Localization beta
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-[color:var(--bg-card)] shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[color:var(--text-primary)]">
                  <Bell className="h-5 w-5 text-indigo-400" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Decide which signals hit your inbox or push channels. Changes apply instantly when saved.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {switchItem("posts", "Creator drops", "Pings when high-signal accounts publish.")}
                {switchItem("mentions", "Mentions", "Only when someone tags your handle.")}
                {switchItem("rewards", "Reward updates", "Claimable NOP, boosts, or referrals.")}
                {switchItem("product", "Product updates", "Alpha features and release notes.")}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none bg-[color:var(--bg-card)] shadow-sm">
              <CardHeader>
                <CardTitle className="text-[color:var(--text-primary)]">Access</CardTitle>
                <CardDescription>Your referral handle stays active once you copy it.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-[color:var(--ring)] bg-[color:var(--bg-base)] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">
                    Referral code
                  </p>
                  <p className="font-mono text-lg text-[color:var(--text-primary)]">{displayRefCode}</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full rounded-2xl"
                  onClick={() => {
                    void navigator.clipboard.writeText(displayRefCode);
                    toast.success("Referral code copied");
                  }}
                >
                  Copy referral code
                </Button>
                <p className="text-xs text-[color:var(--text-secondary)]">
                  Share it with researchers you trust. Every verified contribution mints both sides.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none bg-[color:var(--bg-card)] shadow-sm">
              <CardHeader className="space-y-2">
                <CardTitle className="flex items-center gap-2 text-[color:var(--text-primary)]">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  Session state
                </CardTitle>
                <CardDescription>
                  Wallet-bound authentication will roll out shortly. Meanwhile, sessions auto-expire every 24h.
                </CardDescription>
              </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="rounded-full border border-[color:var(--ring)]">
                    Preview build
                  </Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            className="rounded-full px-8"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save settings"}
          </Button>
        </div>
      </div>
    </Container>
  );
}

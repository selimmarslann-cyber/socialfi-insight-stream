import { FormEvent, useEffect, useState } from "react";
import { Flame, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { BurnStats } from "@/types/admin";
import { PUBLIC_ENV } from "@/config/env";

const BURN_ENDPOINT = "/api/burn";
const DIGIT_COUNT = 8;

const sanitizeDigits = (value: number | string | null | undefined): string =>
  (typeof value === "number"
    ? Math.max(0, Math.floor(value)).toString()
    : (value ?? "").toString()
  )
    .replace(/[^\d]/g, "")
    .slice(0, DIGIT_COUNT);

export const BurnPanel = () => {
  const [form, setForm] = useState({ total: "", last24h: "0" });
  const [series, setSeries] = useState<BurnStats["series"]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch(BURN_ENDPOINT, {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`burn_fetch_${response.status}`);
        const data = (await response.json()) as BurnStats;
          setForm({
            total: sanitizeDigits(data.total),
            last24h: (data.last24h ?? 0).toString(),
          });
        setSeries(Array.isArray(data.series) ? data.series : []);
      } catch (error) {
        toast.error("Burn verileri alınamadı");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (form.total.length !== DIGIT_COUNT) {
        toast.error(`Toplam yakım ${DIGIT_COUNT} haneli olmalı.`);
        return;
      }

      const payload = {
        total: Number(form.total),
        last24h: Number(form.last24h || "0"),
        series,
      };

      const adminToken = PUBLIC_ENV.adminToken;
      if (!adminToken) {
        toast.error(
          "VITE_ADMIN_TOKEN eksik. Yetkili erişim için env değerini ekleyin.",
        );
        return;
      }

      const response = await fetch(BURN_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`burn_update_${response.status}`);
      }

      toast.success("Burn verileri güncellendi");
    } catch (error) {
      toast.error("Burn verileri güncellenemedi");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[color:var(--text-primary)]">
          <Flame className="h-5 w-5 text-[var(--menu-active)]" />
          Burn İstatistikleri
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="burn-total">Toplam Yakım</Label>
              <Input
                id="burn-total"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={DIGIT_COUNT}
                placeholder="00000000"
                value={form.total}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    total: sanitizeDigits(event.target.value),
                  }))
                }
                disabled={loading || saving}
                className="font-mono tracking-[0.3em]"
              />
              <p className="text-xs text-muted-foreground">
                Tam olarak {DIGIT_COUNT} haneyi doldurun (sadece rakam).
              </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="burn-last24h">Son 24 Saat</Label>
            <Input
              id="burn-last24h"
              type="number"
              inputMode="numeric"
              value={form.last24h}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, last24h: event.target.value }))
              }
              disabled={loading || saving}
              className="font-mono"
            />
          </div>
          <Button type="submit" disabled={saving || loading} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BurnPanel;

import { FormEvent, useEffect, useState } from 'react';
import { Flame, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { BurnStats } from '@/types/admin';

const BURN_ENDPOINT = '/api/burn';

const formatNumber = (value: number | string) => {
  if (typeof value === 'number') return value.toString();
  return value;
};

export const BurnPanel = () => {
  const [form, setForm] = useState({ total: '0', last24h: '0' });
  const [series, setSeries] = useState<BurnStats['series']>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch(BURN_ENDPOINT, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`burn_fetch_${response.status}`);
        const data = (await response.json()) as BurnStats;
        setForm({
          total: formatNumber(data.total ?? 0),
          last24h: formatNumber(data.last24h ?? 0),
        });
        setSeries(Array.isArray(data.series) ? data.series : []);
      } catch (error) {
        toast.error('Burn verileri alınamadı');
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
      const payload = {
        total: Number(form.total),
        last24h: Number(form.last24h),
        series,
      };

      const response = await fetch(BURN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_ADMIN_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`burn_update_${response.status}`);
      }

      toast.success('Burn verileri güncellendi');
    } catch (error) {
      toast.error('Burn verileri güncellenemedi');
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
              type="number"
              inputMode="numeric"
              value={form.total}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, total: event.target.value }))
              }
              disabled={loading || saving}
              className="font-mono"
            />
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

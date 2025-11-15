import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import type { BurnStats } from "@/types/admin";

const BURN_ENDPOINT = "/api/burn";
const DIGIT_COUNT = 8;

const numberFormatter = new Intl.NumberFormat("tr-TR");

const formatDigits = (value?: number | null): string[] => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return Array.from({ length: DIGIT_COUNT }).map(() => "0");
  }
  const normalized = Math.max(0, Math.floor(value));
  return normalized
    .toString()
    .padStart(DIGIT_COUNT, "0")
    .slice(-DIGIT_COUNT)
    .split("");
};

export default function TokenBurn() {
  const [data, setData] = useState<BurnStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(BURN_ENDPOINT, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`burn_${response.status}`);
      }
      const payload = (await response.json()) as BurnStats;
      setData(payload);
    } catch (err) {
      console.error("Token burn fetch failed", err);
      setData(null);
      setError("Yakım verisi alınamadı.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const digits = useMemo(() => formatDigits(data?.total), [data?.total]);

  const subtitle = data?.updatedAt
    ? `Last update: ${new Date(data.updatedAt).toLocaleString()}`
    : "Manual admin feed";

  const last24h =
    typeof data?.last24h === "number" && !Number.isNaN(data.last24h)
      ? data.last24h
      : null;

  return (
    <Card
      title="Token Burn"
      subtitle={subtitle}
      error={error || undefined}
      onRetry={error ? load : undefined}
      right={
        loading ? (
          <span className="text-xs font-semibold uppercase text-slate-400">
            Updating…
          </span>
        ) : null
      }
    >
      {loading && !data ? (
        <div className="space-y-3">
          <div className="h-12 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="h-6 w-1/2 rounded-full bg-slate-100 animate-pulse" />
        </div>
      ) : null}

      {!loading && !data && !error ? (
        <p className="text-sm text-slate-500">
          Henüz bir yakım değeri girilmedi. Admin panelinden 8 haneli yeni bir
          toplam girdiğinde burada görünecek.
        </p>
      ) : null}

      {!error && data ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {digits.map((digit, index) => (
              <span
                key={`${digit}-${index}`}
                className="grid h-12 w-10 place-items-center rounded-lg border border-slate-200 bg-slate-50 font-mono text-xl font-semibold text-slate-800 shadow-sm"
              >
                {digit}
              </span>
            ))}
          </div>

          <div className="space-y-1">
            <p className="text-2xl font-bold text-slate-900">
              {typeof data.total === "number"
                ? `${numberFormatter.format(data.total)} NOP`
                : "0 NOP"}
            </p>
            {last24h !== null ? (
              <p
                className={`text-xs font-semibold ${
                  last24h >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {`${last24h >= 0 ? "+" : "-"}${numberFormatter.format(
                  Math.abs(last24h),
                )} NOP · last 24h`}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

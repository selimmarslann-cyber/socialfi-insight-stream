import StaticPageLayout from "@/components/layout/StaticPageLayout";
import TokenBurn from "@/components/TokenBurn";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const Burn = () => {
  usePageMetadata({
    title: "Token Burn Transparency",
    description:
      "Track live NOP burn totals sourced directly from Supabase and understand how the deflationary engine keeps incentives aligned.",
  });

  return (
    <StaticPageLayout>
      <section className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold text-[#0F172A]">Token Burn</h1>
          <p className="leading-relaxed text-[#475569]">
            This dashboard surfaces the latest NOP burn totals synced from the
            `burn_widget` table on Supabase. Admins update the feed regularly to keep the
            community aligned on demand-side pressure and treasury stewardship.
          </p>
        </header>

        <div className="rounded-2xl bg-white/90 p-6 shadow-sm">
          <TokenBurn />
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-6 shadow-sm leading-relaxed text-[#475569]">
          <p>
            Burn events are logged directly on-chain and mirrored through this widget for
            fast verification. Historical entries and drill-down analytics will ship in
            a future release.
          </p>
          <p className="text-sm text-slate-500">
            Şeffaflık için yakım verisi periyodik olarak admin panelinden güncellenir. Bu
            sayfa sadece görüntüleme amaçlıdır.
          </p>
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default Burn;

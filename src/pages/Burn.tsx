import StaticPageLayout from "@/components/layout/StaticPageLayout";
import TokenBurn from "@/components/TokenBurn";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const Burn = () => {
  usePageMetadata({
    title: "Token Burn Transparency",
    description:
      "Track the manually curated NOP burn feed. Admins push 8-digit totals via the control panel so the community can verify deflation cadence.",
  });

  return (
    <StaticPageLayout>
      <section className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold text-[#0F172A]">Token Burn</h1>
          <p className="leading-relaxed text-[#475569]">
            This dashboard surfaces the latest NOP burn totals straight from the admin control panel.
            There is no automated on-chain sync yet — operations team members enter an 8 haneli (digit) total after every burn event and the board below mirrors it immediately for the community.
          </p>
        </header>

        <div className="rounded-2xl bg-white/90 p-6 shadow-sm">
          <TokenBurn />
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-6 shadow-sm leading-relaxed text-[#475569]">
          <p>
            Future work will wire the widget to an indexed on-chain feed plus history charts, but until then the manual workflow keeps messaging consistent across Discord, Render, and Vercel previews.
          </p>
          <p className="text-sm text-slate-500">
            Şeffaflık için yakım verisi periyodik olarak admin panelinden güncellenir. Bu sayfa sadece görüntüleme amaçlıdır.
          </p>
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default Burn;

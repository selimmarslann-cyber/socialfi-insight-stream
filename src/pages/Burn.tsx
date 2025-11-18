import TokenBurn from "@/components/TokenBurn";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";

const Burn = () => {
  usePageMetadata({
    title: "Token Burn Transparency",
    description:
      "Track the manually curated NOP burn feed. Admins push 8-digit totals via the control panel so the community can verify deflation cadence.",
  });

  return (
      <div className="space-y-5">
        <DashboardCard className="space-y-3">
          <DashboardSectionTitle label="Tokenomics" title="NOP burn overview" />
          <p className="text-sm-2 leading-relaxed text-text-secondary">
            Track the latest manual burn updates from the operations desk. Each entry reflects the deflation cadence shared with
            partners before the on-chain feed is automated.
          </p>
        </DashboardCard>

        <TokenBurn />

        <DashboardCard className="space-y-3">
          <DashboardSectionTitle label="Transparency" title="How data is captured" />
          <p className="text-sm-2 leading-relaxed text-text-secondary">
            Future iterations will connect directly to the indexed burn registry. Until then, admins submit 8-digit totals that sync
            instantly to this card so Discord, dashboard, and partner previews remain aligned.
          </p>
          <p className="text-xs-2 text-text-muted">
            Şeffaflık için yakım verisi periyodik olarak admin panelinden güncellenir. Bu sayfa sadece görüntüleme amaçlıdır.
          </p>
        </DashboardCard>
      </div>
  );
};

export default Burn;

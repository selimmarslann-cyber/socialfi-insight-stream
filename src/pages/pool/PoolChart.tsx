import { useParams } from "react-router-dom";
import { usePoolAccess } from "@/hooks/usePoolAccess";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";

const PoolChart = () => {
  const { postId } = useParams<{ postId: string }>();
  const { contribute } = usePoolAccess(postId);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <DashboardCard className="space-y-2">
        <DashboardSectionTitle label="Pool" title={`${contribute?.title ?? `Pool #${postId}`} · Chart`} />
        <p className="text-sm text-slate-600">
          Grafik entegrasyonu yakında. Şimdilik zincir verileri overview ve buy/sell sayfalarından takip edilebilir.
        </p>
      </DashboardCard>
    </div>
  );
};

export default PoolChart;

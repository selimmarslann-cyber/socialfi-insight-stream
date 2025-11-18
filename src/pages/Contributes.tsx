import { useQuery } from "@tanstack/react-query";
import { ContributeCard } from "@/components/ContributeCard";
import { fetchContributes } from "@/lib/contributes";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";

const Contributes = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["contributes"],
    queryFn: fetchContributes,
  });

  return (
    <div className="space-y-5">
        <DashboardCard className="space-y-3">
        <DashboardSectionTitle label="Pools" title="Contributes" />
          <p className="text-sm-2 leading-relaxed text-text-secondary">
          Follow the latest community pools, view pool charts, and access onboarding steps before each listing opens.
        </p>
      </DashboardCard>

      {isLoading ? (
          <DashboardCard>
            <p className="text-sm-2 text-text-muted">Loading pools…</p>
        </DashboardCard>
      ) : null}

      {!isLoading && (data?.length ?? 0) === 0 ? (
        <DashboardCard>
            <p className="text-sm-2 text-text-muted">Henüz aktif katkı bulunmuyor.</p>
        </DashboardCard>
      ) : null}

      {!isLoading && data ? (
        <div className="grid gap-4">
          {data.map((item) => (
            <ContributeCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Contributes;

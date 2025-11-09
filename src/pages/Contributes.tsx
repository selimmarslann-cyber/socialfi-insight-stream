import { useQuery } from "@tanstack/react-query";
import { Container } from "@/components/layout/Container";
import { ContributeCard } from "@/components/ContributeCard";
import { fetchContributes } from "@/lib/contributes";

const Contributes = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["contributes"],
    queryFn: fetchContributes,
  });

  return (
    <Container>
      <div className="max-w-5xl mx-auto space-y-6 py-8">
        <div>
          <h1 className="text-3xl font-bold">Contributes</h1>
          <p className="muted">Pool erişimi olan katkıları buradan takip edebilirsiniz.</p>
        </div>

        {isLoading && <p className="muted">Yükleniyor...</p>}

        {!isLoading && (data?.length ?? 0) === 0 && <p className="muted">Henüz aktif katkı bulunmuyor.</p>}

        {!isLoading && data && (
          <div className="grid gap-4">
            {data.map((item) => (
              <ContributeCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default Contributes;

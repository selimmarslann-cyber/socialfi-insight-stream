import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/Container";
import { usePoolAccess } from "@/hooks/usePoolAccess";

const PoolChart = () => {
  const { postId } = useParams<{ postId: string }>();
  const { contribute } = usePoolAccess(postId);

  return (
    <Container>
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{contribute?.title ?? `Pool #${postId}`} - Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="muted">
              Grafik entegrasyonu yakında. Şimdilik Zincir verileri pool sayfalarından takip edilebilir.
            </p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};

export default PoolChart;

import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchAdminContribute, toggleContributePool } from "@/backend/contributes";
import { useAuthStore } from "@/lib/store";

export default function AdminContributeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAdmin) navigate("/admin");
  }, [isAdmin, navigate]);

  const { data: contribute, isLoading } = useQuery({
    queryKey: ["admin-contribute", id],
    queryFn: async () => {
      if (!id) throw new Error("Missing contribute id");
      return fetchAdminContribute(id);
    },
    enabled: isAdmin && Boolean(id),
  });

  const poolToggle = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Missing contribute id");
      const nextState = contribute?.poolEnabled !== true;
      return toggleContributePool(id, nextState);
    },
    onSuccess: (response) => {
      queryClient.setQueryData(["admin-contribute", id], (prev: typeof contribute) =>
        prev
          ? {
              ...prev,
              poolEnabled: response.poolEnabled,
              contractPostId: response.contractPostId ?? prev.contractPostId ?? null,
            }
          : prev,
      );
      toast.success(response.poolEnabled ? "Invest havuzu açıldı" : "Invest havuzu kapatıldı");
    },
    onError: () => {
      toast.error("Hata oluştu, lütfen tekrar deneyin");
    },
  });

  if (!isAdmin) {
    return (
      <Container>
        <div className="max-w-2xl mx-auto text-center py-16">
          <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">403 - Access Denied</h2>
          <p className="text-muted-foreground">This page is only accessible to administrators</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>{contribute?.title ?? "Contribute"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p className="muted">Yükleniyor...</p>}
          {!isLoading && (
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Pool durumu</span>
                <span className="text-lg font-semibold">{contribute?.poolEnabled ? "Açık" : "Kapalı"}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">Contract Post ID</span>
                <span className="text-lg font-semibold">{contribute?.contractPostId ?? "—"}</span>
              </div>
              <Button onClick={() => poolToggle.mutate()} disabled={poolToggle.isLoading} variant="outline">
                {contribute?.poolEnabled ? "Kapat" : "Invest Aç"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

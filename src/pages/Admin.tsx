import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { ShieldCheck, Copy, Loader2, LogOut } from "lucide-react";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuthStore, ADMIN_USERNAME, ADMIN_PASSWORD } from "@/lib/store";
import BurnPanel from "./admin/BurnPanel";

export default function Admin() {
  usePageMetadata({
    title: "Admin Access — NOP Intelligence Layer",
    description: "Secure gateway for burn operations and analytics.",
  });

  const [details, setDetails] = useState({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [adminLink, setAdminLink] = useState("/admin");
  const { isAdmin, login, logout } = useAuthStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAdminLink(`${window.location.origin}/admin`);
    }
  }, []);

  const handleChange = (field: keyof typeof details) => (event: ChangeEvent<HTMLInputElement>) => {
    setDetails((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    const success = login(details.email, details.password);
    setSubmitting(false);

    if (success) {
      toast.success("Admin paneline erişim açıldı.");
      setDetails({ email: "", password: "" });
    } else {
      toast.error("Kullanıcı adı veya şifre hatalı.");
    }
  };

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(adminLink);
      } else if (typeof document !== "undefined") {
        const helper = document.createElement("input");
        helper.value = adminLink;
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        document.body.removeChild(helper);
      }
      toast.success("Admin linki panoya kopyalandı.");
    } catch (error) {
      console.error(error);
      toast.error("Link kopyalanamadı.");
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Admin oturumu kapatıldı.");
  };

  return (
    <StaticPageLayout>
        <section className="space-y-8">
          <div className="space-y-3 rounded-3xl border border-[color:var(--ring)] bg-[color:var(--bg-card)] p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-indigo-400" />
              <div>
                <p className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">Yetkili Alan</p>
                <h1 className="text-2xl font-semibold text-[color:var(--text-primary)]">Admin paneli</h1>
              </div>
            </div>
            <p className="text-sm text-[color:var(--text-secondary)]">
              Sistem yöneticileri burada yakım verilerini ve özel araçları yönetebilir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-[color:var(--ring)] bg-[color:var(--bg-card)] p-4 shadow-sm">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">Admin giriş linki</p>
              <p className="font-mono text-sm text-[color:var(--text-primary)]" title={adminLink}>
                {adminLink}
              </p>
            </div>
            <Button variant="outline" className="gap-2 rounded-full" onClick={handleCopyLink}>
              <Copy className="h-4 w-4" />
              Linki kopyala
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-[color:var(--ring)] bg-[color:var(--bg-card)]">
              <CardHeader>
                <CardTitle className="text-xl text-[color:var(--text-primary)]">
                  {isAdmin ? "Aktif admin oturumu" : "Admin girişi"}
                </CardTitle>
                <CardDescription>
                  {isAdmin
                    ? "Oturumunuz açık. Sağdaki panelden yakım verilerini güncelleyebilirsiniz."
                    : "Yetkili e-posta ve şifreyi girerek admin araçlarını açın."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAdmin ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[color:var(--ring)] bg-[color:var(--bg-muted)]/40 p-4">
                      <p className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">Email</p>
                      <p className="font-medium text-[color:var(--text-primary)]">{ADMIN_USERNAME}</p>
                    </div>
                    <Button onClick={handleLogout} className="gap-2 rounded-full">
                      <LogOut className="h-4 w-4" />
                      Oturumu kapat
                    </Button>
                    <p className="text-xs text-[color:var(--text-secondary)]">
                      Admin araçlarına erişim için bu sekmeyi açık tutmanız yeterlidir.
                    </p>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder={ADMIN_USERNAME}
                        value={details.email}
                        onChange={handleChange("email")}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Şifre</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="••••••••"
                        value={details.password}
                        onChange={handleChange("password")}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-[color:var(--text-secondary)]">
                        Yetkili hesap: {ADMIN_USERNAME} / {ADMIN_PASSWORD}
                      </p>
                      <Button type="submit" className="gap-2 rounded-full px-8" disabled={submitting}>
                        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Giriş yap
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {isAdmin ? (
              <BurnPanel />
            ) : (
              <Card className="border border-dashed border-[color:var(--ring)] bg-[color:var(--bg-card)]">
                <CardHeader>
                  <CardTitle className="text-[color:var(--text-primary)]">Yakım paneli kilitli</CardTitle>
                  <CardDescription>Giriş yaptıktan sonra gerçek zamanlı yakım verilerini düzenleyebilirsiniz.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-[color:var(--text-secondary)]">
                    <li>Toplam yakım sayılarını güncelleyin</li>
                    <li>24 saatlik verilere manuel giriş yapın</li>
                    <li>Admin token ile API üzerinden senkronize edin</li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
    </StaticPageLayout>
  );
}

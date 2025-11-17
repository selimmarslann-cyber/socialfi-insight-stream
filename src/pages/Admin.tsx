import { useState, ChangeEvent, FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import BurnPanel from "./admin/BurnPanel";

const ADMIN_DISABLED_MESSAGE =
  "Admin access is disabled in this preview build. Secure MPC auth + on-chain controls ship with Phase 3.";

export default function Admin() {
  usePageMetadata({
    title: "Admin Access — NOP Intelligence Layer",
    description: "Secure gateway for burn operations and analytics.",
  });

  const [details, setDetails] = useState({
    email: "",
    password: "",
    accessKey: "",
    message: "",
  });

  const handleChange = (field: keyof typeof details) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDetails((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.info(ADMIN_DISABLED_MESSAGE);
  };

  return (
    <StaticPageLayout>
      <section className="space-y-8">
        <div className="space-y-3 rounded-3xl border border-[color:var(--ring)] bg-[color:var(--bg-card)] p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-indigo-400" />
            <div>
              <p className="text-xs uppercase tracking-wide text-[color:var(--text-secondary)]">Restricted area</p>
              <h1 className="text-2xl font-semibold text-[color:var(--text-primary)]">Admin sign-in</h1>
            </div>
          </div>
          <div className="space-y-2 text-sm text-[color:var(--text-secondary)]">
            <p>{ADMIN_DISABLED_MESSAGE}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>MPC wallet + SafeAuth upgrades for privileged writes</li>
              <li>Server-side burn + treasury controls routed via signed jobs</li>
              <li>Immutable audit logging with SIEM export + alerting</li>
            </ul>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-[color:var(--ring)] bg-[color:var(--bg-card)]">
            <CardHeader>
              <CardTitle className="text-xl text-[color:var(--text-primary)]">Request access</CardTitle>
              <CardDescription>
                Credentials are queued for manual review until the hardened auth service is online.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="ops@noplayer.ai"
                      value={details.email}
                      onChange={handleChange("email")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="••••••••"
                      value={details.password}
                      onChange={handleChange("password")}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-access">Access key (optional)</Label>
                  <Input
                    id="admin-access"
                    placeholder="NOP-OPS-XXXX"
                    value={details.accessKey}
                    onChange={handleChange("accessKey")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-notes">Notes</Label>
                  <Textarea
                    id="admin-notes"
                    rows={4}
                    placeholder="Share context so we can approve faster…"
                    value={details.message}
                    onChange={handleChange("message")}
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-[color:var(--text-secondary)]">
                    Preview environment — this form notifies the ops team but does not unlock admin controls yet.
                  </p>
                  <Button type="submit" className="rounded-full px-8">
                    Submit request
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <BurnPanel />
        </div>
      </section>
    </StaticPageLayout>
  );
}

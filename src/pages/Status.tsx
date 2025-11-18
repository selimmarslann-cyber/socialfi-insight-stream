import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const statusModules = [
  { name: "App", state: "Operational", note: "Web client + wallet bridge healthy." },
  { name: "API", state: "Provisioning", note: "Read-only endpoints open, writes approaching beta." },
  { name: "Supabase", state: "Limited", note: "Storage layer requires admin secret before we expose uploads." },
];

const Status = () => {
  usePageMetadata({
    title: "Status • NOP Intelligence Layer",
    description: "Live system status and incident notes.",
  });

  return (
    <StaticPageLayout>
        <section className="space-y-8">
          <div className="space-y-4 rounded-3xl border border-[color:var(--ring)] bg-[color:var(--bg-card)] p-8 shadow-sm">
            <Badge variant="outline" className="rounded-full border border-lime-400/40 text-xs text-lime-300">
              Preview feed
          </Badge>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
              Observability
            </p>
            <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">
              System status
            </h1>
            <p className="text-sm text-[color:var(--text-secondary)]">
              Real-time dashboards will publish uptime, incident postmortems, and burn queue health once the monitoring stack is live.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {statusModules.map((module) => (
            <Card key={module.name} className="border border-[color:var(--ring)] bg-[color:var(--bg-card)]">
              <CardHeader>
                <CardTitle className="text-base text-[color:var(--text-primary)]">{module.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge
                  variant="outline"
                  className={`rounded-full border px-3 text-xs ${
                    module.state === "Operational"
                      ? "border-emerald-300/50 text-emerald-300"
                      : module.state === "Provisioning"
                        ? "border-amber-300/50 text-amber-300"
                        : "border-rose-300/50 text-rose-300"
                  }`}
                >
                  {module.state}
                </Badge>
                <p className="text-sm text-[color:var(--text-secondary)]">{module.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default Status;

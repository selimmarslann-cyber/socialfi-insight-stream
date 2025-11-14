import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const endpoints = [
  {
    name: "POST /v1/insights",
    status: "Private beta",
    description: "Submit signed insight payloads with encrypted attachments.",
  },
  {
    name: "GET /v1/feed",
    status: "Coming soon",
    description: "Filter the public signal feed by tags, wallets, and burn weight.",
  },
  {
    name: "POST /v1/burn",
    status: "Gated",
    description: "Trigger proof-of-burn receipts that tie to leaderboard entries.",
  },
];

const DocsApi = () => {
  usePageMetadata({
    title: "API Docs • NOP Intelligence Layer",
    description: "Developer documentation for builders integrating NOP.",
  });

  return (
    <StaticPageLayout>
      <section className="space-y-8">
        <div className="space-y-4 rounded-3xl border border-[color:var(--ring)] bg-[color:var(--bg-card)] p-8 shadow-sm">
          <Badge variant="outline" className="rounded-full border border-emerald-400/40 text-xs text-emerald-300">
            Coming soon
          </Badge>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
              Developer surface
            </p>
            <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">API documentation</h1>
            <p className="text-sm text-[color:var(--text-secondary)]">
              REST + webhook references are being finalised. Below is a preview of the initial endpoints.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {endpoints.map((endpoint) => (
            <Card key={endpoint.name} className="border border-[color:var(--ring)] bg-[color:var(--bg-card)]">
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="font-mono text-base text-[color:var(--text-primary)]">
                  {endpoint.name}
                </CardTitle>
                <Badge variant="outline" className="w-fit rounded-full border border-[color:var(--ring)] px-3 text-xs">
                  {endpoint.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[color:var(--text-secondary)]">{endpoint.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default DocsApi;

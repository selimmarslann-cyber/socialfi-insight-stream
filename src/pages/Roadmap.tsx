import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const roadmapPhases = [
  {
    title: "Phase 01 · Validation",
    bullets: ["Manual curation of insights", "Proof-of-burn leaderboard", "Wallet-linked identity"],
  },
  {
    title: "Phase 02 · Automation",
    bullets: ["AI-assisted scoring and anomaly tracing", "Boosted task hub", "On-chain payout vaults"],
  },
  {
    title: "Phase 03 · Markets",
    bullets: [
      "Permissionless signal pools",
      "NOP-denominated staking",
      "Automated dispute resolution with burn slashing",
    ],
  },
];

const Roadmap = () => {
  usePageMetadata({
    title: "Roadmap • NOP Intelligence Layer",
    description: "Track the milestones and launch windows for the network.",
  });

  return (
    <StaticPageLayout>
      <section className="space-y-8">
        <div className="space-y-4 rounded-3xl border border-[color:var(--ring)] bg-[color:var(--bg-card)] p-8 shadow-sm">
          <Badge variant="outline" className="rounded-full border border-amber-400/40 text-xs text-amber-300">
            Coming soon
          </Badge>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
              Flight plan
            </p>
            <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">
              Roadmap
            </h1>
            <p className="text-sm text-[color:var(--text-secondary)]">
              Releases ship progressively across quarters. The outline below keeps contributors aligned even while specs are finalised.
            </p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {roadmapPhases.map((phase) => (
            <Card key={phase.title} className="border border-[color:var(--ring)] bg-[color:var(--bg-card)]">
              <CardHeader>
                <CardTitle className="text-base text-[color:var(--text-primary)]">{phase.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-[color:var(--text-secondary)]">
                  {phase.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default Roadmap;

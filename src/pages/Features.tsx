import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const featurePillars = [
  {
    title: "AI guardrails",
    description: "Model-weighted scoring, anomaly detection, and automated review routes.",
    status: "In build",
  },
  {
    title: "Signal marketplaces",
    description: "Let DAOs or desks stake NOP behind the research they want to surface.",
    status: "Designing",
  },
  {
    title: "On-chain tasks",
    description: "Composable missions that blend burn quotas, proof-of-workflows, and team splits.",
    status: "Scoping",
  },
  {
    title: "Contextual wallets",
    description: "Smart account layer that auto-tags risk, reputation, and referral routes.",
    status: "Research",
  },
];

const Features = () => {
  usePageMetadata({
    title: "Features • NOP Intelligence Layer",
    description: "Preview the next capabilities shipping to the NOP Intelligence Layer.",
  });

  return (
    <StaticPageLayout>
        <section className="space-y-8">
          <div className="space-y-5 rounded-3xl border border-[color:var(--ring)] bg-[color:var(--bg-card)] p-8 shadow-sm">
            <Badge variant="outline" className="rounded-full border border-indigo-400/40 text-xs text-indigo-400">
              Roadmap
          </Badge>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
              Product map
            </p>
            <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">
              Features on the runway
            </h1>
            <p className="text-sm text-[color:var(--text-secondary)]">
              These modules are staged for release as soon as the burn mechanics and contributor programs finish audit.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {featurePillars.map((pillar) => (
            <Card key={pillar.title} className="border border-[color:var(--ring)] bg-[color:var(--bg-card)]">
              <CardHeader>
                <CardTitle className="text-lg text-[color:var(--text-primary)]">
                  {pillar.title}
                </CardTitle>
                <CardDescription className="text-xs font-semibold uppercase tracking-wide text-indigo-400">
                  {pillar.status}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[color:var(--text-secondary)]">{pillar.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default Features;

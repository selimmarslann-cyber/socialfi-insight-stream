import { Link } from "react-router-dom";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { Button } from "@/components/ui/button";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import pitchOutlineUrl from "@/../docs/NOP_INTELLIGENCE_LAYER_PITCH_OUTLINE.md?url";

const docsEntries = [
  {
    title: "Whitepaper",
    summary:
      "Executive summary plus architecture of the NOP Intelligence Layer: token, social positions, reputation, and intelligence feed.",
    href: "/whitepaper",
    label: "Protocol",
  },
  {
    title: "Litepaper",
    summary: "3-step walkthrough for partners who want a quick grasp of how trades are logged, scored, and monetized.",
    href: "/litepaper",
    label: "Quick Read",
  },
  {
    title: "Tokenomics",
    summary: "NOP utility, 1% fee split (50/25/25), rewards policy, and sustainability assumptions for listings.",
    href: "/tokenomics",
    label: "Economics",
  },
  {
    title: "Roadmap",
    summary: "Phase 0–4 timeline covering prototype, dashboard, protocol mechanics, fee routing, and governance rollout.",
    href: "/roadmap",
    label: "Milestones",
  },
  {
    title: "Onboarding",
    summary: "Step-by-step guide for new users: connect wallet, claim Boosted Tasks, register positions, and stay safe.",
    href: "/onboarding",
    label: "Users",
  },
  {
    title: "Pitch Outline",
    summary: "10-slide structure for exchange listings and strategic partners covering problem, solution, tokenomics, and ask.",
    href: pitchOutlineUrl,
    label: "Partners",
    external: true,
  },
];

const Docs = () => {
  usePageMetadata({
    title: "Docs Hub • NOP Intelligence Layer",
    description: "Browse the whitepaper, litepaper, tokenomics, roadmap, and onboarding guides inside the app.",
  });

    return (
        <div className="space-y-4">
        <DashboardCard className="space-y-3">
          <DashboardSectionTitle label="Docs • Phase 5" title="NOP Intelligence Layer Library" />
          <p className="text-sm-2 leading-relaxed text-text-secondary">
            Every listing-ready narrative is now available in-app. Select a document to dive into protocol mechanics, economics,
            and the onboarding flow without leaving the dashboard.
          </p>
        </DashboardCard>

      <div className="grid gap-4 md:grid-cols-2">
        {docsEntries.map((doc) => (
            <DashboardCard key={doc.title} className="flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <DashboardSectionTitle label={doc.label} title={doc.title} />
                <p className="text-sm-2 leading-relaxed text-text-secondary">{doc.summary}</p>
            </div>
            <div>
              {doc.external ? (
                  <Button asChild className="w-full md:w-auto" variant="outline">
                  <a href={doc.href} target="_blank" rel="noreferrer">
                    Download
                  </a>
                </Button>
              ) : (
                  <Button asChild className="w-full md:w-auto" variant="accent">
                  <Link to={doc.href}>Open</Link>
                </Button>
              )}
            </div>
          </DashboardCard>
        ))}
      </div>
    </div>
  );
};

export default Docs;

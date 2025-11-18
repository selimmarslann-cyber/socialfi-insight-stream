import { useMemo } from "react";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { Button } from "@/components/ui/button";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { extractSection, toBullets, toOrderedList, toParagraphs } from "@/lib/markdown";
import litepaperMarkdown from "@/../docs/NOP_INTELLIGENCE_LAYER_LITEPAPER.md?raw";
import litepaperDocUrl from "@/../docs/NOP_INTELLIGENCE_LAYER_LITEPAPER.md?url";

const Litepaper = () => {
  usePageMetadata({
    title: "NOP Litepaper",
    description: "Quick overview of the NOP Intelligence Layer for partners and reviewers.",
  });

  const introParagraphs = useMemo(
    () => toParagraphs(extractSection(litepaperMarkdown, "What is NOP Intelligence Layer?")),
    [],
  );
  const steps = useMemo(() => toOrderedList(extractSection(litepaperMarkdown, "How It Works (3 Steps)")), []);
  const tokenRole = useMemo(() => toBullets(extractSection(litepaperMarkdown, "Role of the NOP Token")), []);
  const reputationBullets = useMemo(
    () => toBullets(extractSection(litepaperMarkdown, "Why Social Positions & Reputation Matter")),
    [],
  );
  const diagram = useMemo(
    () => extractSection(litepaperMarkdown, "Simple Diagram").replace(/```/g, "").trim(),
    [],
  );

  return (
    <div className="space-y-5">
      <DashboardCard className="space-y-3">
        <DashboardSectionTitle label="Litepaper" title="What is NOP Intelligence Layer?" />
        <div className="space-y-3 text-sm text-slate-600">
          {introParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard className="space-y-4">
        <DashboardSectionTitle label="Process" title="How it works in 3 steps" />
        <ol className="space-y-3 text-sm text-slate-600">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-500">
                {index + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </DashboardCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard className="space-y-3">
          <DashboardSectionTitle label="Utility" title="Role of the NOP token" />
          <ul className="space-y-3 text-sm text-slate-600">
            {tokenRole.map((bullet) => (
              <li key={bullet} className="flex gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </DashboardCard>
        <DashboardCard className="space-y-3">
          <DashboardSectionTitle label="Trust" title="Why reputation matters" />
          <ul className="space-y-3 text-sm text-slate-600">
            {reputationBullets.map((bullet) => (
              <li key={bullet} className="flex gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-500" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </DashboardCard>
      </div>

      <DashboardCard className="space-y-4">
        <DashboardSectionTitle label="Flow" title="Simple diagram" />
        <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-5 text-xs text-slate-100">{diagram}</pre>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            Need the full markdown? Download the litepaper for sharing with partners or due-diligence teams.
          </p>
          <Button asChild>
            <a href={litepaperDocUrl} target="_blank" rel="noreferrer">
              Download Litepaper
            </a>
          </Button>
        </div>
      </DashboardCard>
    </div>
  );
};

export default Litepaper;

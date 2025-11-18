import { useMemo } from "react";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { Button } from "@/components/ui/button";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { extractSection, extractSubsections, toBullets, toParagraphs } from "@/lib/markdown";
import whitepaperMarkdown from "@/../docs/NOP_INTELLIGENCE_LAYER_WHITEPAPER.md?raw";
import whitepaperDocUrl from "@/../docs/NOP_INTELLIGENCE_LAYER_WHITEPAPER.md?url";

const Whitepaper = () => {
  usePageMetadata({
    title: "NOP Intelligence Layer — Whitepaper",
    description: "Executive summary and architecture of the NOP Intelligence Layer SocialFi protocol.",
  });

  const executiveSummary = useMemo(() => toParagraphs(extractSection(whitepaperMarkdown, "1. Executive Summary")), []);

  const architecture = useMemo(() => {
    const subsections = extractSubsections(extractSection(whitepaperMarkdown, "2. Architecture Overview"));
    return subsections.map((entry) => ({
      title: entry.title,
      paragraphs: toParagraphs(entry.content),
      bullets: toBullets(entry.content),
    }));
  }, []);

  return (
    <div className="space-y-5">
      <DashboardCard className="space-y-4">
        <DashboardSectionTitle label="Whitepaper" title="Executive Summary" />
        <div className="space-y-3 text-sm leading-relaxed text-slate-600">
          {executiveSummary.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard className="space-y-4">
        <DashboardSectionTitle label="Architecture" title="Intelligence Layer Overview" />
        <div className="grid gap-4 lg:grid-cols-2">
          {architecture.map((layer) => (
            <article key={layer.title} className="rounded-2xl border border-slate-100 bg-white/70 p-5">
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900">{layer.title}</h3>
                {layer.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-slate-600">
                    {paragraph}
                  </p>
                ))}
                {layer.bullets.length > 0 ? (
                  <ul className="space-y-2 text-sm text-slate-600">
                    {layer.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <DashboardSectionTitle label="Full Document" title="Download detailed whitepaper" />
          <p className="text-sm text-slate-600">
            Includes protocol mechanics, fee/burn model, security posture, and future work.
          </p>
        </div>
        <Button asChild>
          <a href={whitepaperDocUrl} target="_blank" rel="noreferrer">
            Download Whitepaper (PDF-ready Markdown)
          </a>
        </Button>
      </DashboardCard>
    </div>
  );
};

export default Whitepaper;

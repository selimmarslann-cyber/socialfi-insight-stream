import { useMemo } from "react";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { Button } from "@/components/ui/button";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { extractSection, toBullets, toOrderedList, toParagraphs } from "@/lib/markdown";
import onboardingMarkdown from "@/../docs/NOP_INTELLIGENCE_LAYER_ONBOARDING.md?raw";
import onboardingDocUrl from "@/../docs/NOP_INTELLIGENCE_LAYER_ONBOARDING.md?url";

const parseTip = (content: string) => {
  const match = content.match(/_Tip:(.+)_/i);
  if (!match) {
    return { sanitized: content, tip: "" };
  }
  return {
    sanitized: content.replace(match[0], "").trim(),
    tip: match[1].trim(),
  };
};

const buildSection = (heading: string) => {
  const raw = extractSection(onboardingMarkdown, heading);
  const { sanitized, tip } = parseTip(raw);
  return {
    title: heading.replace(/^\d+\.\s*/, ""),
    paragraphs: toParagraphs(sanitized),
    ordered: toOrderedList(sanitized),
    bullets: toBullets(sanitized),
    tip,
  };
};

const Onboarding = () => {
  usePageMetadata({
    title: "NOP Onboarding",
    description: "Step-by-step guide for connecting a wallet, logging positions, and earning reputation.",
  });

  const connectWallet = useMemo(() => buildSection("1. Connect Your Wallet"), []);
  const boostedTasks = useMemo(() => buildSection("2. Complete Boosted Tasks & Claim NOP"), []);
  const openPosition = useMemo(() => buildSection("3. Open a Social Position"), []);
  const closePosition = useMemo(() => buildSection("4. Close & Track Reputation"), []);
  const exploreFeed = useMemo(() => buildSection("5. Explore Intelligence Feed & Trending Users"), []);
  const safety = useMemo(() => buildSection("6. Safety Best Practices"), []);

  return (
    <div className="space-y-5">
      <DashboardCard className="space-y-3">
        <DashboardSectionTitle label="Onboarding" title="Kickstart your NOP journey" />
        <p className="text-sm text-slate-600">
          Follow the playbook below to connect a wallet, earn NOP via Boosted Tasks, publish social positions, and build an
          Alpha Score that exchanges can trust.
        </p>
      </DashboardCard>

      <DashboardCard className="space-y-4">
        <DashboardSectionTitle label="Step 1" title="Connect your wallet" />
        <ol className="space-y-3 text-sm text-slate-600">
          {connectWallet.ordered.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
              <span>{item}</span>
            </li>
          ))}
        </ol>
        {connectWallet.tip ? <p className="text-xs text-slate-500">Tip: {connectWallet.tip}</p> : null}
      </DashboardCard>

      <DashboardCard className="space-y-4">
        <DashboardSectionTitle label="Step 2" title="Complete Boosted Tasks" />
        <ul className="space-y-3 text-sm text-slate-600">
          {boostedTasks.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </DashboardCard>

      <DashboardCard className="space-y-4">
        <DashboardSectionTitle label="Step 3" title="Open a social position" />
        <ol className="space-y-3 text-sm text-slate-600">
          {openPosition.ordered.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
              <span>{item}</span>
            </li>
          ))}
        </ol>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Include when registering</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {openPosition.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </DashboardCard>

      <DashboardCard className="space-y-4">
        <DashboardSectionTitle label="Step 4" title="Close & grow reputation" />
        <ul className="space-y-3 text-sm text-slate-600">
          {closePosition.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </DashboardCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard className="space-y-3">
          <DashboardSectionTitle label="Step 5" title="Explore intelligence feed" />
          <div className="space-y-3 text-sm text-slate-600">
            {exploreFeed.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <ul className="space-y-2">
              {exploreFeed.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-500" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </DashboardCard>
        <DashboardCard className="space-y-3">
          <DashboardSectionTitle label="Safety" title="Best practices" />
          <ul className="space-y-3 text-sm text-slate-600">
            {safety.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </DashboardCard>
      </div>

      <DashboardCard className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <DashboardSectionTitle label="Full Guide" title="Download onboarding checklist" />
          <p className="text-sm text-slate-600">Share this markdown with new operators, partners, or listing reviewers.</p>
        </div>
        <Button asChild>
          <a href={onboardingDocUrl} target="_blank" rel="noreferrer">
            Download Onboarding Doc
          </a>
        </Button>
      </DashboardCard>
    </div>
  );
};

export default Onboarding;

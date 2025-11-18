import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const roadmapPhases = [
  {
    title: "Phase 0 – Internal Prototype",
    timeframe: "Q1–Q2 2024",
    objectives: ["Validate social position logging", "Reputation heuristics", "AI-powered moderation loops"],
    tech: ["Supabase schema for social_positions", "Basic wallet connect", "CSV-based fee calculator"],
    goToMarket: ["Closed alpha with internal operators", "Weekly signal reviews", "Manual burn tracking"],
  },
  {
    title: "Phase 1 – Clean Dashboard",
    timeframe: "Q3 2024",
    objectives: ["Ship Explore, Wallet, Boosted Tasks, burn transparency"],
    tech: ["React AppShell", "Modular cards", "Token burn + news widgets"],
    goToMarket: ["Soft launch to 200 traders", "Office hours", "Prep exchange diligence"],
  },
  {
    title: "Phase 2 – Protocol Positions & Reputation",
    timeframe: "Q4 2024 – Q1 2025",
    objectives: ["Production social_positions + reputation_scores", "Intelligence-feed API", "Fee modeling"],
    tech: ["Tx-hash registration flow", "Alpha Score recalculations", "Wallet fee summaries"],
    goToMarket: ["Public beta", "Partner dashboards", "Data room for listings"],
  },
  {
    title: "Phase 3 – On-chain Fee Routing & Treasury",
    timeframe: "H1 2025",
    objectives: ["Route 1% fee on-chain", "Automate burns", "Treasury payouts"],
    tech: ["Fee split contracts", "Scheduled burn executor", "Treasury dashboard"],
    goToMarket: ["Campaigns with DEX/CEX partners", "Burn announcements", "Ecosystem grants"],
  },
  {
    title: "Phase 4 – Governance & Multi-chain Expansion",
    timeframe: "H2 2025",
    objectives: ["Activate NOP staking + governance", "Multi-chain adapters", "Protocol-owned liquidity"],
    tech: ["Staking & delegation contracts", "Cross-chain reputation sync", "Liquidity vaults"],
    goToMarket: ["Governance launch", "Portfolio tracker integrations", "Institutional expansion"],
  },
];

const Roadmap = () => {
  usePageMetadata({
    title: "Roadmap • NOP Intelligence Layer",
    description: "Track the milestones and launch windows for the network.",
  });

  return (
    <div className="space-y-5">
      <DashboardCard className="space-y-3">
        <DashboardSectionTitle label="Roadmap" title="Phase-by-phase plan" />
        <p className="text-sm text-slate-600">
          The intelligence layer is staged for exchange readiness: prototype (Phase 0), clean dashboard (Phase 1), protocol
          mechanics (Phase 2), on-chain fee routing (Phase 3), and governance + multi-chain expansion (Phase 4).
        </p>
      </DashboardCard>

      <div className="grid gap-4 xl:grid-cols-2">
        {roadmapPhases.map((phase) => (
          <DashboardCard key={phase.title} className="space-y-3 border border-slate-100">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold text-slate-900">{phase.title}</h3>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{phase.timeframe}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objectives</p>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                  {phase.objectives.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tech milestones</p>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                  {phase.tech.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Go-to-market</p>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                  {phase.goToMarket.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </DashboardCard>
        ))}
      </div>
    </div>
  );
};

export default Roadmap;

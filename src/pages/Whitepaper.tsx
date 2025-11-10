import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const whitepaperSections = [
  {
    title: "1) Introduction",
    body: "Web3 needs an intelligence layer that elevates trusted research above noise. NOP synchronizes AI moderation, market context, and social validation so contributors and analysts can co-create verifiable insight without sacrificing decentralization.",
  },
  {
    title: "2) Architecture",
    body: "Client surfaces include Explore feeds, Wallet dashboards, and Contribute workspaces. The AI Engine runs contribution scoring, anti-spam heuristics, and trend detection. Supabase powers real-time data sync, while the NOP chain stack secures token operations, burn accounting, and settlement.",
  },
  {
    title: "3) SocialFi Reward Model",
    body: "Each submission receives a 1–10 quality rating, governed by AI and human validators. Double-spend and spam attempts are neutralized through pattern detection and rate limits. Rewards are minted proportionally to quality, not volume, keeping incentives aligned with insight density.",
  },
  {
    title: "4) Tokenomics Overview",
    body: "NOP is used to earn for high-value contributions, burn to unlock governance weight, and boost to amplify missions. Earn, burn, and boost mechanics feed back into AI scoring signals, ensuring a self-tuning incentive loop.",
  },
  {
    title: "5) Governance (Future)",
    body: "Upcoming releases introduce community voting on scoring models, creator incentive pools, and treasury allocation. Delegated expertise and quadratic weighting keep decision power in the hands of verified contributors.",
  },
  {
    title: "6) Risk & Compliance",
    body: "Content responsibility is shared. Identity protections coexist with moderation to remove malicious campaigns, wash trading, or market manipulation. Compliance tooling logs every action for auditability without leaking private metadata.",
  },
  {
    title: "7) Roadmap",
    body: "v1 is live with SocialFi scoring and burn transparency. Next milestones: fully on-chain scoring attestations, verified identity primitives, and a DAO-led evolution of incentive algorithms.",
  },
];

const Whitepaper = () => {
  usePageMetadata({
    title: "NOP Intelligence Layer — Whitepaper v1.0",
    description:
      "Dive into the architecture, reward model, and roadmap behind the NOP Intelligence Layer SocialFi protocol.",
  });

  return (
    <StaticPageLayout>
      <section className="space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold text-[#0F172A]">
            NOP Intelligence Layer — Whitepaper v1.0
          </h1>
          <p className="leading-relaxed text-[#475569]">
            A concise overview of how NOP orchestrates AI-assisted contribution scoring,
            token incentives, and governance-ready infrastructure for modern SocialFi.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {whitepaperSections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl bg-white p-6 leading-relaxed text-[#475569] shadow-sm"
            >
              <h2 className="text-lg font-semibold text-[#0F172A]">
                {section.title}
              </h2>
              <p className="mt-3">{section.body}</p>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-[#475569] shadow-sm">
          Download PDF (yakında)
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default Whitepaper;

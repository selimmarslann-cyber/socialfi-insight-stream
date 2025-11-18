import { Link } from "react-router-dom";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const About = () => {
  usePageMetadata({
    title: "About NOP Intelligence Layer",
    description:
      "Discover how the NOP Intelligence Layer fuses AI, SocialFi, and on-chain incentives to reward real contributions.",
  });

  return (
    <StaticPageLayout>
      <section className="space-y-8">
        <header className="space-y-4">
          <h1 className="text-2xl font-semibold text-[#0F172A]">
            About NOP Intelligence Layer
          </h1>
          <p className="max-w-3xl leading-relaxed text-[#475569]">
            NOP Intelligence Layer unites artificial intelligence, SocialFi dynamics,
            and on-chain accountability to reward real signal over noise. We are building
            an adaptive social coordination layer where AI evaluates every contribution,
            the community reaps transparent rewards, and the burn mechanic keeps incentives
            aligned.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0F172A]">Our Ambition</h2>
            <p className="mt-3 leading-relaxed text-[#475569]">
              Build an AI-directed social fabric that values meaningful research,
              insights, and participation. Every action is scored by intelligent systems
              and anchored on-chain so value creation remains transparent, measurable,
              and composable across Web3.
            </p>
          </article>
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0F172A]">Core Capabilities</h2>
            <ul className="mt-3 space-y-2 leading-relaxed text-[#475569]">
              <li>• AI Contribution Scoring for real-time context and quality.</li>
              <li>• Reward Engine powered by the NOP token.</li>
              <li>• On-chain burn pressure to reinforce long-term value.</li>
              <li>• Integrated wallet and boosted task rails.</li>
            </ul>
          </article>
          <article className="rounded-2xl bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="text-lg font-semibold text-[#0F172A]">Design Principles</h2>
            <p className="mt-3 leading-relaxed text-[#475569]">
              We obsess over speed for signal discovery, security for treasury flows,
              and radical transparency for governance and analytics. By merging AI with
              crypto-economic tooling, we give contributors a premium environment that
              rewards depth, accuracy, and collaboration.
            </p>
          </article>
        </div>

        <p className="leading-relaxed text-[#475569]">
          <Link
            to="/whitepaper"
            className="font-semibold text-[#0F172A] transition hover:underline"
          >
            Read the Whitepaper →
          </Link>
        </p>
      </section>
    </StaticPageLayout>
  );
};

export default About;

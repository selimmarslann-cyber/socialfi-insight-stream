import { Link } from "react-router-dom";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const Tokenomics = () => {
  usePageMetadata({
    title: "NOP Tokenomics (Overview)",
    description:
      "Understand how the NOP token powers rewards, boosts, governance, and burn-driven transparency across the intelligence layer.",
  });

  return (
    <StaticPageLayout>
      <section className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold text-[#0F172A]">
            NOP Tokenomics (Overview)
          </h1>
          <p className="leading-relaxed text-[#475569]">
            NOP aligns contributors, curators, and builders with an incentive flywheel
            that rewards verified insight, amplifies missions through boosts, and
            maintains healthy deflation via burn mechanics.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0F172A]">Utility</h2>
            <ul className="mt-3 space-y-2 leading-relaxed text-[#475569]">
              <li>• Reward: Earn NOP proportional to AI-assessed contribution quality.</li>
              <li>• Boost: Spend NOP to highlight missions, talent calls, and research.</li>
              <li>• Governance (Future): Delegate expertise to steer protocol upgrades.</li>
              <li>• Burn: Remove supply to unlock premium access and reputation weight.</li>
            </ul>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0F172A]">Supply</h2>
            <p className="mt-3 leading-relaxed text-[#475569]">
              Total supply, circulating float, and treasury allocations will be detailed
              in an upcoming Tokenomics PDF. Emissions and burn schedules remain
              transparent through on-chain attestations and community reporting.
            </p>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0F172A]">Economics</h2>
            <p className="mt-3 leading-relaxed text-[#475569]">
              Contribution quality scores drive reward multipliers, not raw volume.
              High signal content accrues compounding reputation and token yield,
              while low-quality or adversarial behaviour is dampened by the AI scoring
              engine and burn requirements for repeat offenders.
            </p>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0F172A]">Transparency</h2>
            <p className="mt-3 leading-relaxed text-[#475569]">
              All burn events are tracked in the public widget for verifiable audits.
              Monitor the latest totals on our{" "}
              <Link
                to="/burn"
                className="font-semibold text-[#0F172A] transition hover:underline"
              >
                burn dashboard
              </Link>{" "}
              and follow changelog updates for treasury operations.
            </p>
          </article>
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default Tokenomics;

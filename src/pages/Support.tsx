import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const Support = () => {
  usePageMetadata({
    title: "Help & Support — NOP Intelligence Layer",
    description:
      "Find answers, report issues, and check the system status for the NOP Intelligence Layer.",
  });

  return (
    <StaticPageLayout>
      <section className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold text-[#0F172A]">
            Help & Support
          </h1>
          <p className="leading-relaxed text-[#475569]">
            Need help with the intelligence layer? Reach out using the resources below and we will
            guide you through.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0F172A]">FAQ</h2>
            <p className="mt-3 leading-relaxed text-[#475569]">
              A structured knowledge base covering wallet setup, contribution scoring, and reward
              distribution is coming soon. Stay tuned for the public launch.
            </p>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#0F172A]">Report an Issue</h2>
            <p className="mt-3 leading-relaxed text-[#475569]">
              Encountered a bug or suspected exploit? Send details via email or GitHub Issues.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="mailto:support@nopintelligencelayer.xyz?subject=Issue%20Report"
                className="inline-flex items-center justify-center rounded-full bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Email Support
              </a>
              <a
                href="https://github.com/nopintelligencelayer/issues"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center justify-center rounded-full border border-[#0F172A] px-4 py-2 text-sm font-semibold text-[#0F172A] transition hover:bg-[#0F172A] hover:text-white"
              >
                GitHub Issues
              </a>
            </div>
          </article>
        </div>

        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0F172A]">System Status</h2>
          <p className="mt-3 leading-relaxed text-[#475569]">
            Real-time uptime dashboards are in progress. For now, follow our social channels or
            contact support if you notice downtime.
          </p>
        </article>
      </section>
    </StaticPageLayout>
  );
};

export default Support;

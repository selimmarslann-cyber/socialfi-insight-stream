import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const guidelines = [
  {
    title: "Lead with Respect",
    body: "Collaborate constructively, cite sources, and challenge ideas without attacking people. Healthy discussion keeps the intelligence layer sharp.",
  },
  {
    title: "No Spam or Fraud",
    body: "Avoid repetitive posts, shill campaigns, or deceptive behaviour. AI filters and manual reviewers downgrade or remove low-quality accounts.",
  },
  {
    title: "Disclose AI-Generated Content",
    body: "If a post or analysis is AI-assisted, mark it clearly. Transparency helps the community calibrate trust and feed better training loops.",
  },
  {
    title: "Stay Within the Law",
    body: "Prohibit illegal activity, insider trading, or market manipulation. Follow local regulations when sharing financial opinions.",
  },
  {
    title: "Consequences",
    body: "Violations can result in reduced reward scores, temporary suspensions, forced burns, or permanent removal from the network.",
  },
];

const Guidelines = () => {
  usePageMetadata({
    title: "Community Guidelines — NOP Intelligence Layer",
    description:
      "Review the core conduct principles that keep the NOP Intelligence Layer collaborative, transparent, and compliant.",
  });

  return (
    <StaticPageLayout>
      <section className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold text-[#0F172A]">
            Community Guidelines
          </h1>
          <p className="leading-relaxed text-[#475569]">
            These guidelines protect the integrity of the NOP Intelligence Layer and ensure
            contributors can focus on uncovering real signal together.
          </p>
        </header>

        <div className="space-y-4">
          {guidelines.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl bg-white p-6 leading-relaxed text-[#475569] shadow-sm"
            >
              <h2 className="text-lg font-semibold text-[#0F172A]">{item.title}</h2>
              <p className="mt-3">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default Guidelines;

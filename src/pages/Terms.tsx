import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const termsSections = [
  {
    title: "Accounts & Eligibility",
    body: "You must provide accurate details when creating an account and remain responsible for safeguarding credentials and wallet connections tied to the NOP Intelligence Layer.",
  },
  {
    title: "User Responsibilities",
    body: "You agree not to engage in spam, market manipulation, or illegal activity. Automated posting must respect rate limits, and all contributions should comply with applicable financial and data regulations.",
  },
  {
    title: "Prohibited Conduct",
    body: "Do not impersonate others, attempt to gain unauthorised access, exploit vulnerabilities, or distribute malicious software. Violations may lead to suspension, burn penalties, or permanent bans.",
  },
  {
    title: "Content License & Moderation",
    body: "By publishing content you grant NOP a non-exclusive, worldwide licence to host, display, and promote it. We reserve the right to remove content that violates policy or law.",
  },
  {
    title: "Disclaimer",
    body: "Services are provided 'as is' without warranties of uninterrupted availability. We are not liable for losses deriving from market volatility or third-party integrations.",
  },
  {
    title: "Governing Law & Disputes",
    body: "Unless stated otherwise, the agreement is governed by English law and disputes are resolved through arbitration located in a mutually agreed jurisdiction.",
  },
  {
    title: "Changes to These Terms",
    body: "We may update this policy to reflect new features or regulations. Continued use of the platform after an update constitutes acceptance of the revised terms.",
  },
];

const Terms = () => {
  usePageMetadata({
    title: "Terms of Service — NOP Intelligence Layer",
    description:
      "Review the terms that govern account use, prohibited activity, content rights, and dispute resolution on the NOP Intelligence Layer.",
  });

  return (
    <StaticPageLayout>
      <section className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold text-[#0F172A]">
            Terms of Service (Template)
          </h1>
          <p className="leading-relaxed text-[#475569]">
            These terms define how you can access the NOP Intelligence Layer and the expectations
            for community participation. Please review them before contributing or connecting a wallet.
          </p>
        </header>

        <div className="space-y-4">
          {termsSections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl bg-white p-6 leading-relaxed text-[#475569] shadow-sm"
            >
              <h2 className="text-lg font-semibold text-[#0F172A]">{section.title}</h2>
              <p className="mt-3">{section.body}</p>
            </article>
          ))}
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default Terms;

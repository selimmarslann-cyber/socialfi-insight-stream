import { Link } from "react-router-dom";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const privacyItems = [
  {
    title: "Data We Process",
    body: "We collect email addresses, wallet identifiers, and contribution metadata solely to operate the intelligence layer, deliver rewards, and maintain account security.",
  },
  {
    title: "Why We Use Your Data",
    body: "Personal data enables login, contribution attribution, reward distribution, and critical updates about protocol changes or incidents.",
  },
  {
    title: "Cookies & Local Storage",
    body: "We rely on essential cookies for session continuity, functional cookies to remember preferences, and optional analytics cookies to improve performance.",
  },
  {
    title: "Third-Party Services",
    body: "Supabase powers our database and authentication. Privacy-preserving analytics tools may capture anonymized usage patterns. No commercial resale of data occurs.",
  },
  {
    title: "Retention",
    body: "Account metadata is stored while your profile remains active. Contribution records tied to on-chain events may persist for audit and compliance objectives.",
  },
  {
    title: "Your Rights",
    body: "You can request access, correction, deletion, or portability of personal data. Reach out through the contact page to initiate a GDPR/KVKK request.",
  },
];

const Privacy = () => {
  usePageMetadata({
    title: "Privacy Policy — NOP Intelligence Layer",
    description:
      "Learn how NOP Intelligence Layer handles personal data, cookies, third-party services, and your privacy rights.",
  });

  return (
    <StaticPageLayout>
      <section className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold text-[#0F172A]">
            Privacy Policy (Template)
          </h1>
          <p className="leading-relaxed text-[#475569]">
            This policy outlines how we manage personal data across the NOP Intelligence Layer.
            We prioritise confidentiality, transparency, and control for every contributor and
            community member.
          </p>
        </header>

        <div className="space-y-4">
          {privacyItems.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl bg-white p-6 leading-relaxed text-[#475569] shadow-sm"
            >
              <h2 className="text-lg font-semibold text-[#0F172A]">{item.title}</h2>
              <p className="mt-3">{item.body}</p>
            </article>
          ))}
        </div>

          <article className="rounded-2xl bg-white p-6 leading-relaxed text-[#475569] shadow-sm">
          <h2 className="text-lg font-semibold text-[#0F172A]">Contact</h2>
          <p className="mt-3">
              For privacy enquiries or to exercise your rights, contact us via{" "}
              <Link
                to="/contact"
                className="font-semibold text-[#0F172A] transition hover:underline"
              >
                /contact
              </Link>
            . Requests are handled in accordance with applicable GDPR and KVKK principles.
          </p>
        </article>

        <p className="text-sm text-slate-500">
          Bu içerik hukuki tavsiye değildir. Lütfen bağımsız uzman görüşü alınız.
        </p>
      </section>
    </StaticPageLayout>
  );
};

export default Privacy;

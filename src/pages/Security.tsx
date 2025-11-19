import { Link } from "react-router-dom";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const Security = () => {
  usePageMetadata({
    title: "Data & Security — NOP Intelligence Layer",
    description:
      "Understand how NOP Intelligence Layer secures infrastructure, applies Supabase RLS, and handles vulnerability disclosures.",
  });

  return (
    <StaticPageLayout>
      <section className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold text-[#0F172A]">Data & Security</h1>
          <p className="leading-relaxed text-[#475569]">
            Security is woven into our product and operations. Below is a snapshot of the safeguards
            protecting contributors, treasury flows, and AI infrastructure.
          </p>
        </header>

          <article className="rounded-2xl border border-border bg-card p-6 leading-relaxed text-text-secondary shadow-card-soft">
            <h2 className="text-lg font-semibold text-text-primary">Operational Practices</h2>
          <ul className="mt-3 space-y-2">
            <li>• End-to-end HTTPS across apps, APIs, and admin tooling.</li>
            <li>• Auth tokens scoped with JWT, rotated automatically on session refresh.</li>
            <li>• Principle of least privilege for infrastructure access and feature toggles.</li>
            <li>• Continuous monitoring over deployment pipelines and model endpoints.</li>
          </ul>
        </article>

          <article className="rounded-2xl border border-border bg-card p-6 leading-relaxed text-text-secondary shadow-card-soft">
            <h2 className="text-lg font-semibold text-text-primary">Supabase RLS Summary</h2>
          <p className="mt-3">
            Row Level Security (RLS) policies gate every table. Contributors only read and write
            records they own, while admin-only dashboards rely on explicit policy checks. Contact
            form submissions and burn widgets enforce separate policies to avoid privilege overlap.
          </p>
        </article>

          <article className="rounded-2xl border border-border bg-card p-6 leading-relaxed text-text-secondary shadow-card-soft">
            <h2 className="text-lg font-semibold text-text-primary">Vulnerability Disclosure</h2>
          <p className="mt-3">
            Found a security concern? Reach us through{" "}
            <a
              href="mailto:security@nopintelligencelayer.xyz"
              className="font-semibold text-[#0F172A] transition hover:underline"
            >
              security@nopintelligencelayer.xyz
            </a>{" "}
            or open a ticket via{" "}
            <Link
              to="/support"
              className="font-semibold text-[#0F172A] transition hover:underline"
            >
              /support
            </Link>
            . We respond rapidly and credit contributors for responsible disclosure.
          </p>
        </article>
      </section>
    </StaticPageLayout>
  );
};

export default Security;

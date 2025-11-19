import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const cookieTypes = [
  {
    title: "Necessary Cookies",
    description:
      "Required for authentication, security, and keeping you logged in between sessions. These cannot be disabled without impacting core functionality.",
  },
  {
    title: "Performance Cookies",
    description:
      "Capture aggregated metrics on load times, API errors, and UI responsiveness so we can deliver a smoother experience.",
  },
  {
    title: "Functional Cookies",
    description:
      "Remember preferences like language, theme, and saved filters to personalise the interface.",
  },
  {
    title: "Analytics & Research",
    description:
      "Optional cookies that help analyse contribution flows, discovery funnels, and campaign effectiveness. Data is anonymised wherever possible.",
  },
];

const Cookies = () => {
  usePageMetadata({
    title: "Cookie Policy — NOP Intelligence Layer",
    description:
      "Understand how NOP Intelligence Layer uses cookies across authentication, performance, and analytics.",
  });

  return (
    <StaticPageLayout>
        <section className="space-y-8">
          <header className="space-y-3">
            <h1 className="text-2xl font-semibold text-text-primary">
              Cookie Policy (Template)
            </h1>
            <p className="leading-relaxed text-text-secondary">
            Cookies help us maintain secure sessions, deliver premium experiences, and learn how the
            community interacts with the intelligence layer. Below is an overview of the categories we use.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {cookieTypes.map((item) => (
            <article
              key={item.title}
                className="rounded-2xl border border-border-subtle bg-surface p-6 leading-relaxed text-text-secondary shadow-card-soft"
            >
                <h2 className="text-lg font-semibold text-text-primary">{item.title}</h2>
              <p className="mt-3">{item.description}</p>
            </article>
          ))}
        </div>

          <article className="rounded-2xl border border-border-subtle bg-surface p-6 leading-relaxed text-text-secondary shadow-card-soft">
            <h2 className="text-lg font-semibold text-text-primary">Managing Cookies</h2>
          <p className="mt-3">
            Most browsers let you disable or delete cookies via settings. You can also reset
            local storage from within the NOP interface. Note that turning off essential cookies
            will prevent login sessions from persisting.
          </p>
        </article>

          <article className="rounded-2xl border border-border-subtle bg-surface p-6 leading-relaxed text-text-secondary shadow-card-soft">
            <h2 className="text-lg font-semibold text-text-primary">Third-Party Cookies</h2>
          <p className="mt-3">
            Integrations such as Supabase and analytics providers may set their own cookies in
            accordance with their policies. We vet partners for privacy alignment and minimise
            shared identifiers.
          </p>
        </article>
      </section>
    </StaticPageLayout>
  );
};

export default Cookies;

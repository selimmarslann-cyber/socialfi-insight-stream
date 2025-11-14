import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { Badge } from "@/components/ui/badge";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const LegalCookies = () => {
  usePageMetadata({
    title: "Cookie Policy • NOP Intelligence Layer",
    description: "Cookie controls will be configurable inside the app settings soon.",
  });

  return (
    <StaticPageLayout>
      <section className="space-y-6 rounded-3xl border border-[color:var(--ring)] bg-[color:var(--bg-card)] p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="rounded-full border border-[color:var(--ring)] px-3 text-xs">
            Coming soon
          </Badge>
          <p className="text-xs text-[color:var(--text-secondary)]">Consent tooling underway</p>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">
            Cookie policy
          </h1>
          <p className="text-sm text-[color:var(--text-secondary)]">
            Until analytics launch, no non-essential cookies are stored. Once we flip the switch, you will see granular toggles
            plus region-specific banners powered by this page.
          </p>
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default LegalCookies;

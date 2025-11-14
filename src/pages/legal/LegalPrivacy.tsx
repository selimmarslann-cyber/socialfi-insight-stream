import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { Badge } from "@/components/ui/badge";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const LegalPrivacy = () => {
  usePageMetadata({
    title: "Privacy Policy • NOP Intelligence Layer",
    description: "Formal privacy policy ships alongside the public beta.",
  });

  return (
    <StaticPageLayout>
      <section className="space-y-6 rounded-3xl border border-[color:var(--ring)] bg-[color:var(--bg-card)] p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="rounded-full border border-[color:var(--ring)] px-3 text-xs">
            Coming soon
          </Badge>
          <p className="text-xs text-[color:var(--text-secondary)]">Draft in legal review</p>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">
            Privacy policy
          </h1>
          <p className="text-sm text-[color:var(--text-secondary)]">
            Our formal privacy policy will publish after the compliance team finalises the multi-region data flow audit.
            Until then, no third-party trackers run, and every request is proxied through the same secure gateway.
          </p>
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default LegalPrivacy;

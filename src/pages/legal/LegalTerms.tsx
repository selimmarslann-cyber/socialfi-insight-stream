import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { Badge } from "@/components/ui/badge";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const LegalTerms = () => {
  usePageMetadata({
    title: "Terms of Service • NOP Intelligence Layer",
    description: "Terms are being reviewed with counsel before the public release.",
  });

  return (
    <StaticPageLayout>
      <section className="space-y-6 rounded-3xl border border-[color:var(--ring)] bg-[color:var(--bg-card)] p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="rounded-full border border-[color:var(--ring)] px-3 text-xs">
            Coming soon
          </Badge>
          <p className="text-xs text-[color:var(--text-secondary)]">Awaiting legal sign-off</p>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">
            Terms of service
          </h1>
          <p className="text-sm text-[color:var(--text-secondary)]">
            The definitive user agreement, arbitration rules, and burn disclosures will be posted here. They will reference the
            same tokenomics deck you see in the app but in legally enforceable language.
          </p>
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default LegalTerms;

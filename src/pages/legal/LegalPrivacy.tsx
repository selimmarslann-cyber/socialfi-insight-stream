import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import ComingSoonCard from "@/components/ComingSoonCard";

const LegalPrivacy = () => {
  usePageMetadata({
    title: "Privacy Policy • NOP Intelligence Layer",
    description: "Formal privacy policy ships alongside the public beta.",
  });

  return (
    <StaticPageLayout>
      <ComingSoonCard
        title="Privacy policy in legal review"
        description="Our compliance team is finalising the multi-region data flow audit. Once complete, the full privacy policy—covering Supabase storage, news ingestion, and wallet telemetry—will be published here."
      />
    </StaticPageLayout>
  );
};

export default LegalPrivacy;

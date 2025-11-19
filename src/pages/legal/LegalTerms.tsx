import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import ComingSoonCard from "@/components/ComingSoonCard";

const LegalTerms = () => {
  usePageMetadata({
    title: "Terms of Service • NOP Intelligence Layer",
    description: "Terms are being reviewed with counsel before the public release.",
  });

  return (
    <StaticPageLayout>
      <ComingSoonCard
        title="Terms of service under legal review"
        description="Our counsel is aligning the protocol rules, burn disclosures, and arbitration language with the broader Web3 compliance stack. Expect a full update before the next public release."
      />
    </StaticPageLayout>
  );
};

export default LegalTerms;

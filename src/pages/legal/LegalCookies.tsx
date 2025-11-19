import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import ComingSoonCard from "@/components/ComingSoonCard";

const LegalCookies = () => {
  usePageMetadata({
    title: "Cookie Policy • NOP Intelligence Layer",
    description: "Cookie controls will be configurable inside the app settings soon.",
  });

  return (
    <StaticPageLayout>
      <ComingSoonCard
        title="Cookie & consent center"
        description="Analytics and consent tooling launch with the next release. Until then we don't store non-essential cookies, and every request flows through the same secure proxy."
      />
    </StaticPageLayout>
  );
};

export default LegalCookies;

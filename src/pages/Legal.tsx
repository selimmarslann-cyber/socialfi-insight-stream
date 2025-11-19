import { Link } from "react-router-dom";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Shield, Cookie, Lock, FileCheck, HelpCircle } from "lucide-react";

const legalSections = [
  {
    title: "Privacy Policy",
    description: "How we handle your personal data and privacy rights",
    icon: Shield,
    to: "/legal/privacy",
  },
  {
    title: "Terms of Service",
    description: "Terms governing account use and community participation",
    icon: FileText,
    to: "/legal/terms",
  },
  {
    title: "Cookie Policy",
    description: "How we use cookies and tracking technologies",
    icon: Cookie,
    to: "/legal/cookies",
  },
  {
    title: "Security",
    description: "Our security practices and data protection measures",
    icon: Lock,
    to: "/security",
  },
  {
    title: "Community Guidelines",
    description: "Rules and expectations for community participation",
    icon: FileCheck,
    to: "/guidelines",
  },
  {
    title: "Support & Contact",
    description: "Get help or contact our team",
    icon: HelpCircle,
    to: "/contact",
  },
];

const Legal = () => {
  usePageMetadata({
    title: "Legal & Support — NOP Intelligence Layer",
    description: "Legal documents, policies, and support resources for NOP Intelligence Layer",
  });

  return (
    <StaticPageLayout>
      <section className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold text-text-primary">Legal & Support</h1>
          <p className="leading-relaxed text-text-secondary">
            All legal documents, policies, and support resources in one place.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {legalSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.title}
                className="group cursor-pointer border-border-subtle bg-surface p-6 transition-all duration-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 dark:hover:border-cyan-700"
              >
                <Link to={section.to} className="block space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-100 p-2 dark:bg-cyan-950/40">
                      <Icon className="h-5 w-5 text-indigo-600 dark:text-cyan-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-text-primary group-hover:text-indigo-600 dark:group-hover:text-cyan-400">
                      {section.title}
                    </h2>
                  </div>
                  <p className="text-sm text-text-secondary">{section.description}</p>
                  <Button variant="ghost" size="sm" className="w-full">
                    Read More →
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default Legal;


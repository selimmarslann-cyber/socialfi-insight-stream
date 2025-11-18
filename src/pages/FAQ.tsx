import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const faqs = [
  {
    question: "How do I earn NOP?",
    answer: "Publish high-signal insights, complete boosted tasks, and participate in governance burns. Rewards unlock automatically once we enable the staking vault.",
  },
  {
    question: "Is the burn mechanic live?",
    answer: "The on-chain burn contract is staged but gated. Early pilots run weekly so we can balance emission versus sink.",
  },
  {
    question: "Can I integrate my community?",
    answer: "Yes. Community admin tools open soon with custom feeds, moderation layers, and referral incentives.",
  },
  {
    question: "Where do submissions go?",
    answer: "Every insight is queued inside the AI moderation pipeline. Nothing is published to main feed without automated checks.",
  },
];

const FAQ = () => {
  usePageMetadata({
    title: "FAQ • NOP Intelligence Layer",
    description: "Answers to the most common launch questions.",
  });

  return (
    <StaticPageLayout>
        <section className="space-y-8">
          <div className="space-y-4 rounded-3xl border border-[color:var(--ring)] bg-[color:var(--bg-card)] p-8 shadow-sm">
            <Badge variant="outline" className="rounded-full border border-sky-400/40 text-xs text-sky-300">
              Living draft
          </Badge>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
              Knowledge base
            </p>
            <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">Frequently asked</h1>
            <p className="text-sm text-[color:var(--text-secondary)]">
              We are documenting everything as the network opens. For now, these notes outline what to expect.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((item) => (
            <Card key={item.question} className="border border-[color:var(--ring)] bg-[color:var(--bg-card)]">
              <CardHeader>
                <CardTitle className="text-base text-[color:var(--text-primary)]">
                  {item.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[color:var(--text-secondary)]">{item.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default FAQ;

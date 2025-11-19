import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageMetadata } from "@/hooks/usePageMetadata";

const communityTracks = [
  {
    title: "Research circles",
    description: "Curated Discord sections for traders, airdrop hunters, and on-chain sleuths.",
  },
  {
    title: "Local chapters",
    description: "Host IRL or virtual meetups, share proof-of-event burns, and unlock merch drops.",
  },
  {
    title: "Council briefings",
    description: "Monthly sync with the core team to influence roadmap priorities.",
  },
];

const Community = () => {
  usePageMetadata({
    title: "Community • NOP Intelligence Layer",
    description: "Upcoming spaces for contributors and partners.",
  });

  return (
    <StaticPageLayout>
        <section className="space-y-8">
          <div className="space-y-4 rounded-3xl border border-[color:var(--ring)] bg-[color:var(--bg-card)] p-8 shadow-sm">
            <Badge variant="outline" className="rounded-full border border-purple-400/40 text-xs text-purple-300">
              Phased rollout
          </Badge>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
              Community layer
            </p>
            <h1 className="text-3xl font-semibold text-[color:var(--text-primary)]">Join the network</h1>
            <p className="text-sm text-[color:var(--text-secondary)]">
              Channels are opening progressively to prevent noise. Tell us how you want to collaborate once this page goes live.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {communityTracks.map((track) => (
            <Card key={track.title} className="border border-[color:var(--ring)] bg-[color:var(--bg-card)]">
              <CardHeader>
                <CardTitle className="text-base text-[color:var(--text-primary)]">{track.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[color:var(--text-secondary)]">{track.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </StaticPageLayout>
  );
};

export default Community;

import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ComingSoonCardProps = {
  title: string;
  description: string;
  className?: string;
};

export const ComingSoonCard = ({ title, description, className }: ComingSoonCardProps) => (
  <div className={cn("rounded-2xl border border-border bg-card p-6 shadow-card-soft", className)}>
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-base font-semibold text-text-primary">{title}</p>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
      <Badge variant="outline" className="rounded-full text-xs">
        Coming soon
      </Badge>
    </div>
  </div>
);

export default ComingSoonCard;

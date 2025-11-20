/**
 * Badge Card Component
 * Displays a single badge with rarity styling
 */

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Badge as BadgeType } from "@/lib/badges";
import { cn } from "@/lib/utils";
import { Award, Sparkles, Star, Crown } from "lucide-react";

const RARITY_CONFIG = {
  common: {
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-300 dark:border-slate-700",
    text: "text-slate-700 dark:text-slate-300",
    icon: Award,
    iconColor: "text-slate-500",
  },
  rare: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-300 dark:border-blue-700",
    text: "text-blue-700 dark:text-blue-300",
    icon: Sparkles,
    iconColor: "text-blue-500",
  },
  epic: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    border: "border-purple-300 dark:border-purple-700",
    text: "text-purple-700 dark:text-purple-300",
    icon: Star,
    iconColor: "text-purple-500",
  },
  legendary: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-300 dark:border-amber-700",
    text: "text-amber-700 dark:text-amber-300",
    icon: Crown,
    iconColor: "text-amber-500",
  },
};

type BadgeCardProps = {
  badge: BadgeType;
  earnedAt?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function BadgeCard({ badge, earnedAt, className, size = "md" }: BadgeCardProps) {
  const config = RARITY_CONFIG[badge.rarity];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "p-2 text-xs",
    md: "p-4 text-sm",
    lg: "p-6 text-base",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={cn(
              "group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg",
              config.bg,
              config.border,
              "border-2",
              sizeClasses[size],
              className
            )}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className={cn("rounded-full p-2", config.bg, config.border, "border")}>
                <Icon className={cn("h-6 w-6", config.iconColor)} />
              </div>
              <div>
                <p className={cn("font-semibold", config.text)}>{badge.name}</p>
                {earnedAt && (
                  <p className="text-xs text-muted-foreground">
                    Earned {new Date(earnedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{badge.name}</p>
            {badge.description && <p className="text-sm text-muted-foreground">{badge.description}</p>}
            <Badge variant="outline" className="mt-2">
              {badge.rarity}
            </Badge>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}


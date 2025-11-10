"use client";

import BoostedTasks from "@/components/BoostedTasks";

export interface BoostEventCardProps {
  className?: string;
}

export const BoostEventCard = ({ className }: BoostEventCardProps) => {
  return (
    <div className={className}>
      <BoostedTasks />
    </div>
  );
};

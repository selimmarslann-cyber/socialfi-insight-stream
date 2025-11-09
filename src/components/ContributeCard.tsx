import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { Contribute } from "@/lib/types";

type ContributeCardProps = {
  item: Contribute;
};

export const ContributeCard = ({ item }: ContributeCardProps) => {
  const poolActive = item.poolEnabled === true && item.contractPostId !== null;

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-3">
        <h3 className="text-xl font-semibold">{item.title}</h3>
        {/* Keep contribution layout minimal while highlighting pool actions. */}
        {poolActive && (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link to={`/pool/${item.contractPostId}/chart`}>Chart</Link>
            </Button>
            <Button asChild variant="default">
              <Link to={`/pool/${item.contractPostId}/buy`}>Buy</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { depositToContribute, withdrawFromContribute, getUserPosition } from "@/lib/pool";
import { formatUnits } from "ethers";
import type { Contribute } from "@/lib/types";

type ContributeCardProps = {
  item: Contribute;
};

function ContributeCard({ item }: ContributeCardProps) {
  const [amount, setAmount] = useState(100);
  const [txState, setTxState] = useState<null | "buy" | "sell">(null);
  const [positionWei, setPositionWei] = useState("0");

  const refreshPosition = async () => {
    try {
      if (!window.ethereum) return;
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const address = accounts[0];
      const pos = await getUserPosition(address, item.contractPostId);
      setPositionWei(pos.toString());
    } catch {}
  };

  const handleTransaction = async (mode: "buy" | "sell") => {
    try {
      setTxState(mode);
      if (mode === "buy") {
        await depositToContribute(item.contractPostId, amount);
      } else {
        await withdrawFromContribute(item.contractPostId, amount);
      }
      await refreshPosition();
    } catch (err) {
      console.error(err);
    } finally {
      setTxState(null);
    }
  };

  useEffect(() => {
    refreshPosition();
  }, []);

  return (
    <Card className="p-4">
      <h3 className="font-semibold">{item.title}</h3>

      <div className="mt-3 flex gap-3">
        <Button onClick={() => handleTransaction("buy")} disabled={txState !== null}>
          {txState === "buy" ? "Processing…" : "Buy / Deposit"}
        </Button>

        <Button variant="outline" onClick={() => handleTransaction("sell")} disabled={txState !== null}>
          {txState === "sell" ? "Processing…" : "Sell / Withdraw"}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mt-3">
        Your on-chain position: {formatUnits(positionWei, 18)} NOP
      </p>
    </Card>
  );
}

export default ContributeCard;
export { ContributeCard };

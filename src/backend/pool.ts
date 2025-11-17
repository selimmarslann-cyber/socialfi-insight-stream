import { apiClient } from "@/lib/axios";
import { fetchContribute } from "@/lib/contributes";

type BuyPayload = {
  shares: string;
  maxCost: string;
};

type SellPayload = {
  shares: string;
  minPayout: string;
};

type StatusError = Error & { status?: number };

const ensurePoolEnabled = async (contributeId: string) => {
  // Simple guard to mirror backend 403 expectation.
  const contribute = await fetchContribute(contributeId);
  if (contribute.poolEnabled !== true) {
    const error: StatusError = new Error("Pool disabled");
    error.status = 403;
    throw error;
  }
  return contribute;
};

export const postPoolBuy = async (contributeId: string, payload: BuyPayload) => {
  await ensurePoolEnabled(contributeId);
  return apiClient.post(`/pool/${contributeId}/buy`, payload);
};

export const postPoolSell = async (contributeId: string, payload: SellPayload) => {
  await ensurePoolEnabled(contributeId);
  return apiClient.post(`/pool/${contributeId}/sell`, payload);
};

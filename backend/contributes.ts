import { apiClient } from "@/lib/axios";
import type { Contribute } from "@/lib/types";
import { mapContribute } from "@/lib/contributes";

type PoolToggleResponse = {
  poolEnabled: boolean;
  contractPostId?: number | null;
};

export const fetchAdminContribute = async (id: string): Promise<Contribute> => {
  const { data } = await apiClient.get(`/admin/contributes/${id}`);
  // Ensure admin view shares same defaults as public fetch.
  return mapContribute(data);
};

export const toggleContributePool = async (id: string, poolEnabled: boolean) => {
  const { data } = await apiClient.post<PoolToggleResponse>(`/admin/contribute/${id}/pool`, { poolEnabled });
  return data;
};

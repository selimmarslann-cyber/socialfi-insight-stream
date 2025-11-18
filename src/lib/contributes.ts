import { apiClient } from "@/lib/axios";
import type { Contribute } from "./types";

type RawContribute = Partial<Contribute> & {
  id: string;
  title: string;
};

const withPoolDefaults = (contribute: RawContribute): Contribute => {
  // Guard defaults to keep pool state predictable.
  return {
    ...contribute,
    poolEnabled: contribute.poolEnabled ?? false,
    contractPostId: contribute.contractPostId ?? null,
  };
};

export const mapContribute = (contribute: RawContribute): Contribute => withPoolDefaults(contribute);

export const mapContributeList = (items: RawContribute[]): Contribute[] => items.map(withPoolDefaults);

export const fetchContribute = async (id: string): Promise<Contribute> => {
  const { data } = await apiClient.get<RawContribute>(`/contributes/${id}`);
  return withPoolDefaults(data);
};

export const fetchContributes = async (): Promise<Contribute[]> => {
  const { data } = await apiClient.get<RawContribute[]>("/contributes");
  return mapContributeList(data);
};

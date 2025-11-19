import { useQuery } from "@tanstack/react-query";
import { useWalletStore } from "@/lib/store";
import { getOrCreateCurrentProfile, type Profile } from "@/lib/profile";

export const useCurrentProfile = () => {
  const wallet = useWalletStore((state) => state.address);
  const query = useQuery<Profile>({
    queryKey: ["current-profile", wallet ?? "anon"],
    queryFn: () => getOrCreateCurrentProfile(),
    enabled: Boolean(wallet),
    staleTime: 60 * 1000,
  });
  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
    error: query.error,
  };
};

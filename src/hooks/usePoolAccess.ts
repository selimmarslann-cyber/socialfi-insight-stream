import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchContribute } from "@/lib/contributes";
import { getPostState } from "@/lib/pool";

export const usePoolAccess = (postId?: string) => {
  const navigate = useNavigate();
  const redirectedRef = useRef(false);

  const contributeQuery = useQuery({
    queryKey: ["contribute", postId],
    queryFn: async () => {
      if (!postId) throw new Error("Missing pool id");
      return fetchContribute(postId);
    },
    enabled: Boolean(postId),
  });

  const postStateQuery = useQuery({
    queryKey: ["pool-state", postId],
    queryFn: async () => {
      if (!postId) throw new Error("Missing pool id");
      return getPostState(postId);
    },
    enabled: Boolean(postId),
  });

  useEffect(() => {
    if (redirectedRef.current) return;
    const contribute = contributeQuery.data;
    if (contribute && (contribute.poolEnabled !== true || contribute.contractPostId == null)) {
      redirectedRef.current = true;
      toast.error("Pool devre dışı.");
      navigate("/");
    }
  }, [contributeQuery.data, navigate]);

  useEffect(() => {
    if (redirectedRef.current) return;
    const state = postStateQuery.data;
    if (state && state.active !== true) {
      redirectedRef.current = true;
      toast.error("Pool aktif değil.");
      navigate("/");
    }
  }, [postStateQuery.data, navigate]);

  return {
    contribute: contributeQuery.data,
    contributeLoading: contributeQuery.isLoading,
    postState: postStateQuery.data,
    postStateLoading: postStateQuery.isLoading,
    refetchPostState: postStateQuery.refetch,
  };
};

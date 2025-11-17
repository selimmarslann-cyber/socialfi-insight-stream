import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { fetchPostComments, createPostComment } from "@/lib/feed-service";
import type { PostComment } from "@/types/feed";
import { toast } from "sonner";

interface PostCommentsProps {
  postId: string;
  open: boolean;
  onSyncCount?: (count: number) => void;
  onIncrement?: () => void;
}

const initials = (value: string) =>
  value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const PostComments = ({
  postId,
  open,
  onSyncCount,
  onIncrement,
}: PostCommentsProps) => {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchPostComments(postId);
      setComments(rows);
      onSyncCount?.(rows.length);
      setLoaded(true);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
        : "Yorumlar yuklenemedi. Lutfen tekrar deneyin.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [postId, onSyncCount]);

  useEffect(() => {
    if (open && !loaded && !loading) {
      void loadComments();
    }
  }, [open, loaded, loading, loadComments]);

  const handleSubmit = async () => {
    const value = input.trim();
    if (!value) {
      return;
    }
    try {
      setSubmitting(true);
      const comment = await createPostComment(postId, value);
      setComments((prev) => [...prev, comment]);
      setInput("");
      onIncrement?.();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
        : "Yorum eklenemedi. Lutfen tekrar deneyin.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const placeholderText = useMemo(
      () =>
        !loading && comments.length === 0
          ? "Henuz yorum yok. Ilk yorumu sen birak."
          : null,
    [loading, comments.length],
  );

  if (!open) {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-indigo-50 bg-indigo-50/70 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
        Comments
      </div>
      <div className="mt-3 space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-indigo-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading comments…
          </div>
        ) : placeholderText ? (
          <p className="text-xs text-slate-500">{placeholderText}</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex items-start gap-3 rounded-2xl bg-white/80 p-3 text-sm text-slate-700"
            >
              <Avatar className="h-8 w-8 border border-indigo-100">
                {comment.author.avatar ? (
                  <AvatarImage src={comment.author.avatar} alt={comment.author.displayName} />
                ) : null}
                <AvatarFallback className="bg-indigo-100 text-xs font-semibold text-indigo-600">
                  {initials(comment.author.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-indigo-500">
                  <span className="font-semibold">{comment.author.displayName}</span>
                  <span className="text-[10px] uppercase text-slate-400">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700">{comment.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 space-y-2">
          <Textarea
            value={input}
            placeholder="Add your take..."
          onChange={(event) => setInput(event.target.value)}
          className="min-h-[80px] resize-none rounded-2xl border border-indigo-100 bg-white/90 text-sm text-slate-700 focus-visible:ring-indigo-200"
        />
        <div className="flex justify-end">
            <Button
              size="sm"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-500 text-xs font-semibold text-white hover:bg-indigo-600"
              onClick={handleSubmit}
              disabled={submitting || input.trim().length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <SendHorizontal className="h-4 w-4" />
                  Post
                </>
              )}
            </Button>
        </div>
      </div>
    </div>
  );
};

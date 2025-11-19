import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Sparkles, Upload, Image as ImageIcon, TrendingUp, FileText, Zap, Search, Loader2 } from "lucide-react";
import { useWalletStore } from "@/lib/store";
import { apiClient } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { uploadPostImage, isSupabaseConfigured } from "@/lib/upload";

type CreateContributeDialogProps = {
  onSuccess?: () => void;
};

type ContributeFormData = {
  title: string;
  subtitle?: string;
  description: string;
  tags: string[];
  category?: string;
};

const CONTRIBUTE_CATEGORIES = [
  { value: "trading", label: "Trading Idea", icon: TrendingUp },
  { value: "research", label: "Research", icon: FileText },
  { value: "signal", label: "Signal", icon: Zap },
  { value: "analysis", label: "Analysis", icon: Search },
] as const;

export function CreateContributeDialog({ onSuccess }: CreateContributeDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ContributeFormData>({
    title: "",
    subtitle: "",
    description: "",
    tags: [],
    category: "trading",
  });
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const { connected, address } = useWalletStore();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: ContributeFormData) => {
      if (!address) throw new Error("Wallet not connected");
      
      // Upload cover image if exists
      let coverImageUrl: string | undefined = undefined;
      if (coverImage) {
        try {
          const supabaseReady = isSupabaseConfigured();
          if (supabaseReady) {
            coverImageUrl = await uploadPostImage(coverImage, address);
          } else {
            // Fallback: convert to data URL
            const reader = new FileReader();
            coverImageUrl = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(coverImage);
            });
          }
        } catch (error) {
          console.warn("[CreateContribute] Failed to upload cover image", error);
          toast.error("Failed to upload cover image. Creating without image...");
          // Continue without image
        }
      }
      
      const response = await apiClient.post("/contributes", {
        title: data.title,
        subtitle: data.subtitle || undefined,
        description: data.description,
        tags: data.tags,
        category: data.category || "trading",
        author: address,
        coverImage: coverImageUrl,
      });
      
      return response.data;
    },
    onSuccess: () => {
      toast.success("Contribute created successfully!");
      queryClient.invalidateQueries({ queryKey: ["contributes"] });
      setOpen(false);
      setFormData({ title: "", subtitle: "", description: "", tags: [], category: "trading" });
      setCoverImage(null);
      setCoverImagePreview(null);
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to create contribute";
      toast.error(message);
    },
  });

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setCoverImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (formData.title.length > 100) {
      toast.error("Title must be less than 100 characters");
      return;
    }
    if (formData.description.length > 2000) {
      toast.error("Description must be less than 2000 characters");
      return;
    }
    createMutation.mutate(formData);
  };

  const canSubmit = formData.title.trim().length >= 3 && formData.description.trim().length >= 10 && connected;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "group relative overflow-hidden rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500",
            "px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30",
            "transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/40",
            "active:scale-95"
          )}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Create Contribute
        </Button>
      </DialogTrigger>
             <DialogContent className="max-h-[95vh] max-w-2xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
            Create New Contribute
          </DialogTitle>
          <DialogDescription>
            Share your trading idea, research, or signal with the community. Once created, others can invest in your contribute.
          </DialogDescription>
        </DialogHeader>

        {!connected && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            Please connect your wallet to create a contribute.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-semibold">
              Category <span className="text-text-muted">(optional)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CONTRIBUTE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border-2 p-3 text-left transition-all",
                      formData.category === cat.value
                        ? "border-indigo-500 bg-indigo-50 dark:border-cyan-400 dark:bg-cyan-950/30"
                        : "border-border-subtle bg-surface hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:border-cyan-700 dark:hover:bg-cyan-950/20"
                    )}
                  >
                    <Icon className="h-4 w-4 text-indigo-600 dark:text-cyan-400" />
                    <span className="text-xs font-medium">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., BTC Bull Run Prediction Q1 2025"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={100}
              className="rounded-xl"
              required
            />
            <p className="text-xs text-text-muted">{formData.title.length}/100 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle" className="text-sm font-semibold">
              Subtitle <span className="text-text-muted">(optional)</span>
            </Label>
            <Input
              id="subtitle"
              placeholder="Short summary in one line"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              maxLength={150}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImage" className="text-sm font-semibold">
              Cover Image <span className="text-text-muted">(optional)</span>
            </Label>
            {coverImagePreview ? (
              <div className="relative rounded-xl border-2 border-dashed border-border-subtle overflow-hidden">
                <img
                  src={coverImagePreview}
                  alt="Cover preview"
                  className="h-48 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="coverImage"
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-subtle bg-surface-muted p-8 transition-all hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:border-cyan-600 dark:hover:bg-cyan-950/20"
              >
                <ImageIcon className="mb-2 h-8 w-8 text-text-muted" />
                <p className="text-sm font-medium text-text-primary">Upload cover image</p>
                <p className="mt-1 text-xs text-text-muted">PNG, JPG up to 5MB</p>
                <input
                  id="coverImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Explain your idea, research findings, or signal rationale. Be detailed and transparent."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={2000}
              rows={6}
              className="resize-none rounded-xl"
              required
            />
            <p className="text-xs text-text-muted">{formData.description.length}/2000 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-semibold">
              Tags <span className="text-text-muted">(optional, max 5)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add a tag (e.g., btc, defi, nft)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="rounded-xl"
                disabled={formData.tags.length >= 5}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || formData.tags.length >= 5}
                className="rounded-xl"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="group flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200 dark:bg-cyan-950/40 dark:text-cyan-300"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 rounded-full hover:bg-indigo-300 dark:hover:bg-cyan-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

                 <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                   <Button
                     type="button"
                     variant="outline"
                     onClick={() => setOpen(false)}
                     className="min-h-[44px] flex-1 rounded-xl touch-manipulation"
                     disabled={createMutation.isPending}
                   >
                     Cancel
                   </Button>
                   <Button
                     type="submit"
                     disabled={!canSubmit || createMutation.isPending}
                     className={cn(
                       "min-h-[44px] flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500",
                       "font-semibold text-white shadow-lg shadow-indigo-500/30",
                       "transition-all hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/40",
                       "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                       "touch-manipulation"
                     )}
                   >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Contribute
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


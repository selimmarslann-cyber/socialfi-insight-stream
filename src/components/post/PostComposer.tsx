import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Paperclip, Smile, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { uploadPostImage, isSupabaseConfigured } from '@/lib/upload';
import { useWalletStore } from '@/lib/store';
import { ImageGrid } from './ImageGrid';

const hashtagSuggestions = ['#Bitcoin', '#Ethereum', '#NOP', '#DeFi', '#Airdrop', '#Layer2', '#zkSync'];
const emojiOptions = ['🚀', '🔥', '🧠', '💎', '📊', '🤝', '🪙', '✨'];
const MAX_FILES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const sanitizeContent = (value: string) => value.replace(/[<>]/g, '');

export const PostComposer = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { address } = useWalletStore();

  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hashtagQuery, setHashtagQuery] = useState<string | null>(null);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabaseReady = isSupabaseConfigured();

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 320)}px`;
  }, [content]);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    processFiles(selectedFiles);
  };

  const processFiles = (selectedFiles: File[]) => {
    if (!selectedFiles.length) return;

    const nextFiles: File[] = [];
    const nextPreviews: string[] = [];

    for (const file of selectedFiles) {
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 5MB`);
        continue;
      }
      if (files.length + nextFiles.length >= MAX_FILES) {
        toast.error('Maximum 4 images allowed per post');
        break;
      }
      nextFiles.push(file);
      nextPreviews.push(URL.createObjectURL(file));
    }

    setFiles((prev) => [...prev, ...nextFiles]);
    setPreviews((prev) => [...prev, ...nextPreviews]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!supabaseReady) {
      toast.info('Admin: VITE_SUPABASE_URL/ANON_KEY ekleyin.');
      return;
    }
    const dropped = Array.from(event.dataTransfer.files);
    processFiles(dropped);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleRemoveImage = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
    setPreviews((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) {
        URL.revokeObjectURL(removed);
      }
      return next;
    });
  };

  const handleContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setContent(value);
    const match = value.slice(0, event.target.selectionStart).match(/#([\p{L}\d_]{0,24})$/u);
    setHashtagQuery(match ? `#${match[1]}` : null);
    setError(null);
  };

  const insertHashtag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart } = textarea;
    const before = content.slice(0, selectionStart).replace(/#([\p{L}\d_]{0,24})$/u, tag + ' ');
    const after = content.slice(selectionStart);
    const nextContent = before + after;
    setContent(nextContent);
    setHashtagQuery(null);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = before.length;
    });
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const nextContent =
      content.slice(0, selectionStart) + emoji + content.slice(selectionEnd);
    setContent(nextContent);
    requestAnimationFrame(() => {
      textarea.focus();
      const caret = selectionStart + emoji.length;
      textarea.selectionStart = textarea.selectionEnd = caret;
    });
  };

  const estimatedReward = useMemo(() => {
    const base = 5;
    const contentWeight = Math.min(60, Math.floor(content.trim().length / 12));
    const imageWeight = files.length * 4;
    return Math.max(base, contentWeight + imageWeight);
  }, [content, files.length]);

  const canSubmit = content.trim().length >= 3 || files.length > 0;

  const resetComposer = () => {
    setContent('');
    setFiles([]);
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPreviews([]);
    setHashtagQuery(null);
    setShowEmojiPanel(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Add at least 3 characters or an image');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const sanitized = sanitizeContent(content.trim());
      const userId = address ?? 'guest';

      let uploadedUrls: string[] = [];
      if (files.length > 0) {
        if (!supabaseReady) {
          toast.error('Image upload requires Supabase configuration');
          setIsSubmitting(false);
          return;
        }
        uploadedUrls = await Promise.all(
          files.map((file) => uploadPostImage(file, userId))
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 800));

      console.info('Post published', {
        content: sanitized,
        images: uploadedUrls,
        reward: estimatedReward,
      });

      toast.success('Contribution shared with the network');
      resetComposer();
    } catch (err) {
      console.error(err);
      toast.error('Failed to publish contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="flex flex-col gap-6 rounded-3xl border-none bg-white p-6 shadow-xl ring-1 ring-indigo-500/10">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 flex-col gap-4">
          <div
            className="rounded-2xl border border-dashed border-indigo-500/20 bg-indigo-50/40 p-4 transition hover:border-indigo-500/30"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Share your alpha</p>
                <p className="text-xs text-slate-500">
                  Market outlooks, trading ideas, on-chain insights
                </p>
              </div>
              <Badge className="rounded-full bg-white text-xs font-semibold text-indigo-600 ring-1 ring-indigo-500/20">
                Visual ready
              </Badge>
            </div>

            <Textarea
              ref={textareaRef}
              placeholder="Break down the trade, tag protocols, drop the charts…"
              value={content}
              onChange={handleContentChange}
              className="mt-4 min-h-[140px] w-full resize-none border-none bg-transparent p-0 text-base text-slate-800 focus-visible:ring-0"
            />
          </div>

          {hashtagQuery && (
            <div className="flex flex-wrap gap-2">
              {hashtagSuggestions
                .filter((tag) => tag.toLowerCase().startsWith(hashtagQuery.toLowerCase()))
                .slice(0, 5)
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertHashtag(tag)}
                    className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-200"
                  >
                    {tag}
                  </button>
                ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!supabaseReady}
                    className="flex items-center gap-2 rounded-full border border-indigo-500/10 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Paperclip className="h-4 w-4" />
                    Attach media
                  </button>
                </TooltipTrigger>
                {!supabaseReady && (
                  <TooltipContent>
                    Admin: VITE_SUPABASE_URL/ANON_KEY ekleyin.
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              disabled={!supabaseReady}
            />

            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-indigo-500/10 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-500/30 hover:text-slate-800"
              onClick={() => setShowEmojiPanel((prev) => !prev)}
            >
              <Smile className="h-4 w-4" />
              Emoji
            </button>

            {showEmojiPanel && (
              <div className="flex items-center gap-1 rounded-full border border-indigo-500/10 bg-white px-3 py-2 text-lg shadow">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="px-2 py-1 transition hover:scale-110"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <span className="ml-auto text-xs text-slate-400">
              {content.length}/500
            </span>
          </div>

          {previews.length > 0 && (
            <div className="space-y-3">
              <ImageGrid images={previews} onRemove={handleRemoveImage} editable />
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                {files.map((file) => (
                  <span
                    key={file.name + file.size}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1"
                  >
                    <Upload className="h-3.5 w-3.5 text-indigo-500" />
                    {file.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm font-medium text-rose-500">{error}</p>
          )}
        </div>

        <aside className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-indigo-500/10 bg-slate-50/70 p-4 shadow-inner">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Est. NOP reward</h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {estimatedReward}
              <span className="ml-1 text-base font-medium text-slate-500">NOP</span>
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Based on content depth, visual signals and community traction.
            </p>
          </div>

          <div className="rounded-xl bg-white/80 p-3 text-xs text-slate-500 shadow">
            <p className="font-semibold text-slate-700">Tips</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Tag relevant assets using #hashtags.</li>
              <li>Attach up to 4 charts, on-chain screenshots or decks.</li>
              <li>Keep sensitive data masked.</li>
            </ul>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="h-11 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-sm font-semibold shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing…
                </>
              ) : (
                'Publish insight'
              )}
            </Button>
            <Button
              variant="ghost"
              className="h-10 text-sm text-slate-500 hover:text-slate-700"
              onClick={resetComposer}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear draft
            </Button>
          </div>
        </aside>
      </div>
    </Card>
  );
};

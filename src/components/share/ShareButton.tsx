import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Share2, Twitter, MessageCircle, Link2, QrCode, Copy, Check, Coins } from "lucide-react";
import { toast } from "sonner";
import { useWalletStore } from "@/lib/store";
import { trackShare } from "@/lib/share";

type ShareButtonProps = {
  contributeId: string;
  contributeTitle: string;
  postId?: number;
  className?: string;
};

export function ShareButton({ contributeId, contributeTitle, postId, className }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { address } = useWalletStore();

  const shareUrl = `${window.location.origin}/pool/${postId || contributeId}`;
  const shareText = `Check out this contribute: ${contributeTitle}`;
  const twitterText = encodeURIComponent(`${shareText}\n\n${shareUrl}`);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      
      // Track share
      if (address) {
        await trackShare({
          sharerAddress: address,
          contributeId,
          platform: "link",
        });
      }

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleTwitterShare = () => {
    window.open(`https://twitter.com/intent/tweet?text=${twitterText}`, "_blank");
    
    // Track share
    if (address) {
      trackShare({
        sharerAddress: address,
        contributeId,
        platform: "twitter",
      });
    }
  };

  const handleTelegramShare = () => {
    const telegramText = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${telegramText}`, "_blank");
    
    // Track share
    if (address) {
      trackShare({
        sharerAddress: address,
        contributeId,
        platform: "telegram",
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={className}
      >
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Share Contribute</DialogTitle>
            <DialogDescription>
              Share this contribute with your network and earn referral rewards!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleTwitterShare}
            >
              <Twitter className="mr-3 h-5 w-5 text-blue-400" />
              Share on Twitter
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleTelegramShare}
            >
              <MessageCircle className="mr-3 h-5 w-5 text-blue-500" />
              Share on Telegram
            </Button>

            <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-muted p-3">
              <Link2 className="h-5 w-5 text-text-muted" />
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-sm text-text-primary outline-none"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 w-8 p-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="rounded-lg border border-border-subtle bg-indigo-50/50 p-3 dark:bg-indigo-950/20">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-100">
                  Referral Rewards
                </p>
              </div>
              <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-300">
                Earn 5% of fees when someone buys through your share link!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


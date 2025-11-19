import { useState, ChangeEvent } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { uploadAvatar, updateProfile, type Profile } from "@/lib/profile";
import { useQueryClient } from "@tanstack/react-query";

type ProfileEditDialogProps = {
  profile: Profile;
  trigger?: React.ReactNode;
  onUpdated?: (next: Profile) => void;
};

export const ProfileEditDialog = ({ profile, trigger, onUpdated }: ProfileEditDialogProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [handle, setHandle] = useState(profile.handle ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const resetState = () => {
    setDisplayName(profile.display_name ?? "");
    setBio(profile.bio ?? "");
    setHandle(profile.handle ?? "");
    setAvatarUrl(profile.avatar_url ?? "");
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
      toast.success("Avatar updated.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to upload avatar. Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const result = await updateProfile({
        displayName,
        bio,
        avatarUrl: avatarUrl || undefined,
        handle: handle ? handle.toLowerCase().replace(/[^a-z0-9-_]/g, "") : undefined,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["current-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["public-profile", result.id] }),
      ]);
      toast.success("Profile updated");
      onUpdated?.(result);
      setOpen(false);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          resetState();
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            Edit profile
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Update how other operators see you across NOP.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border border-border">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName || profile.wallet_address || ""} /> : null}
                <AvatarFallback>
                  {displayName?.slice(0, 2).toUpperCase() || profile.wallet_address?.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button size="sm" variant="secondary" disabled={isUploading} asChild>
                  <label className="cursor-pointer">
                    <span>{isUploading ? "Uploading…" : "Change avatar"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </Button>
                <p className="text-xs text-muted-foreground">PNG/JPG up to 2MB.</p>
              </div>
            </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 40))}
              placeholder="Guest Analyst"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="handle">Handle</Label>
            <Input
              id="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value.slice(0, 24).toLowerCase())}
              placeholder="nop-alpha"
            />
            <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, dashes, or underscores.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 300))}
              placeholder="Macro strategist covering L2 infrastructure."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{bio.length}/300</p>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            NOP ID: <span className="font-semibold text-text-primary">{profile.nop_id ?? "pending"}</span>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

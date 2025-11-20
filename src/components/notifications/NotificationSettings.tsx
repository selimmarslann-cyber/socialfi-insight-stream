/**
 * Notification Settings Component
 * UI for managing notification preferences
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  requestPushPermission,
  type NotificationPreference,
} from "@/lib/advancedNotifications";
import { useWalletStore } from "@/lib/store";
import { Bell, Mail, Smartphone, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationSettings() {
  const { address } = useWalletStore();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);

  const { data: currentPrefs, isLoading } = useQuery({
    queryKey: ["notification-preferences", address],
    queryFn: () => (address ? getNotificationPreferences(address) : Promise.resolve(null)),
    enabled: !!address,
    onSuccess: (data) => {
      if (data) setPreferences(data);
    },
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: (prefs: Partial<NotificationPreference>) =>
      address ? updateNotificationPreferences(address, prefs) : Promise.reject("No address"),
    onSuccess: () => {
      toast.success("Notification preferences updated");
      queryClient.invalidateQueries({ queryKey: ["notification-preferences", address] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update preferences");
    },
  });

  const handleToggle = (key: keyof NotificationPreference, value: boolean) => {
    if (!preferences) return;
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    updateMutation.mutate({ [key]: value });
  };

  const handleRequestPush = async () => {
    const granted = await requestPushPermission();
    if (granted) {
      toast.success("Push notifications enabled");
    } else {
      toast.error("Push notifications denied");
    }
  };

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Connect your wallet to manage notifications</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading || !preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-indigo-500" />
          Notification Settings
        </CardTitle>
        <CardDescription>Choose how you want to receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Channel Preferences */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Channels</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="email">Email Notifications</Label>
              </div>
              <Switch
                id="email"
                checked={preferences.email}
                onCheckedChange={(checked) => handleToggle("email", checked)}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="push">Push Notifications</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="push"
                  checked={preferences.push}
                  onCheckedChange={(checked) => handleToggle("push", checked)}
                  disabled={updateMutation.isPending}
                />
                {!preferences.push && (
                  <Button variant="outline" size="sm" onClick={handleRequestPush}>
                    Enable
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="inApp">In-App Notifications</Label>
              </div>
              <Switch
                id="inApp"
                checked={preferences.inApp}
                onCheckedChange={(checked) => handleToggle("inApp", checked)}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Notification Types</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="posts">New Contributions</Label>
              <Switch
                id="posts"
                checked={preferences.posts}
                onCheckedChange={(checked) => handleToggle("posts", checked)}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="mentions">Mentions</Label>
              <Switch
                id="mentions"
                checked={preferences.mentions}
                onCheckedChange={(checked) => handleToggle("mentions", checked)}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="rewards">Rewards & Earnings</Label>
              <Switch
                id="rewards"
                checked={preferences.rewards}
                onCheckedChange={(checked) => handleToggle("rewards", checked)}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="priceAlerts">Price Alerts</Label>
              <Switch
                id="priceAlerts"
                checked={preferences.priceAlerts}
                onCheckedChange={(checked) => handleToggle("priceAlerts", checked)}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="lpRewards">LP Rewards</Label>
              <Switch
                id="lpRewards"
                checked={preferences.lpRewards}
                onCheckedChange={(checked) => handleToggle("lpRewards", checked)}
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="creatorEarnings">Creator Earnings</Label>
              <Switch
                id="creatorEarnings"
                checked={preferences.creatorEarnings}
                onCheckedChange={(checked) => handleToggle("creatorEarnings", checked)}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


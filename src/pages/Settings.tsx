import { useEffect, useState } from 'react';
import { User, Moon, Sun, Bell, Copy } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useWalletStore } from '@/lib/store';
import { getTheme, setTheme, subscribeTheme, type ThemeMode } from '@/lib/theme';

export default function Settings() {
  const { refCode } = useWalletStore();
  const displayRefCode = refCode || 'nop00000';
  const [mode, setMode] = useState<ThemeMode>(() => getTheme());
  const [notifications, setNotifications] = useState({
    posts: true,
    mentions: true,
    rewards: true,
  });

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  useEffect(() => {
    setMode(getTheme());
    const unsubscribe = subscribeTheme(setMode);
    return () => {
      unsubscribe();
    };
  }, []);

  const handleThemeSelection = (next: ThemeMode) => {
    setTheme(next);
    setMode(next);
    toast.success(
      next === 'dark' ? 'Koyu mod etkinleştirildi' : 'Açık mod etkinleştirildi',
    );
  };

  return (
    <Container>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="@username"
                defaultValue="crypto_analyst"
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                rows={4}
                defaultValue="Crypto analyst & DeFi enthusiast"
              />
            </div>
            <div>
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input id="avatar" placeholder="https://..." />
            </div>
            <div>
              <Label htmlFor="ref-code">Referral Code</Label>
              <div className="flex gap-2">
                <Input
                  id="ref-code"
                  value={displayRefCode}
                  readOnly
                  className="uppercase font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(displayRefCode);
                    toast.success('Referral code copied');
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Share your code to invite new community members.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="mb-3 block">Theme</Label>
            <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={mode === 'light' ? 'default' : 'outline'}
                  onClick={() => handleThemeSelection('light')}
                  className="gap-2"
                >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                  variant={mode === 'dark' ? 'default' : 'outline'}
                  onClick={() => handleThemeSelection('dark')}
                  className="gap-2"
                >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-posts">New Posts</Label>
                <p className="text-xs text-muted-foreground">Get notified about new posts</p>
              </div>
              <Switch
                id="notif-posts"
                checked={notifications.posts}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, posts: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-mentions">Mentions</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when someone mentions you
                </p>
              </div>
              <Switch
                id="notif-mentions"
                checked={notifications.mentions}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, mentions: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-rewards">Rewards</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified about point rewards
                </p>
              </div>
              <Switch
                id="notif-rewards"
                checked={notifications.rewards}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, rewards: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </Container>
  );
}

import { FormEvent, useState } from "react";
import { Shield, Flame, Zap } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";

export default function Admin() {
  const { isAdmin, login, logout } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleUpdateBurn = () => {
    toast.success("Burn counter updated");
  };

  const handleBoostTask = () => {
    toast.success("Task boosted successfully");
  };

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = login(username.trim(), password);
    if (success) {
      toast.success("Admin paneline giriş yapıldı");
    } else {
      toast.error("Geçersiz kullanıcı adı veya şifre");
    }
  };

  if (!isAdmin) {
    return (
      <Container>
        <div className="max-w-md mx-auto py-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                Admin Girişi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="username">Kullanıcı adı</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    placeholder="admin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="adminadmin"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Giriş Yap
                </Button>
                <p className="muted text-center">
                  Deneme erişimi için kullanıcı adı <strong>admin</strong> ve şifre <strong>adminadmin</strong>.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-accent" />
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage platform settings and events</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}>
            Çıkış Yap
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-negative" />
              Update Burn Counter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="total-burned">Total Burned</Label>
              <Input id="total-burned" type="number" placeholder="125000000" className="font-mono" />
            </div>
            <div>
              <Label htmlFor="last-24h">Last 24 Hours</Label>
              <Input id="last-24h" type="number" placeholder="450000" className="font-mono" />
            </div>
            <Button onClick={handleUpdateBurn}>Update Burn Stats</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-warning" />
              Boost Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="task-title">Task Title</Label>
              <Input id="task-title" placeholder="Complete Your Profile" />
            </div>
            <div>
              <Label htmlFor="task-desc">Description</Label>
              <Input id="task-desc" placeholder="Add bio and avatar for bonus points" />
            </div>
            <div>
              <Label htmlFor="multiplier">Multiplier</Label>
              <Input id="multiplier" type="number" step="0.1" placeholder="1.5" />
            </div>
            <Button onClick={handleBoostTask}>Create Boosted Task</Button>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

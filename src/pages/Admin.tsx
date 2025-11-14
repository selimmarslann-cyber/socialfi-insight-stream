import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Flame, ListChecks, ShieldCheck } from "lucide-react";
import StaticPageLayout from "@/components/layout/StaticPageLayout";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { getSupabase } from "@/lib/supabaseClient";
import SupabaseConfigAlert from "@/components/SupabaseConfigAlert";
import TokenBurn from "@/components/TokenBurn";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type GuardState = "loading" | "allowed" | "denied";

export default function Admin() {
  const supabase = getSupabase();
  usePageMetadata({
    title: "Admin Panel — NOP Intelligence Layer",
    description:
      "Manage burn metrics, upcoming tasks, and operational logs for the NOP Intelligence Layer.",
  });

  const navigate = useNavigate();
  const [guard, setGuard] = useState<GuardState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setGuard("denied");
      setErrorMessage("Supabase configuration missing.");
      return;
    }
    const verify = async () => {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();
        if (authError || !authData.user) {
          setGuard("denied");
          setErrorMessage("You don’t have permission.");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, is_admin")
          .eq("id", authData.user.id)
          .maybeSingle<{ id: string; is_admin: boolean }>();

        if (profileError || !profile?.is_admin) {
          setGuard("denied");
          setErrorMessage("You don’t have permission.");
          return;
        }

        setGuard("allowed");
      } catch (error) {
        console.error("ADMIN_GUARD", error);
        setGuard("denied");
        setErrorMessage("You don’t have permission.");
      }
    };

    void verify();
  }, [supabase]);

  useEffect(() => {
    if (guard === "denied") {
      const timer = window.setTimeout(() => {
        navigate("/", { replace: true });
      }, 2500);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [guard, navigate]);

  if (guard === "loading") {
    return (
      <StaticPageLayout>
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-[#0F172A]" />
            <h1 className="text-2xl font-semibold text-[#0F172A]">
              Admin Panel
            </h1>
          </div>
          <Skeleton className="h-24 rounded-2xl bg-white/70" />
          <Skeleton className="h-24 rounded-2xl bg-white/70" />
        </section>
      </StaticPageLayout>
    );
  }

  if (!supabase) {
    return (
      <StaticPageLayout>
        <SupabaseConfigAlert context="Admin panel requires Supabase auth to verify access." />
      </StaticPageLayout>
    );
  }

  if (guard === "denied") {
    return (
      <StaticPageLayout>
        <section className="space-y-4 rounded-2xl bg-white p-10 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-rose-500" />
          <h1 className="text-2xl font-semibold text-[#0F172A]">
            {errorMessage ?? "You don’t have permission."}
          </h1>
          <p className="leading-relaxed text-[#475569]">
            If you believe this is a mistake, contact an administrator. You’ll
            be redirected to the homepage shortly.
          </p>
        </section>
      </StaticPageLayout>
    );
  }

  return (
    <StaticPageLayout>
      <section className="space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-[#0F172A]" />
            <div>
              <h1 className="text-2xl font-semibold text-[#0F172A]">
                Admin Panel
              </h1>
              <p className="text-sm leading-relaxed text-[#475569]">
                Manage burn reporting, plan upcoming tasks, and review system
                activity.
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="rounded-full bg-[#F5F8FF] text-[#0F172A]"
          >
            Internal Access
          </Badge>
        </header>

        <div className="space-y-6">
          <Card className="border-none bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                  <Flame className="h-5 w-5 text-[#0F172A]" />
                  Burn Manager
                </CardTitle>
                <CardDescription>
                  Update the public burn widget to reflect the latest on-chain
                  totals.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <TokenBurn admin />
            </CardContent>
          </Card>

          <Card className="border-none bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2">
              <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                <ListChecks className="h-5 w-5 text-[#0F172A]" />
                Task Manager
              </CardTitle>
            </CardHeader>
            <CardContent className="leading-relaxed text-[#475569]">
              Workflow automation for boosted tasks is in development. You will
              soon be able to schedule missions, assign reviewers, and monitor
              completion status from this panel.
            </CardContent>
          </Card>

          <Card className="border-none bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center gap-2">
              <CardTitle className="flex items-center gap-2 text-[#0F172A]">
                <Activity className="h-5 w-5 text-[#0F172A]" />
                Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="leading-relaxed text-[#475569]">
              Comprehensive audit logs, anomaly alerts, and scoring diffs will
              appear here soon. Until then, please monitor the Supabase
              dashboard for raw event streams.
            </CardContent>
          </Card>
        </div>
      </section>
    </StaticPageLayout>
  );
}

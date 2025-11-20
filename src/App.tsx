import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { MiniTour } from "@/components/onboarding/MiniTour";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import WalletPage from "./pages/WalletPage";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Contributes from "./pages/Contributes";
import Portfolio from "./pages/Portfolio";
import Search from "./pages/Search";
import AdminContributeDetail from "./pages/admin/ContributeDetail";
import PoolOverview from "./pages/pool/PoolOverview";
import PoolBuy from "./pages/pool/PoolBuy";
import PoolSell from "./pages/pool/PoolSell";
import PoolChart from "./pages/pool/PoolChart";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Whitepaper from "./pages/Whitepaper";
import Tokenomics from "./pages/Tokenomics";
import Burn from "./pages/Burn";
import Legal from "./pages/Legal";
import Contact from "./pages/Contact";
import Features from "./pages/Features";
import Roadmap from "./pages/Roadmap";
import FAQ from "./pages/FAQ";
import Docs from "./pages/Docs";
import DocsApi from "./pages/DocsApi";
import Community from "./pages/Community";
import Status from "./pages/Status";
import LegalPrivacy from "./pages/legal/LegalPrivacy";
import LegalTerms from "./pages/legal/LegalTerms";
import LegalCookies from "./pages/legal/LegalCookies";
import Litepaper from "./pages/Litepaper";
import Onboarding from "./pages/Onboarding";
import ProfileMe from "./pages/ProfileMe";
import ProfilePublic from "./pages/ProfilePublic";
import Intelligence from "./pages/Intelligence";
import PoolAnalytics from "./pages/PoolAnalytics";
import CopyTrading from "./pages/CopyTrading";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const { i18n } = useTranslation();
  const [showTour, setShowTour] = useState(false);

  // Set document direction for RTL languages
  useEffect(() => {
    const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeenTour = localStorage.getItem("nopMiniTour");
      if (hasSeenTour !== "done") {
        setShowTour(true);
      }

      // Handle referral code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get("ref");
      if (refCode) {
        // Store referral code for later use (when user connects wallet)
        localStorage.setItem("nop_referral_code", refCode);
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
                <Route element={<AppShell />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/intelligence" element={<Intelligence />} />
                  <Route path="/analytics" element={<PoolAnalytics />} />
                  <Route path="/contributes" element={<Contributes />} />
                  <Route path="/portfolio" element={<Portfolio />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/wallet" element={<WalletPage />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/profile" element={<ProfileMe />} />
                    <Route path="/u/:slug" element={<ProfilePublic />} />
                <Route path="/about" element={<About />} />
                <Route path="/whitepaper" element={<Whitepaper />} />
                <Route path="/tokenomics" element={<Tokenomics />} />
                    <Route path="/litepaper" element={<Litepaper />} />
                  <Route path="/features" element={<Features />} />
                    <Route path="/roadmap" element={<Roadmap />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/docs" element={<Docs />} />
                    <Route path="/docs/whitepaper" element={<Whitepaper />} />
                    <Route path="/docs/tokenomics" element={<Tokenomics />} />
                    <Route path="/docs/litepaper" element={<Litepaper />} />
                    <Route path="/docs/onboarding" element={<Onboarding />} />
                    <Route path="/docs/roadmap" element={<Roadmap />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/docs/api" element={<DocsApi />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/status" element={<Status />} />
                <Route path="/burn" element={<Burn />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/legal/privacy" element={<LegalPrivacy />} />
                <Route path="/legal/terms" element={<LegalTerms />} />
                <Route path="/legal/cookies" element={<LegalCookies />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/contributes/:id" element={<AdminContributeDetail />} />
                <Route path="/pool/:postId" element={<PoolOverview />} />
                <Route path="/pool/:postId/chart" element={<PoolChart />} />
                <Route path="/pool/:postId/buy" element={<PoolBuy />} />
                <Route path="/pool/:postId/sell" element={<PoolSell />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
          {showTour && <MiniTour onFinish={() => setShowTour(false)} />}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

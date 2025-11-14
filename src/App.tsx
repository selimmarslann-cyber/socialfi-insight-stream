import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import WalletPage from "./pages/WalletPage";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Contributes from "./pages/Contributes";
import Games from "./pages/Games";
import Flappy from "./pages/games/Flappy";
import Runner from "./pages/games/Runner";
import Memory from "./pages/games/Memory";
import Reaction from "./pages/games/Reaction";
import AdminContributeDetail from "./pages/admin/ContributeDetail";
import GamesAdmin from "./pages/admin/GamesAdmin";
import PoolOverview from "./pages/pool/PoolOverview";
import PoolBuy from "./pages/pool/PoolBuy";
import PoolSell from "./pages/pool/PoolSell";
import PoolChart from "./pages/pool/PoolChart";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Whitepaper from "./pages/Whitepaper";
import Tokenomics from "./pages/Tokenomics";
import Burn from "./pages/Burn";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Security from "./pages/Security";
import Guidelines from "./pages/Guidelines";
import Contact from "./pages/Contact";
import Support from "./pages/Support";
import Features from "./pages/Features";
import Roadmap from "./pages/Roadmap";
import FAQ from "./pages/FAQ";
import DocsApi from "./pages/DocsApi";
import Community from "./pages/Community";
import Status from "./pages/Status";
import LegalPrivacy from "./pages/legal/LegalPrivacy";
import LegalTerms from "./pages/legal/LegalTerms";
import LegalCookies from "./pages/legal/LegalCookies";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Index />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/contributes" element={<Contributes />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/games" element={<Games />} />
              <Route path="/games/flappy" element={<Flappy />} />
              <Route path="/games/runner" element={<Runner />} />
              <Route path="/games/memory" element={<Memory />} />
              <Route path="/games/reaction" element={<Reaction />} />
              <Route path="/about" element={<About />} />
              <Route path="/whitepaper" element={<Whitepaper />} />
              <Route path="/tokenomics" element={<Tokenomics />} />
                <Route path="/features" element={<Features />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/docs/api" element={<DocsApi />} />
                <Route path="/community" element={<Community />} />
                <Route path="/status" element={<Status />} />
              <Route path="/burn" element={<Burn />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<Cookies />} />
                <Route path="/legal/privacy" element={<LegalPrivacy />} />
                <Route path="/legal/terms" element={<LegalTerms />} />
                <Route path="/legal/cookies" element={<LegalCookies />} />
              <Route path="/security" element={<Security />} />
              <Route path="/guidelines" element={<Guidelines />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/support" element={<Support />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/games" element={<GamesAdmin />} />
              <Route path="/admin/contributes/:id" element={<AdminContributeDetail />} />
              <Route path="/pool/:postId" element={<PoolOverview />} />
              <Route path="/pool/:postId/chart" element={<PoolChart />} />
              <Route path="/pool/:postId/buy" element={<PoolBuy />} />
              <Route path="/pool/:postId/sell" element={<PoolSell />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import WalletPage from "./pages/WalletPage";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Contributes from "./pages/Contributes";
import AdminContributeDetail from "./pages/admin/ContributeDetail";
import PoolOverview from "./pages/pool/PoolOverview";
import PoolBuy from "./pages/pool/PoolBuy";
import PoolSell from "./pages/pool/PoolSell";
import PoolChart from "./pages/pool/PoolChart";
import NotFound from "./pages/NotFound";

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
          <Route path="/" element={<Index />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/contributes" element={<Contributes />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/contributes/:id" element={<AdminContributeDetail />} />
          <Route path="/pool/:postId" element={<PoolOverview />} />
          <Route path="/pool/:postId/chart" element={<PoolChart />} />
          <Route path="/pool/:postId/buy" element={<PoolBuy />} />
          <Route path="/pool/:postId/sell" element={<PoolSell />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

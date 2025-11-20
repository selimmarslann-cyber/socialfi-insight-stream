import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContributeCard } from "@/components/ContributeCard";
import { DashboardCard } from "@/components/layout/visuals/DashboardCard";
import { DashboardSectionTitle } from "@/components/layout/visuals/DashboardSectionTitle";
import { fetchContributesWithStats } from "@/lib/contributes";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import type { ContributeWithStats } from "@/lib/contributes";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);

  usePageMetadata({
    title: `Search${query ? `: ${query}` : ""} — NOP Intelligence Layer`,
    description: "Search contributes, creators, and insights",
  });

  const { data: allContributes, isLoading } = useQuery({
    queryKey: ["contributes-with-stats"],
    queryFn: fetchContributesWithStats,
  });

  const filteredContributes = useQuery({
    queryKey: ["search-contributes", query],
    queryFn: () => {
      if (!query.trim() || !allContributes) return [];
      
      const lowerQuery = query.toLowerCase();
      return allContributes.filter((contribute) => {
        const titleMatch = contribute.title?.toLowerCase().includes(lowerQuery);
        const subtitleMatch = contribute.subtitle?.toLowerCase().includes(lowerQuery);
        const descriptionMatch = contribute.description?.toLowerCase().includes(lowerQuery);
        const authorMatch = contribute.author?.toLowerCase().includes(lowerQuery);
        const tagsMatch = contribute.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
        
        return titleMatch || subtitleMatch || descriptionMatch || authorMatch || tagsMatch;
      });
    },
    enabled: Boolean(query.trim() && allContributes),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  const results = filteredContributes.data || [];
  const hasResults = results.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <div className="space-y-6">
      <DashboardCard className="space-y-4">
        <DashboardSectionTitle label="Search" title="Discover Contributes" />
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted sm:left-4" />
              <Input
                type="text"
                placeholder="Search by title, author, tags, description…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="h-12 pl-10 pr-4 text-base sm:pl-12"
              />
            </div>
            <Button type="submit" className="h-12 px-6">
              <SearchIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Trending</Badge>
            <Badge variant="secondary">Trading Signal</Badge>
            <Badge variant="secondary">Research</Badge>
            <Badge variant="secondary">Market Analysis</Badge>
          </div>
        </form>
      </DashboardCard>

      {isLoading ? (
        <LoadingState message="Loading contributes..." />
      ) : hasQuery ? (
        hasResults ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                Found {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
              </p>
            </div>
            
            <div className="space-y-4">
              {results.map((contribute) => (
                <ContributeCard key={contribute.id} item={contribute} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="No results found"
            description={`No contributes match "${query}". Try different keywords.`}
          />
        )
      ) : (
        <EmptyState
          title="Start searching"
          description="Enter keywords to search contributes, creators, and insights"
        />
      )}
    </div>
  );
}


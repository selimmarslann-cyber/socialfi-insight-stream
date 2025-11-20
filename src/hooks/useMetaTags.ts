/**
 * useMetaTags Hook
 * React hook for managing dynamic meta tags
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { updateMetaTags, resetMetaTags, type MetaTagData } from "@/lib/metaTags";

export function useMetaTags(data: MetaTagData) {
  const location = useLocation();

  useEffect(() => {
    // Update meta tags with provided data
    updateMetaTags({
      ...data,
      url: data.url || window.location.href,
    });

    // Reset on unmount
    return () => {
      resetMetaTags();
    };
  }, [location.pathname, data.title, data.description, data.image]);
}

/**
 * Hook for page-specific meta tags
 */
export function usePageMetaTags(title: string, description: string, image?: string) {
  useMetaTags({
    title: `${title} — NOP Intelligence Layer`,
    description,
    image,
    type: "website",
  });
}


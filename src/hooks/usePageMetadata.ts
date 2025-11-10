import { useEffect } from "react";

interface PageMetadataOptions {
  title?: string;
  description?: string;
}

export const usePageMetadata = ({ title, description }: PageMetadataOptions) => {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const previousTitle = document.title;
    const metaDescription = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    const previousDescription = metaDescription?.getAttribute("content") ?? null;

    if (title) {
      document.title = title;
    }

    if (description && metaDescription) {
      metaDescription.setAttribute("content", description);
    }

    return () => {
      if (title) {
        document.title = previousTitle;
      }
      if (description && metaDescription) {
        if (previousDescription !== null) {
          metaDescription.setAttribute("content", previousDescription);
        } else {
          metaDescription.removeAttribute("content");
        }
      }
    };
  }, [title, description]);
};

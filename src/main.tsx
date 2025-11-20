import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/design-tokens.css";
import "./index.css";
import { initTheme } from "@/lib/theme";
import ErrorBoundary from "@/components/ErrorBoundary";
import "@/lib/i18n";

initTheme();

// Register Service Worker for PWA
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[PWA] Service Worker registered:", registration.scope);
      })
      .catch((error) => {
        console.error("[PWA] Service Worker registration failed:", error);
      });
  });
}

if (typeof window !== "undefined") {
  void import("./utils/clickGuard").then((module) => {
    module.installClickGuard();
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

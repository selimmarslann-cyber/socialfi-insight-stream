import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/design-tokens.css";
import "./index.css";
import { initTheme } from "@/lib/theme";
import ErrorBoundary from "@/components/ErrorBoundary";

initTheme();

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

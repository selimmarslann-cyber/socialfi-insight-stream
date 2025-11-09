import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/design-tokens.css";
import "./index.css";
import { initTheme } from "@/lib/theme";

initTheme();

createRoot(document.getElementById("root")!).render(<App />);

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins: any[] = [react()];
  
  // Only load lovable-tagger in development mode
  if (mode === "development") {
    try {
      const { componentTagger } = await import("lovable-tagger");
      plugins.push(componentTagger());
    } catch {
      // lovable-tagger not available, skip silently
    }
  }

  return {
    base: "/",
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return;
            }

            if (id.includes("recharts")) {
              return "charts";
            }

            if (id.includes("supabase")) {
              return "supabase";
            }

            if (id.includes("@tanstack/react-query")) {
              return "react-query";
            }

            if (id.includes("react-router-dom")) {
              return "router";
            }

            if (id.includes("radix-ui")) {
              return "radix-ui";
            }

            if (id.includes("lucide-react")) {
              return "icons";
            }

            if (id.includes("ethers")) {
              return "ethers";
            }

            if (id.includes("zustand")) {
              return "state";
            }
          },
        },
      },
    },
  };
});

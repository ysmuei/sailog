import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "sailog-dev-csp",
      apply: "serve",
      // Vite's reconnect pinger uses a local blob worker. Production CSP stays self-only.
      transformIndexHtml: (html) =>
        html.replace("worker-src 'self'", "worker-src 'self' blob:"),
    },
  ],
  optimizeDeps: { include: ["jszip", "papaparse"] },
  server: {
    watch: {
      ignored: [
        "**/test-results/**",
        "**/playwright-report/**",
        "**/.agents/**",
        "**/*.tsbuildinfo",
      ],
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});

import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/convex": path.resolve(__dirname, "./convex"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    exclude: [
      "OpenHands/**",
      ".convex/**",
      "coverage/**",
      "dist/**",
      "convex/_generated/**",
    ],
    projects: [
      {
        extends: true,
        test: {
          name: "convex",
          include: ["convex/**/*.test.{ts,tsx}"],
          environment: "edge-runtime",
        },
      },
      {
        extends: true,
        test: {
          name: "frontend",
          include: ["src/**/*.test.{ts,tsx}"],
          environment: "node",
        },
      },
    ],
    coverage: {
      exclude: [
        "OpenHands/**",
        ".convex/**",
        "coverage/**",
        "dist/**",
        "convex/_generated/**",
      ],
    },
  },
});

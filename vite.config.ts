import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

function githubPagesBase() {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) return "/";

  const repoName = repository.split("/")[1] ?? "";
  return repoName.endsWith(".github.io") ? "/" : `/${repoName}/`;
}

export default defineConfig({
  base: githubPagesBase(),
  plugins: [react()],
  resolve: {
    alias: {
      "cursor/canvas": path.resolve(__dirname, "src/cursor-canvas.tsx"),
    },
  },
});

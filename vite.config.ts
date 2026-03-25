import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  run: {
    tasks: {
      build: {
        command: "pnpm run format",
        cache: false,
        dependsOn: ["@batijs/cli#build"],
      },
    },
  },
});

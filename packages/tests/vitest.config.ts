import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    include: ["*.local.spec.ts"],
    testTimeout: 100000,
  },
});

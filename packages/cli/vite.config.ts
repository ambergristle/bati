import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

const __dirname = dirname(fileURLToPath(import.meta.url));
const boilerplatesDir = join(__dirname, "..", "..", "boilerplates");

const boilerplateDepends = readdirSync(boilerplatesDir)
  .filter((entry) => statSync(join(boilerplatesDir, entry)).isDirectory())
  .flatMap((entry) => {
    try {
      const pkg = JSON.parse(readFileSync(join(boilerplatesDir, entry, "package.json"), "utf-8"));
      return pkg.name ? [`${pkg.name}#build`] : [];
    } catch {
      return [];
    }
  })
  .sort();

export default defineConfig({
  run: {
    tasks: {
      build: {
        command: "tsdown",
        dependsOn: [
          "@batijs/core#build",
          "@batijs/compile#build",
          "@batijs/features#build",
          "@batijs/build#build",
          ...boilerplateDepends,
        ],
      },
    },
  },
});

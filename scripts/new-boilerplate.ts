import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineCommand, runMain } from "citty";
import sharedPackageJson from "../boilerplates/shared/package.json" with { type: "json" };
import { listBoilerplates } from "./helpers/boilerplates.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __boilerplates = resolve(__dirname, "..", "boilerplates");
const __packages = resolve(__dirname, "..", "packages");

const validNameRe = /[a-z0-9-.]/;

async function createFolders(name: string) {
  const root = join(__boilerplates, name);

  await mkdir(join(__boilerplates, name));
  await mkdir(join(root, "files"));

  return root;
}

async function createPackageJson(name: string) {
  const dest = join(__boilerplates, name, "package.json");

  const json = {
    name: `@batijs/${name}`,
    private: true,
    version: "0.0.1",
    description: "",
    type: "module",
    scripts: {
      "check-types": "tsc --noEmit",
      build: "bati-compile-boilerplate",
    },
    keywords: [],
    author: "",
    license: "MIT",
    devDependencies: {
      "@batijs/compile": "workspace:*",
      "@types/node": sharedPackageJson.devDependencies["@types/node"],
    },
    dependencies: {
      "@batijs/core": "workspace:*",
    },
    files: ["dist/"],
  };

  await writeFile(dest, JSON.stringify(json, undefined, 2), "utf-8");
}

async function createBatiConfig(name: string) {
  const dest = join(__boilerplates, name, "bati.config.ts");

  await writeFile(
    dest,
    `import { defineConfig } from "@batijs/core/config";

export default defineConfig({
  if(meta) {
    return meta.BATI.has(${JSON.stringify(name)});
  },
});
`,
    "utf-8",
  );
}

async function createTsconfig(name: string) {
  const dest = join(__boilerplates, name, "tsconfig.json");

  const json = {
    extends: ["../tsconfig.base.json"],
  };

  await writeFile(dest, JSON.stringify(json, undefined, 2), "utf-8");
}

async function updateCliViteConfig() {
  const deps: string[] = [];

  for await (const dep of listBoilerplates()) {
    deps.push(`${dep}#build`);
  }

  deps.sort();

  const cliViteConfig = join(__packages, "cli", "vite.config.ts");
  const content = await readFile(cliViteConfig, "utf-8");

  // Replace the dependsOn array while preserving the surrounding structure
  const updated = content.replace(
    /(dependsOn:\s*\[)[^\]]*(\])/s,
    `$1\n          "@batijs/core#build",\n          "@batijs/compile#build",\n          "@batijs/features#build",\n          "@batijs/build#build",\n${deps.map((d) => `          ${JSON.stringify(d)}`).join(",\n")},\n        $2`,
  );

  await writeFile(cliViteConfig, updated, "utf-8");
}

async function exec(name: string) {
  const root = await createFolders(name);

  await createPackageJson(name);
  await createBatiConfig(name);
  await createTsconfig(name);
  await updateCliViteConfig();

  return root;
}

const main = defineCommand({
  meta: {
    name: "new-boilerplate",
    version: "1.0.0",
    description: "Create a new Bati boilerplate",
  },
  args: {
    name: {
      type: "positional",
      required: true,
    },
  },
  async run({ args }) {
    if (!validNameRe.test(args.name)) {
      throw new Error("Invalid boilerplates name");
    }

    const root = await exec(args.name);
    console.log("Boilerplate created at", root);
  },
});

runMain(main);

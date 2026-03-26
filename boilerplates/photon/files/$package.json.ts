import { loadPackageJson, type TransformerProps } from "@batijs/core";

export default async function getPackageJson(props: TransformerProps): Promise<unknown> {
  const packageJson = await loadPackageJson(props, await import("../package.json").then((x) => x.default));

  return packageJson
    .setScript("dev", {
      value: "vike dev",
      precedence: 20,
      warnIfReplaced: true,
    })
    .setScript("build", {
      value: "vike build",
      precedence: 20,
      warnIfReplaced: true,
    })
    .setScript("prod", {
      value: "vike build && node ./dist/server/index.mjs",
      precedence: 20,
    })
    .addDependencies(["vike-photon"])
    // @photonjs/core@0.1.21 has two bugs with Vite 8 / Rolldown:
    // 1. this.load({ resolveDependencies: true }) in resolveId hooks causes deadlocks
    // 2. Multiple photon:resolve-virtual-importer plugins mutually recurse infinitely
    // Remove this patch once @photonjs/core ships a fix upstream.
    .setPnpmPatchedDependency("@photonjs/core@0.1.21", "patches/@photonjs__core@0.1.21.patch");
}

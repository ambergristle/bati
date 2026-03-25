import { exec } from "./exec.js";
import { npmCli } from "./package-manager.js";
import type { GlobalContext } from "./types.js";
import { waitForLocalhost } from "./wait-for-localhost.js";

export async function runDevServer(context: GlobalContext) {
  const cmd = ["run", "dev", "--port", String(context.port)];
  console.log(`[bati-test] Starting dev server: ${npmCli} ${cmd.join(" ")}`);
  context.server = exec(npmCli, cmd, {
    env: {
      PORT: String(context.port),
      VITE_CONFIG: JSON.stringify({ server: { port: context.port, strictPort: true } }),
    },
  });

  const res = await Promise.race([
    // wait for port
    waitForLocalhost({
      port: context.port,
      useGet: true,
      timeout: process.env.CI ? 30000 : 15000,
      debug: cmd.join(" "),
    }),
    // or for server to crash
    context.server,
  ]);

  if (!res) {
    throw new Error("Server stopped before tests could run");
  }

  console.log(`[bati-test] Dev server ready at http://localhost:${context.port} (PID: ${context.server.pid ?? "unknown"})`);
  return { server: context.server, port: context.port };
}

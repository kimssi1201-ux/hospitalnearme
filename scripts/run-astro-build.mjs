import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const astroBin = join(projectRoot, "node_modules", "astro", "bin", "astro.mjs");

const result = spawnSync(process.execPath, [astroBin, "build"], {
  cwd: projectRoot,
  env: {
    ...process.env,
    ASTRO_TELEMETRY_DISABLED: "1",
  },
  stdio: "inherit",
});

process.exit(result.status ?? 1);

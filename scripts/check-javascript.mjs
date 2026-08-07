import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ignored = new Set([".git", "node_modules", ".wrangler"]);

async function collectJavaScript(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectJavaScript(fullPath));
    } else if (/\.(?:js|mjs|cjs)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = await collectJavaScript(root);
const failures = [];

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
    windowsHide: true
  });

  if (result.status !== 0) {
    failures.push({ file, output: `${result.stdout || ""}${result.stderr || ""}`.trim() });
  }
}

if (failures.length) {
  for (const failure of failures) {
    console.error(`Syntax error: ${path.relative(root, failure.file)}`);
    console.error(failure.output);
  }
  process.exitCode = 1;
} else {
  console.log(`JavaScript syntax OK: ${files.length} files checked.`);
}

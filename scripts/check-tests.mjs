import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const TEST_PATTERNS = [
  /\.test\.[cm]?[jt]sx?$/,
  /\.spec\.[cm]?[jt]sx?$/,
  /__tests__\/.+\.[cm]?[jt]sx?$/,
];

const TEST_RUNNERS = [
  ["vitest", ["run"]],
  ["jest", []],
];

function walk(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    if (["node_modules", "dist", ".git"].includes(entry)) {
      continue;
    }

    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      walk(path, files);
    } else {
      files.push(path);
    }
  }

  return files;
}

const tests = walk(process.cwd()).filter((file) =>
  TEST_PATTERNS.some((pattern) => pattern.test(file))
);

if (!tests.length) {
  console.log("No test files found yet. Skipping test runner.");
  process.exit(0);
}

for (const [runner, args] of TEST_RUNNERS) {
  const result = spawnSync("npx", ["--no-install", runner, ...args], {
    stdio: "inherit",
  });

  if (result.status !== null) {
    process.exit(result.status);
  }
}

console.error("Test files were found, but no supported test runner is installed.");
console.error("Install Vitest or Jest, then rerun `npm test`.");
process.exit(1);


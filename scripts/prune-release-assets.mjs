import { readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const releaseDir = "dist";
const excludedFiles = [/\.psd$/i, /^\.DS_Store$/i];

const pruneDirectory = (directory) => {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      pruneDirectory(path);

      if (readdirSync(path).length === 0) {
        rmSync(path, { recursive: true });
      }
      continue;
    }

    if (excludedFiles.some((pattern) => pattern.test(entry))) {
      rmSync(path);
    }
  }
};

pruneDirectory(releaseDir);

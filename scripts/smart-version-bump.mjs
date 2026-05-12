import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const VALID_BUMPS = new Set(["major", "minor", "patch", "none"]);
const override = process.env.TIME_PILOT_VERSION_BUMP;

if (override && !VALID_BUMPS.has(override)) {
  console.error(
    `Invalid TIME_PILOT_VERSION_BUMP=${override}. Use major, minor, patch, or none.`
  );
  process.exit(1);
}

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout);
  }
  return result.stdout.trim();
}

function gitWithInput(args, input) {
  const result = spawnSync("git", args, { encoding: "utf8", input });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout);
  }
  return result.stdout.trim();
}

function readStagedFile(path) {
  return git(["show", `:${path}`]);
}

function stageFileContent(path, content) {
  const indexEntry = git(["ls-files", "-s", "--", path]);
  const [mode] = indexEntry.split(/\s+/);
  const blob = gitWithInput(["hash-object", "-w", "--stdin"], content);

  git(["update-index", "--cacheinfo", mode, blob, path]);
}

function updatePackageVersion(content, nextVersion) {
  const packageJson = JSON.parse(content);
  packageJson.version = nextVersion;
  return `${JSON.stringify(packageJson, null, 2)}\n`;
}

function updatePackageLockVersion(content, nextVersion) {
  const packageLock = JSON.parse(content);
  packageLock.version = nextVersion;

  if (packageLock.packages?.[""]) {
    packageLock.packages[""].version = nextVersion;
  }

  return `${JSON.stringify(packageLock, null, 2)}\n`;
}

function stagedNameStatus() {
  const output = git(["diff", "--cached", "--name-status"]);
  if (!output) {
    return [];
  }

  return output.split("\n").map((line) => {
    const [status, ...paths] = line.split(/\s+/);
    const path = paths.at(-1) ?? "";
    const previousPath = paths.length > 1 ? paths[0] : undefined;
    return { status, path, previousPath };
  });
}

function stagedDiff(paths) {
  if (!paths.length) {
    return "";
  }

  return git(["diff", "--cached", "--", ...paths]);
}

function isDocsOnly(changes) {
  return changes.every(({ path }) =>
    /^(README|WHATSNEW|CHANGELOG|LICENSE)(\.md)?$/i.test(path) ||
    /^docs\//.test(path) ||
    /\.md$/i.test(path)
  );
}

function classifyChange(changes) {
  if (override) {
    return override;
  }

  if (!changes.length || isDocsOnly(changes)) {
    return "none";
  }

  const paths = changes.map(({ path }) => path);
  const diff = stagedDiff(paths);

  const touchesPublicApi = paths.some((path) =>
    [
      "src/index.ts",
      "src/game/index.ts",
      "src/game/use-time-pilot.ts",
      "src/game/types.ts",
      "src/components/TimePilotGame.tsx",
    ].includes(path)
  );

  const hasDeletion = changes.some(({ status }) => status.startsWith("D"));
  const removesExport = /^-\s*export\s+(class|function|interface|type|const|default)/m.test(diff);
  const explicitBreakingSignal =
    /BREAKING CHANGE|breaking change|@breaking|major bump/i.test(diff);

  if (explicitBreakingSignal || (touchesPublicApi && (hasDeletion || removesExport))) {
    return "major";
  }

  const hasNewSource = changes.some(
    ({ status, path }) => status.startsWith("A") && /^src\/.+\.(ts|tsx)$/.test(path)
  );
  const touchesFeatureCode = paths.some((path) =>
    /^src\/game\/(controller|menus|engine|.+\.ts$)/.test(path)
  );
  const touchesAssets = paths.some((path) => /^public\//.test(path));
  const touchesDependencies = paths.some((path) =>
    ["package.json", "package-lock.json"].includes(path)
  );
  const addsExport = /^\+\s*export\s+(class|function|interface|type|const|default)/m.test(diff);

  if (hasNewSource || touchesAssets || touchesDependencies || addsExport || touchesFeatureCode) {
    return "minor";
  }

  return "patch";
}

function bumpVersion(version, bump) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);
  if (!match) {
    throw new Error(`Unsupported package version: ${version}`);
  }

  let [, major, minor, patch, suffix] = match;
  let nextMajor = Number(major);
  let nextMinor = Number(minor);
  let nextPatch = Number(patch);

  if (bump === "major") {
    nextMajor += 1;
    nextMinor = 0;
    nextPatch = 0;
  } else if (bump === "minor") {
    nextMinor += 1;
    nextPatch = 0;
  } else if (bump === "patch") {
    nextPatch += 1;
  }

  return `${nextMajor}.${nextMinor}.${nextPatch}${suffix}`;
}

const changes = stagedNameStatus();
const bump = classifyChange(changes);

if (bump === "none") {
  console.log("Version bump skipped: staged changes do not require a release bump.");
  process.exit(0);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const currentVersion = packageJson.version;
const nextVersion = bumpVersion(currentVersion, bump);

if (currentVersion === nextVersion) {
  console.log(`Version remains ${currentVersion}.`);
  process.exit(0);
}

writeFileSync(
  "package.json",
  updatePackageVersion(readFileSync("package.json", "utf8"), nextVersion)
);
stageFileContent(
  "package.json",
  updatePackageVersion(readStagedFile("package.json"), nextVersion)
);

if (existsSync("package-lock.json")) {
  writeFileSync(
    "package-lock.json",
    updatePackageLockVersion(readFileSync("package-lock.json", "utf8"), nextVersion)
  );
  stageFileContent(
    "package-lock.json",
    updatePackageLockVersion(readStagedFile("package-lock.json"), nextVersion)
  );
}

console.log(`Version bumped ${currentVersion} -> ${nextVersion} (${bump}).`);

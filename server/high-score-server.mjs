/* global Buffer, console, process */

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath, URL } from "node:url";
import pg from "pg";

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFilePaths = [
  resolve(__dirname, "../.env.local"),
  resolve(__dirname, "../.env"),
];
const apiRuntimeFilePath = resolve(__dirname, "../.time-pilot/high-score-api.json");
const staticRootPath = resolve(__dirname, "../dist");
const jsonStorePath = resolve(__dirname, "../data/high-scores.json");
const maxBodyBytes = 64 * 1024;
const maxGameEra = 5;
const highScoreIntegrityVersion = 1;
const highScoreIntegrityHashModulo = 1000003;
const highScoreIntegrityMinMultiplier = 101;
const highScoreIntegrityMultiplierRange = 897;
const maxPlausibleAccuracy = 100;
const maxPlausibleBonuses = 200;
const maxPlausibleBosses = 5;
const maxPlausibleEnemies = 2000;
const maxPlausibleShots = 10000;
const maxScoreStats = 16;
const maxScores = 100;
const maxPublicScores = 25;
const maxPortAttempts = 20;
const runReceiptTtlMs = 6 * 60 * 60 * 1000;

const loadEnvFiles = () => {
  for (const filePath of envFilePaths) {
    if (!existsSync(filePath)) {
      continue;
    }

    const contents = readFileSync(filePath, "utf8");

    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const match = /^(?:export\s+)?([A-Z_][A-Z0-9_]*)=(.*)$/i.exec(trimmed);

      if (!match || process.env[match[1]] !== undefined) {
        continue;
      }

      process.env[match[1]] = parseEnvValue(match[2]);
    }
  }
};

const parseEnvValue = (value) => {
  const trimmed = value.trim();
  const quote = trimmed[0];

  if (
    (quote === "\"" || quote === "'") &&
    trimmed.endsWith(quote) &&
    trimmed.length >= 2
  ) {
    return trimmed.slice(1, -1);
  }

  const commentIndex = trimmed.indexOf(" #");

  return commentIndex >= 0 ? trimmed.slice(0, commentIndex).trim() : trimmed;
};

loadEnvFiles();

const preferredPort = Number.parseInt(process.env.PORT ?? "8787", 10);
const serverSecret =
  process.env.HIGH_SCORE_SECRET ?? `dev-secret-${process.pid}-${Date.now()}`;
const corsOrigin = process.env.CORS_ORIGIN ?? "";
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ogg": "audio/ogg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".woff2": "font/woff2",
};

const jsonState = {
  runs: [],
  scores: [],
};

let storePromise;

const getStore = async () => {
  storePromise ??= createStore();
  return storePromise;
};

const createStore = async () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    try {
      const pool = new Pool(createPostgresPoolConfig(databaseUrl));
      await pool.query("select 1");
      await ensurePostgresSchema(pool);
      console.log("High score API using PostgreSQL storage");
      return createPostgresStore(pool);
    } catch (error) {
      console.warn("PostgreSQL unavailable, falling back to JSON storage", error);
    }
  }

  await loadJsonState();
  console.log(`High score API using JSON storage at ${jsonStorePath}`);
  return createJsonStore();
};

const createPostgresPoolConfig = (databaseUrl) => {
  const config = { connectionString: databaseUrl };

  if (databaseUrlHasSslOptions(databaseUrl)) {
    return config;
  }

  const ssl = parseDatabaseSslFlag(process.env.DATABASE_SSL);

  if (ssl !== undefined) {
    config.ssl = ssl;
  }

  return config;
};

const databaseUrlHasSslOptions = (databaseUrl) => {
  try {
    const url = new URL(databaseUrl);

    return Array.from(url.searchParams.keys()).some((key) =>
      key.toLowerCase().startsWith("ssl")
    );
  } catch {
    return /[?&]ssl(?:mode|cert|key|rootcert)?=/i.test(databaseUrl);
  }
};

const parseDatabaseSslFlag = (value) => {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (["0", "false", "no", "off", "disable", "disabled"].includes(normalized)) {
    return false;
  }

  if (["strict", "verify", "verify-full"].includes(normalized)) {
    return { rejectUnauthorized: true };
  }

  if (["1", "true", "yes", "on", "require", "required"].includes(normalized)) {
    return { rejectUnauthorized: false };
  }

  return undefined;
};

const ensurePostgresSchema = async (pool) => {
  await pool.query(`
    create table if not exists time_pilot_high_score_runs (
      run_id text primary key,
      token_hash text not null,
      issued_at bigint not null,
      expires_at bigint not null,
      used boolean not null default false
    )
  `);
  await pool.query(`
    create table if not exists time_pilot_high_scores (
      id text primary key,
      created_at bigint,
      name text not null,
      score integer not null,
      settings jsonb,
      stats jsonb not null,
      game_version text not null,
      submitted_at bigint not null,
      received_at bigint not null,
      run_id text unique not null
    )
  `);
  await pool.query(
    "alter table time_pilot_high_scores add column if not exists created_at bigint"
  );
  await pool.query(
    "alter table time_pilot_high_scores add column if not exists settings jsonb"
  );
};

const createPostgresStore = (pool) => ({
  async createRun(run) {
    await pool.query(
      `insert into time_pilot_high_score_runs
        (run_id, token_hash, issued_at, expires_at, used)
        values ($1, $2, $3, $4, false)`,
      [run.runId, run.tokenHash, run.issuedAt, run.expiresAt]
    );
  },
  async saveScoreForRun(runId, tokenHash, now, score) {
    const client = await pool.connect();

    try {
      await client.query("begin");
      const result = await client.query(
        `update time_pilot_high_score_runs
          set used = true
          where run_id = $1
            and token_hash = $2
            and used = false
            and expires_at >= $3
          returning run_id, token_hash, issued_at, expires_at, used`,
        [runId, tokenHash, now]
      );
      const row = result.rows[0];

      if (!row) {
        await client.query("rollback");
        return null;
      }

      await client.query(
        `insert into time_pilot_high_scores
          (id, created_at, name, score, settings, stats, game_version, submitted_at, received_at, run_id)
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          on conflict (id) do nothing`,
        [
          score.id,
          score.createdAt,
          score.name,
          score.score,
          JSON.stringify(score.settings ?? null),
          JSON.stringify(score.stats),
          score.gameVersion,
          score.submittedAt,
          score.receivedAt,
          score.runId,
        ]
      );
      await client.query("commit");

      return {
        expiresAt: Number(row.expires_at),
        issuedAt: Number(row.issued_at),
        runId: row.run_id,
        tokenHash: row.token_hash,
        used: true,
      };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  },
  async listScores(limit = maxPublicScores) {
    const result = await pool.query(
      `select id, created_at, name, score, settings, stats, received_at
        from time_pilot_high_scores
        order by score desc, coalesce(created_at, received_at) asc
        limit $1`,
      [limit]
    );

    return result.rows.map((row) => ({
      createdAt: Number(row.created_at ?? row.received_at),
      id: row.id,
      name: row.name,
      receivedAt: Number(row.received_at),
      score: Number(row.score),
      settings: normalizeScoreSettings(row.settings),
      stats: row.stats,
    }));
  },
});

const loadJsonState = async () => {
  try {
    const data = JSON.parse(await readFile(jsonStorePath, "utf8"));

    jsonState.runs = Array.isArray(data.runs) ? data.runs : [];
    jsonState.scores = Array.isArray(data.scores) ? data.scores : [];
  } catch {
    jsonState.runs = [];
    jsonState.scores = [];
    await saveJsonState();
  }
};

const saveJsonState = async () => {
  await mkdir(dirname(jsonStorePath), { recursive: true });
  await writeFile(
    jsonStorePath,
    JSON.stringify(
      {
        runs: jsonState.runs.slice(-maxScores),
        scores: jsonState.scores
          .sort(sortScoreRecords)
          .slice(0, maxScores),
      },
      null,
      2
    )
  );
};

const createJsonStore = () => ({
  async createRun(run) {
    jsonState.runs.push(run);
    await saveJsonState();
  },
  async saveScoreForRun(runId, tokenHash, now, score) {
    const run = jsonState.runs.find((candidate) => candidate.runId === runId);

    if (
      !run ||
      run.used ||
      run.expiresAt < now ||
      !safeTokenEqual(run.tokenHash, tokenHash)
    ) {
      return null;
    }

    const previousScores = [...jsonState.scores];
    const previousUsed = run.used;

    try {
      if (!jsonState.scores.some((candidate) => candidate.id === score.id)) {
        jsonState.scores.push(score);
      }
      run.used = true;
      await saveJsonState();

      return run;
    } catch (error) {
      jsonState.scores = previousScores;
      run.used = previousUsed;
      throw error;
    }
  },
  async listScores(limit = maxPublicScores) {
    return jsonState.scores.sort(sortScoreRecords).slice(0, limit);
  },
});

const server = createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    if (request.method === "GET" && request.url === "/api/high-scores") {
      await handleListScores(response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/high-scores/runs") {
      await handleCreateRun(response);
      return;
    }

    if (request.method === "POST" && request.url === "/api/high-scores") {
      await handleSubmitScore(request, response);
      return;
    }

    if (request.method === "GET" || request.method === "HEAD") {
      await handleStaticRequest(request, response);
      return;
    }

    sendJson(response, 404, { error: "not_found" });
  } catch (error) {
    console.error("High score API error", error);
    sendJson(response, 500, { error: "server_error" });
  }
});

const handleStaticRequest = async (request, response) => {
  const filePath = getStaticFilePath(request.url ?? "/");

  if (!filePath) {
    sendJson(response, 404, { error: "not_found" });
    return;
  }

  try {
    const fileStat = await stat(filePath);

    if (!fileStat.isFile()) {
      sendJson(response, 404, { error: "not_found" });
      return;
    }

    response.writeHead(200, {
      "Cache-Control": getStaticCacheControl(filePath),
      "Content-Length": fileStat.size,
      "Content-Type": getContentType(filePath),
    });

    if (request.method === "HEAD") {
      response.end();
      return;
    }

    createReadStream(filePath)
      .on("error", (error) => {
        console.error("Static file response failed", error);

        if (!response.headersSent) {
          sendJson(response, 500, { error: "server_error" });
          return;
        }

        response.destroy(error);
      })
      .pipe(response);
  } catch {
    sendJson(response, 404, { error: "not_found" });
  }
};

const getStaticFilePath = (requestUrl) => {
  const url = new URL(requestUrl, "http://localhost");
  const pathname = decodeURIComponent(url.pathname);
  const routePath = getStaticRoutePath(pathname);
  const filePath = resolve(staticRootPath, routePath);

  return isStaticFilePath(filePath) ? filePath : undefined;
};

const getStaticRoutePath = (pathname) => {
  if (pathname === "/" || pathname === "") {
    return "index.html";
  }

  if (pathname === "/about" || pathname === "/about/") {
    return "about/index.html";
  }

  if (pathname === "/pwa" || pathname === "/pwa/") {
    return "pwa/index.html";
  }

  if (pathname === "/stories" || pathname === "/stories/") {
    return "stories/index.html";
  }

  if (pathname.endsWith("/")) {
    return `${pathname.slice(1)}index.html`;
  }

  return pathname.slice(1);
};

const isStaticFilePath = (filePath) =>
  filePath === staticRootPath || filePath.startsWith(`${staticRootPath}${sep}`);

const getContentType = (filePath) =>
  contentTypes[extname(filePath).toLowerCase()] ??
  "application/octet-stream";

const getStaticCacheControl = (filePath) =>
  filePath.includes(`${sep}assets${sep}`)
    ? "public, max-age=31536000, immutable"
    : "public, max-age=300";

const handleListScores = async (response) => {
  const store = await getStore();
  const scores = await store.listScores();

  sendJson(response, 200, scores.map(toPublicScore));
};

const handleCreateRun = async (response) => {
  const store = await getStore();
  const issuedAt = Date.now();
  const runId = randomUUID();
  const token = signRunToken(runId, issuedAt);

  await store.createRun({
    expiresAt: issuedAt + runReceiptTtlMs,
    issuedAt,
    runId,
    tokenHash: hashToken(token),
    used: false,
  });

  sendJson(response, 201, { issuedAt, runId, token });
};

const handleSubmitScore = async (request, response) => {
  const payload = await readJsonBody(request, response);

  if (payload === undefined) {
    return;
  }

  const validation = await validateScoreSubmission(payload);

  if (!validation.accepted) {
    sendJson(response, validation.status, { error: validation.error });
    return;
  }

  const receivedAt = Date.now();
  const scoreRecord = {
    ...validation.score,
    createdAt: receivedAt,
    gameVersion: validation.gameVersion,
    receivedAt,
    runId: validation.run.runId,
    submittedAt: validation.submittedAt,
  };
  const store = await getStore();
  const storedRun = await store.saveScoreForRun(
    validation.run.runId,
    hashToken(validation.run.token),
    receivedAt,
    scoreRecord
  );

  if (!storedRun) {
    sendJson(response, 401, { error: "invalid_run_receipt" });
    return;
  }

  sendJson(response, 201, toPublicScore(scoreRecord));
};

const validateScoreSubmission = async (payload) => {
  if (!payload || typeof payload !== "object") {
    return reject("invalid_payload");
  }

  const { entry, gameVersion, integrity, run, submittedAt } = payload;

  if (!isPublicScore(entry) || typeof submittedAt !== "number") {
    return reject("invalid_score");
  }

  if (!isRunReceipt(run)) {
    return reject("missing_run_receipt", 401);
  }

  if (!isValidHighScoreIntegrity(entry, integrity, run, submittedAt)) {
    return reject("invalid_score_integrity", 422);
  }

  if (!isPlausibleScore(entry)) {
    return reject("implausible_score", 422);
  }

  return {
    accepted: true,
    gameVersion:
      typeof gameVersion === "string" && gameVersion.length <= 32
        ? gameVersion
        : "unknown",
    run,
    score: {
      id: randomUUID(),
      name: normalizeName(entry.name),
      score: Math.max(0, Math.floor(entry.score)),
      settings: normalizeScoreSettings(entry.settings),
      stats: entry.stats.slice(0, maxScoreStats),
    },
    submittedAt: Math.max(0, Math.floor(submittedAt)),
  };
};

const isPlausibleScore = (entry) => {
  if (entry.score <= 0 || entry.score > 10000000) {
    return false;
  }

  const parsed = parseStats(entry.stats);

  if (parsed.shotsHit > parsed.shotsFired) {
    return false;
  }

  if (parsed.accuracy > maxPlausibleAccuracy) {
    return false;
  }

  const scoreBudget =
    250000 +
    parsed.enemies * 25000 +
    parsed.bonuses * 10000 +
    parsed.bosses * 75000 +
    parsed.levels * 150000;

  return entry.score <= Math.max(scoreBudget, 500000);
};

const parseStats = (stats) => {
  const joined = stats.join("\n");
  const shots = /Shots:\s*(\d+)\/(\d+)/i.exec(joined);

  return {
    accuracy: readNumberStat(joined, "Accuracy"),
    bonuses: readNumberStat(joined, "Bonuses", 0, maxPlausibleBonuses),
    bosses: readNumberStat(joined, "Bosses", 0, maxPlausibleBosses),
    enemies: readNumberStat(joined, "Enemies", 0, maxPlausibleEnemies),
    levels: readNumberStat(joined, "Era", 1, maxGameEra),
    shotsFired: shots
      ? clampNumber(Number.parseInt(shots[2], 10), 0, maxPlausibleShots)
      : 0,
    shotsHit: shots
      ? clampNumber(Number.parseInt(shots[1], 10), 0, maxPlausibleShots)
      : 0,
  };
};

const readNumberStat = (text, label, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const match = new RegExp(`${label}:\\s*(\\d+)`, "i").exec(text);

  return match ? clampNumber(Number.parseInt(match[1], 10), min, max) : 0;
};

const clampNumber = (value, min, max) => {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, value));
};

const isValidHighScoreIntegrity = (entry, integrity, run, submittedAt) => {
  if (!isHighScoreIntegrity(integrity)) {
    return false;
  }

  const expectedScoreProduct =
    Math.max(0, Math.floor(entry.score)) * integrity.multiplier;
  const expectedStatsProduct =
    (hashText(entry.stats.join("\n")) % highScoreIntegrityHashModulo) *
    integrity.multiplier;

  return (
    integrity.scoreProduct === expectedScoreProduct &&
    integrity.statsProduct === expectedStatsProduct &&
    integrity.checksum ===
      createHighScoreIntegrityChecksum(
        entry,
        run,
        submittedAt,
        integrity.multiplier,
        integrity.scoreProduct,
        integrity.statsProduct
      )
  );
};

const isHighScoreIntegrity = (value) => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    value.version === highScoreIntegrityVersion &&
    Number.isInteger(value.multiplier) &&
    value.multiplier >= highScoreIntegrityMinMultiplier &&
    value.multiplier <
      highScoreIntegrityMinMultiplier + highScoreIntegrityMultiplierRange &&
    Number.isInteger(value.scoreProduct) &&
    Number.isInteger(value.statsProduct) &&
    typeof value.checksum === "string"
  );
};

const createHighScoreIntegrityChecksum = (
  entry,
  run,
  submittedAt,
  multiplier,
  scoreProduct,
  statsProduct
) =>
  hashText(
    [
      highScoreIntegrityVersion,
      run.runId,
      run.token,
      run.issuedAt,
      entry.id,
      entry.name,
      Math.max(0, Math.floor(entry.score)),
      formatScoreSettingsForIntegrity(entry.settings),
      entry.stats.join("\n"),
      submittedAt,
      multiplier,
      scoreProduct,
      statsProduct,
    ].join("|")
  ).toString(36);

const hashText = (text) => {
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

export const __testHooks = {
  isPlausibleScore,
  parseStats,
};

const readJsonBody = async (request, response) => {
  let body = "";

  for await (const chunk of request) {
    body += chunk;

    if (body.length > maxBodyBytes) {
      throw new Error("Request body too large");
    }
  }

  try {
    return JSON.parse(body || "{}");
  } catch {
    sendJson(response, 400, { error: "invalid_json" });
    return undefined;
  }
};

const sendJson = (response, status, body) => {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
};

const setCorsHeaders = (response) => {
  if (!corsOrigin) {
    return;
  }

  response.setHeader("Access-Control-Allow-Origin", corsOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const signRunToken = (runId, issuedAt) =>
  createHmac("sha256", serverSecret)
    .update(`${runId}:${issuedAt}`)
    .digest("base64url");

const hashToken = (token) =>
  createHmac("sha256", serverSecret).update(token).digest("base64url");

const safeTokenEqual = (left, right) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
};

const isRunReceipt = (value) =>
  !!value &&
  typeof value === "object" &&
  typeof value.runId === "string" &&
  typeof value.token === "string" &&
  typeof value.issuedAt === "number";

const isPublicScore = (value) =>
  !!value &&
  typeof value === "object" &&
  (value.createdAt === undefined || typeof value.createdAt === "number") &&
  typeof value.name === "string" &&
  typeof value.score === "number" &&
  (value.settings === undefined || normalizeScoreSettings(value.settings)) &&
  Array.isArray(value.stats) &&
  value.stats.length <= maxScoreStats &&
  value.stats.every((stat) => typeof stat === "string" && stat.length <= 80);

const toPublicScore = (score) => ({
  createdAt: score.createdAt ?? score.receivedAt,
  id: score.id,
  name: normalizeName(score.name),
  receivedAt: score.receivedAt,
  score: Math.max(0, Math.floor(score.score)),
  ...(score.settings ? { settings: normalizeScoreSettings(score.settings) } : {}),
  stats: score.stats.slice(0, maxScoreStats),
});

const normalizeScoreSettings = (value) => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const gameSpeed =
    typeof value.gameSpeed === "number" && Number.isFinite(value.gameSpeed)
      ? value.gameSpeed
      : 1;
  const renderFps =
    value.renderFps === "max" ||
    (typeof value.renderFps === "number" && Number.isFinite(value.renderFps))
      ? value.renderFps
      : "max";

  return { gameSpeed, renderFps };
};

const formatScoreSettingsForIntegrity = (settings) =>
  settings
    ? JSON.stringify({
      gameSpeed: settings.gameSpeed,
      renderFps: settings.renderFps,
    })
    : "";

const normalizeName = (name) => {
  const normalized = name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 .'_-]/gi, "")
    .slice(0, 16);

  return normalized || "PILOT";
};

const sortScoreRecords = (left, right) =>
  right.score - left.score ||
  (left.createdAt ?? left.receivedAt) - (right.createdAt ?? right.receivedAt);

const reject = (error, status = 400) => ({
  accepted: false,
  error,
  status,
});

const getListenPort = () =>
  Number.isInteger(preferredPort) && preferredPort >= 0 ? preferredPort : 8787;

const writeApiRuntimeFile = async (activePort) => {
  try {
    await mkdir(dirname(apiRuntimeFilePath), { recursive: true });
    await writeFile(
      apiRuntimeFilePath,
      JSON.stringify(
        {
          port: activePort,
          updatedAt: Date.now(),
          url: `http://localhost:${activePort}`,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.warn("Unable to write high score API runtime file", error);
  }
};

const listen = (nextPort, attemptsRemaining = maxPortAttempts) => {
  const onError = (error) => {
    server.off("listening", onListening);

    if (error.code === "EADDRINUSE" && nextPort > 0 && attemptsRemaining > 0) {
      const fallbackPort = nextPort + 1;

      console.warn(
        `High score API port ${nextPort} is busy; trying ${fallbackPort}`
      );
      listen(fallbackPort, attemptsRemaining - 1);
      return;
    }

    console.error("High score API failed to start", error);
    process.exitCode = 1;
  };

  const onListening = () => {
    server.off("error", onError);
    const address = server.address();
    const activePort =
      typeof address === "object" && address !== null ? address.port : nextPort;

    void writeApiRuntimeFile(activePort);
    console.log(`High score API listening on http://localhost:${activePort}`);
  };

  server.once("error", onError);
  server.once("listening", onListening);
  server.listen(nextPort);
};

listen(getListenPort());

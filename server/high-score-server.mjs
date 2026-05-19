/* global Buffer, console, process */

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonStorePath = resolve(__dirname, "../data/high-scores.json");
const maxBodyBytes = 64 * 1024;
const maxScoreStats = 12;
const maxScores = 100;
const maxPublicScores = 25;
const runReceiptTtlMs = 6 * 60 * 60 * 1000;
const port = Number.parseInt(process.env.PORT ?? "8787", 10);
const serverSecret =
  process.env.HIGH_SCORE_SECRET ?? `dev-secret-${process.pid}-${Date.now()}`;
const corsOrigin = process.env.CORS_ORIGIN ?? "";

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
      const pool = new Pool({ connectionString: databaseUrl });
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
          (id, created_at, name, score, stats, game_version, submitted_at, received_at, run_id)
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          on conflict (id) do nothing`,
        [
          score.id,
          score.createdAt,
          score.name,
          score.score,
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
      `select id, created_at, name, score, stats, received_at
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

    sendJson(response, 404, { error: "not_found" });
  } catch (error) {
    console.error("High score API error", error);
    sendJson(response, 500, { error: "server_error" });
  }
});

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
  const payload = await readJsonBody(request);
  const validation = await validateScoreSubmission(payload);

  if (!validation.accepted) {
    sendJson(response, validation.status, { error: validation.error });
    return;
  }

  const receivedAt = Date.now();
  const scoreRecord = {
    ...validation.score,
    createdAt: validation.createdAt,
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

  const { entry, gameVersion, run, submittedAt } = payload;

  if (!isPublicScore(entry) || typeof submittedAt !== "number") {
    return reject("invalid_score");
  }

  if (!isRunReceipt(run)) {
    return reject("missing_run_receipt", 401);
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
      stats: entry.stats.slice(0, maxScoreStats),
    },
    createdAt: Math.max(0, Math.floor(entry.createdAt ?? submittedAt)),
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

  if (parsed.accuracy > 100) {
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
    bonuses: readNumberStat(joined, "Bonuses"),
    bosses: readNumberStat(joined, "Bosses"),
    enemies: readNumberStat(joined, "Enemies"),
    levels: readNumberStat(joined, "Era"),
    shotsFired: shots ? Number.parseInt(shots[2], 10) : 0,
    shotsHit: shots ? Number.parseInt(shots[1], 10) : 0,
  };
};

const readNumberStat = (text, label) => {
  const match = new RegExp(`${label}:\\s*(\\d+)`, "i").exec(text);

  return match ? Number.parseInt(match[1], 10) : 0;
};

const readJsonBody = async (request) => {
  let body = "";

  for await (const chunk of request) {
    body += chunk;

    if (body.length > maxBodyBytes) {
      throw new Error("Request body too large");
    }
  }

  return JSON.parse(body || "{}");
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
  Array.isArray(value.stats) &&
  value.stats.length <= 12 &&
  value.stats.every((stat) => typeof stat === "string" && stat.length <= 80);

const toPublicScore = (score) => ({
  createdAt: score.createdAt ?? score.receivedAt,
  id: score.id,
  name: normalizeName(score.name),
  receivedAt: score.receivedAt,
  score: Math.max(0, Math.floor(score.score)),
  stats: score.stats.slice(0, maxScoreStats),
});

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

server.listen(port, () => {
  console.log(`High score API listening on http://localhost:${port}`);
});

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import packageJson from "./package.json" with { type: "json" };
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
const apiRuntimeFilePath = path.resolve(dirname, ".time-pilot/high-score-api.json");
const defaultHighScoreApiUrl = "http://localhost:8787";
const apiPortScanStart = 8787;
const apiPortScanAttempts = 20;

const getHighScoreApiUrl = (): string => {
  if (process.env.HIGH_SCORE_API_URL) {
    return process.env.HIGH_SCORE_API_URL;
  }

  try {
    const runtime = JSON.parse(
      readFileSync(apiRuntimeFilePath, "utf8")
    ) as Partial<{ url: string }>;

    if (typeof runtime.url === "string" && runtime.url.startsWith("http")) {
      return runtime.url;
    }
  } catch {
    // The API server writes this file once it starts; use the default before then.
  }

  return defaultHighScoreApiUrl;
};

const getHighScoreApiCandidates = (): string[] => {
  const urls = new Set<string>([getHighScoreApiUrl(), defaultHighScoreApiUrl]);

  for (let offset = 0; offset < apiPortScanAttempts; offset += 1) {
    urls.add(`http://localhost:${apiPortScanStart + offset}`);
  }

  return [...urls];
};

const readRequestBody = async (
  request: import("node:http").IncomingMessage
): Promise<Buffer | undefined> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
};

const createProxyHeaders = (
  request: import("node:http").IncomingMessage
): Headers => {
  const headers = new Headers();

  Object.entries(request.headers).forEach(([key, value]) => {
    if (key.toLowerCase() === "host" || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => headers.append(key, entry));
      return;
    }

    headers.set(key, value);
  });

  return headers;
};

const isLikelyApiResponse = (response: Response): boolean => {
  const contentType = response.headers.get("content-type") ?? "";

  return response.status !== 404 && contentType.includes("application/json");
};

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  define: {
    __TIME_PILOT_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    {
      name: "time-pilot-html-version",
      transformIndexHtml: (html) =>
        html.replaceAll("%TIME_PILOT_VERSION%", packageJson.version),
    },
    {
      name: "time-pilot-api-proxy",
      configureServer: (server) => {
        server.middlewares.use(async (request, response, next) => {
          if (!request.url?.startsWith("/api/")) {
            next();
            return;
          }

          const body = await readRequestBody(request);
          const headers = createProxyHeaders(request);

          try {
            let proxiedResponse: Response | null = null;

            for (const candidate of getHighScoreApiCandidates()) {
              try {
                const candidateResponse = await fetch(new URL(request.url, candidate), {
                  body,
                  headers,
                  method: request.method,
                  redirect: "manual",
                });

                if (isLikelyApiResponse(candidateResponse)) {
                  proxiedResponse = candidateResponse;
                  break;
                }
              } catch {
                proxiedResponse = null;
              }
            }

            if (!proxiedResponse) {
              throw new Error("High score API unavailable");
            }

            response.statusCode = proxiedResponse.status;
            proxiedResponse.headers.forEach((value, key) => {
              response.setHeader(key, value);
            });
            response.end(Buffer.from(await proxiedResponse.arrayBuffer()));
          } catch {
            response.statusCode = 502;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ error: "api_unavailable" }));
          }
        });
      },
    },
    react(),
  ],
  build: {
    rollupOptions: {
      input: {
        about: path.resolve(dirname, "about/index.html"),
        main: path.resolve(dirname, "index.html"),
        pwa: path.resolve(dirname, "pwa/index.html"),
      },
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.names.some((name) => name.endsWith(".css"))
            ? "assets/app.css"
            : "assets/[name][extname]",
        chunkFileNames: "assets/[name].js",
        entryFileNames: "assets/app.js",
      },
    },
  },
  resolve: {
    alias: {
      "@time-pilot/arcade-engine": path.resolve(
        dirname,
        "packages/arcade-engine/src/index.ts"
      ),
    },
  },
  server: {
    host: "0.0.0.0",
    open: true,
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          environment: "jsdom",
          globals: true,
          setupFiles: ["src/test/setup.ts"],
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
    ],
  },
});

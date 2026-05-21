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

const readRequestBody = async (
  request: import("node:http").IncomingMessage
): Promise<Buffer | undefined> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
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

          try {
            const targetUrl = new URL(request.url, getHighScoreApiUrl());
            const body = await readRequestBody(request);
            const proxiedResponse = await fetch(targetUrl, {
              body,
              headers: request.headers as HeadersInit,
              method: request.method,
              redirect: "manual",
            });

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

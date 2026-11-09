/**
 * Development only: keep the Python API (port 8000) running for as long as the Next.js dev server
 * runs, however the dev server was started (`npm run dev`, `next dev`, an IDE button…).
 *
 * - On start: if nothing is on port 8000, start uvicorn and wait until it accepts connections.
 * - Watchdog: every few seconds, if port 8000 is empty (the API crashed, or an API started elsewhere
 *   was closed), start it again. After repeated crashes it stops trying and says why.
 *
 * In production on Vercel the API is a separate Python function, so none of this runs there.
 */
import { spawn, type ChildProcess } from "child_process";
import { existsSync } from "fs";
import net from "net";
import path from "path";

const API_PORT = 8000;
const STARTUP_TIMEOUT_MS = 30_000;
const WATCH_EVERY_MS = 4_000;
const MAX_RESTARTS = 5;
const PREFIX = "\x1b[36m[api]\x1b[0m ";

interface DevApiState {
  child: ChildProcess | null;
  watchdog: NodeJS.Timeout | null;
  restarts: number;
  starting: boolean;
}

declare global {
  // Survives hot reloads, so there is one API and one watchdog per dev server process.
  var __fishyDevApi: DevApiState | undefined;
}

function portInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: "127.0.0.1" });
    socket.setTimeout(1500, () => { socket.destroy(); resolve(false); });
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("error", () => resolve(false));
  });
}

function relay(stream: NodeJS.ReadableStream | null, out: NodeJS.WriteStream): void {
  let buffer = "";
  stream?.on("data", (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) out.write(PREFIX + line + "\n");
  });
}

function pythonPath(): string | null {
  const python = path.join(process.cwd(), "..", ".venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
  return existsSync(python) ? python : null;
}

async function waitUntilListening(child: ChildProcess): Promise<boolean> {
  const started = Date.now();
  while (child.exitCode === null && Date.now() - started < STARTUP_TIMEOUT_MS) {
    if (await portInUse(API_PORT)) {
      console.log(`${PREFIX}ready on http://127.0.0.1:${API_PORT} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
      return true;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

async function startApi(state: DevApiState, reason: string): Promise<void> {
  if (state.starting || (state.child && state.child.exitCode === null)) return;
  const python = pythonPath();
  if (!python) {
    console.error(`${PREFIX}can't start: the project's Python environment (..\\.venv) is missing. See webapp/README.md.`);
    return;
  }
  state.starting = true;
  console.log(`${PREFIX}${reason}`);
  const child = spawn(python,
    ["-m", "uvicorn", "index:app", "--app-dir", "api", "--host", "127.0.0.1", "--port", String(API_PORT)],
    { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });
  state.child = child;
  relay(child.stdout, process.stdout);
  relay(child.stderr, process.stderr);
  child.on("exit", (code) => {
    if (state.child === child) state.child = null;
    if (code) console.error(`${PREFIX}stopped (exit code ${code}).`);
  });
  const ok = await waitUntilListening(child);
  state.starting = false;
  if (!ok && child.exitCode === null) {
    console.warn(`${PREFIX}still not accepting connections after ${STARTUP_TIMEOUT_MS / 1000}s.`);
  }
}

function startWatchdog(state: DevApiState): void {
  if (state.watchdog) return;
  state.watchdog = setInterval(async () => {
    if (state.starting || (state.child && state.child.exitCode === null)) return;
    if (await portInUse(API_PORT)) return;
    if (state.restarts >= MAX_RESTARTS) {
      console.error(`${PREFIX}gave up after ${MAX_RESTARTS} restarts. Fix the error above, then restart \`npm run dev\`.`);
      if (state.watchdog) clearInterval(state.watchdog);
      return;
    }
    state.restarts += 1;
    await startApi(state, `port ${API_PORT} is empty, starting the Python API again (${state.restarts}/${MAX_RESTARTS})`);
  }, WATCH_EVERY_MS);
  state.watchdog.unref();   // never keeps the dev server alive on its own
}

export async function ensureDevApi(): Promise<void> {
  if (globalThis.__fishyDevApi) return;
  const state: DevApiState = { child: null, watchdog: null, restarts: 0, starting: false };
  globalThis.__fishyDevApi = state;

  const stop = () => { if (state.child && state.child.exitCode === null) state.child.kill(); };
  process.once("exit", stop);
  process.once("SIGINT", () => { stop(); process.exit(0); });
  process.once("SIGTERM", () => { stop(); process.exit(0); });

  if (await portInUse(API_PORT)) {
    console.log(`${PREFIX}using the API already running on http://127.0.0.1:${API_PORT}`);
  } else {
    await startApi(state, `starting the Python API on http://127.0.0.1:${API_PORT}`);
  }
  startWatchdog(state);
}

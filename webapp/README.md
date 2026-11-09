# Fishy – web app (Member 4)

Fishy checks whether a link or message is phishing. Two machine-learning models built by the team score it,
the site explains why, and dangerous links are blocked in the visitor's browser.

- **Frontend:** Next.js 15 (App Router, TypeScript), Tailwind CSS 4, `motion` for scroll animation, React Bits
  `Grainient` for the animated background.
- **Backend:** one Python function (FastAPI) at `api/index.py`, deployed by Vercel next to the site.
- **Models:** copied from the member folders by `scripts/sync_models.py`. Model A = Member 2's Random Forest on
  30 URL features. Model B = Member 3's TF-IDF character n-grams + Logistic Regression.

## How a link is scored

1. The input is validated (`api/fishy/normalize.py`). Fishy never visits the link.
2. Model A and Model B each give a probability. **Risk = their average × 100.**
3. 0–39 Safe, 40–69 Suspicious (warning), 70+ Dangerous (blocked automatically).
4. Hosts on a short trusted list (`api/fishy/allowlist.py`) are shown as Safe. This exists because Model B flags
   bare homepages such as google.com (see Member 3's README). Matching is on the registered domain, so
   `paypal.com.evil.ru` is not trusted, and user-content hosts like `docs.google.com` never are.
5. The reasons shown under a result (`api/fishy/explain.py`) are plain rules. They explain the address; they do
   not change the score.

Blocklist, history and alerts are stored only in the visitor's browser (`lib/protectionStore.ts`).

## Every number on the site has a source

`data/metrics.json` and `data/example-result.json` are generated, never typed by hand:

```
python webapp/scripts/build_metrics.py      # from the project root, ~1-2 minutes
```

It reads Member 2 and Member 3's result CSVs and runs the cross-dataset check (each model scored on links neither
model saw in training, threshold 0.5).

## Run locally

From the project root (`D:\375 Project`), with the project virtual environment:

First time only:

```
.venv\Scripts\python -m pip install -r requirements.txt fastapi uvicorn httpx pytest pytest-cov
.venv\Scripts\python webapp\scripts\sync_models.py
cd webapp
npm install
```

Then, every time:

```
cd webapp
npm run dev          # open http://localhost:3000, Ctrl+C stops everything
```

The dev server starts the Python API (port 8000) by itself (`instrumentation.ts` → `lib/devApi.ts`) and waits
until it is ready, however the dev server is launched. Lines from the API are prefixed `[api]`. If something is
already listening on 8000, it is reused. In development, `/api/py/*` is forwarded to `http://127.0.0.1:8000`
(see `next.config.ts`).

### Troubleshooting

- **The log has no `[api]` lines, or shows `ECONNREFUSED 127.0.0.1:8000`:** an old dev server is still running
  (often from another terminal). See what is running, then stop it:

  ```powershell
  Get-CimInstance Win32_Process | ? { $_.CommandLine -match '375 Project\\webapp|uvicorn index' } | select ProcessId, CreationDate, CommandLine
  Get-CimInstance Win32_Process | ? { $_.CommandLine -match '375 Project\\webapp|uvicorn index' } | % { Stop-Process -Id $_.ProcessId }
  ```

- **`ENOENT ... .next\server\...`:** the build cache is damaged. Stop the dev server, delete the `.next` folder,
  run `npm run dev` again.
- If the API crashes while the site is running, a watchdog restarts it within a few seconds (look for
  `[api] port 8000 is empty, starting the Python API again`).

## Tests

| Suite | Command (from `webapp/`) | What it covers |
|---|---|---|
| Backend | `..\.venv\Scripts\python -m pytest tests/api --cov=api` | input checks, trusted list, reasons, message parsing, API routes, rate limit, **parity with the members' own models** |
| Unit | `npx vitest run` | browser store, exports, API client errors, formatting, content matches metrics.json |
| End to end | start the API (`npm run dev:api`), build with `NEXT_DIST_DIR=.next-e2e FISHY_API_ORIGIN=http://127.0.0.1:8000 npx next build`, serve it with `NEXT_DIST_DIR=.next-e2e npx next start -p 3456`, then `E2E_BASE_URL=http://127.0.0.1:3456 npx playwright test` | real flows in Microsoft Edge, desktop and mobile: blocking, undo, warning dialog, message tab, errors, keyboard, exports, no clipped content, reduced motion |

## Deploy to Vercel

1. Push this repository to GitHub.
2. On vercel.com: **Add New → Project → import the repo**, set **Root Directory = `webapp`**, keep the
   Next.js preset, deploy.
3. Check `https://<your-site>/api/py/health` returns `"models_loaded": true`, then try the four example links.

`requirements.txt` in this folder pins `scikit-learn==1.9.1`, the version the models were saved with.

## Loading screen

An angler animation (`public/loader/angler.svg`, an animated SVG exported from After Effects) stands on a jetty over a
teal lake drawn in CSS (`components/loader/`, `app/loader.css`). It appears in two places:

- **First-visit intro** (`IntroSplash.tsx`): covers the page for about 2.4 seconds once per browser session while the
  models wake up, then lifts away by itself. Any click or key press skips it. The page is fully rendered underneath.
- **While a link or message is checked** (`StatusViews.tsx`): when the answer arrives, the catch matches the verdict
  (`lib/catchSequence.ts`): a phish for Dangerous, a nibbling fish for Suspicious, an old boot for Safe. It shows for
  1.3 seconds, or until Escape or a click.

Visitors who prefer reduced motion get no intro, a still picture (`angler-still.svg`) and the result straight away.
To replace the animation: `node scripts/make_loader_svgs.mjs <file.svg>` (writes both the animated and still copies).

## Accessibility and motion

Keyboard and screen-reader friendly (real buttons, tabs with arrow keys, native `<dialog>` and `<details>`,
skip link, visible focus). All animation turns off when the visitor's device asks for reduced motion.

## Generative-AI declaration

This web app's code and copy were written with Claude (Anthropic) and reviewed by Member 4. The models it uses
were built by Members 2 and 3; see their folders and the group report.

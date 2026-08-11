# Aurora Ops — Console

The front end for Aurora Ops: a console for running LLM agents against real machines,
watching them reason, and reading what they found.

Next.js 16 (App Router, Turbopack) + Tailwind v4 + framer-motion. It talks to
[`it-ops-hub`](../it-ops-hub), which is where the agents actually live.

## Running it

```bash
npm install
npm run dev            # http://localhost:3000
```

The backend needs to be running on `http://localhost:8000` for anything to return data.
The UI renders fine without it — every page degrades to an empty state rather than
breaking.

```bash
npm run build && npm start   # production build
```

## The pages

| Route | What it is |
|---|---|
| `/` | Landing page — what the fleet is and how it works |
| `/run` | The console. Pick an agent from the tendril scene, drive it from the chat rail, watch the reasoning trace, read the verdict |
| `/run?tab=orchestrator` | Same console, but you describe a symptom and it picks the specialist for you |
| `/auto-remediate` | The diagnose → decide → act → verify chain, with a live workflow chart |
| `/activity` | Every run recorded — who triggered it, which agent acted, what happened |
| `/agents` | The whole fleet, live and standby |
| `/hosts` | Machines being watched; add one by SSH or by generating an install command |
| `/login` | Sign in / create a workspace |

## Scripts worth knowing

These drive a real headless Chrome (via `playwright-core`, which downloads no browser —
it uses the Chrome already installed). The in-app browser pane never composites frames,
so screenshots and any motion work have to go through these.

```bash
npm run shoot <url> <outDir>     # scroll-capture a page, and dump its measured design tokens
npm run shoot <url> --shot f.png # one clean 2x capture with site chrome hidden
npm run audit                    # every route at desktop + mobile: console errors, failed
                                 # requests, sideways scroll, oversized images, tiny text
node scripts/check-overflow.mjs  # fails if any route scrolls sideways at any common width
```

Asset preparation, re-runnable if you swap a source image:

```bash
node scripts/extract-robot.mjs        # lifts the mascot out of its generated banner and grades it
node scripts/prep-constellation.mjs   # repairs the backdrop's watermark by cloning donor sky
```

## Notes for anyone picking this up

- **Read `node_modules/next/dist/docs/` before writing routing code.** This is Next 16;
  middleware is now `proxy.ts`, and several conventions differ from older tutorials.
- The design follows one reference (OrbitAI), rebuilt section by section. Adding a new
  visual language to a page is usually the wrong move — match what is there.
- If every route but `/` starts 404ing with no compile log, it is a stale Turbopack route
  manifest. Delete `.next` and restart; it is not a code bug.
- `screenshots/` is gitignored — it is working output, regenerable from the scripts above.

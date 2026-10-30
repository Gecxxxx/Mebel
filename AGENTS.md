# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Approved project direction

The user selected displayed option 1 on 28 October 2026. Exact visual source: `../design-directions-2026-10-28/direction-1.png` (946 × 1663). Preserve the charcoal/gold palette, refined serif typography, split hero, three-column service strip, asymmetric project imagery and showroom invitation. Use real supplied furniture photographs and the existing crest until new identity assets arrive.

This is a family business working with partner factories, not its own manufacturer. Never claim own production, invent deadlines, warranties or free delivery. Current facts are in `../client-materials-2026-10-28/project-decisions.txt`. The generated materials still life must be labelled as illustration; it is not a real showroom photo. Exclude the former employee with a bob haircut.

Current scope is a responsive local frontend prototype. No deployment or automatic messages. The consultation form prepares a message for the user to copy into the existing Telegram conversation and does not claim delivery. Keep behaviour honest. No additional routes or backend unless requested.

On 30 October 2026 the user authorized uploading this project to `Gecxxxx/Mebel` and publishing a public website through GitHub Pages. This supersedes the previous local-only deployment scope. Keep the repository's existing visibility unless the user explicitly approves changing it. Publish only the website source and its used assets; do not upload internal client correspondence, audit folders or credentials. GitHub Pages is served under `/Mebel/`, so image paths must use `import.meta.env.BASE_URL`. Preserve the ordinary root-domain build as well.

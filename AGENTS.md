# Prioritet website development

Use Node.js 24 and the checked-in lockfile. Run `npm ci` before development.

## Design and content

Preserve the approved charcoal and gold palette, serif headings, split hero, asymmetric project grid and responsive layouts. Use the supplied real furniture photographs. The generated materials still life must remain labelled as an illustration. The current crest is temporary and can be replaced when final brand assets arrive.

This is a furniture atelier working with partner factories. Do not invent claims about owning a factory, prices, free delivery, deadlines or guarantees. Keep phone numbers, addresses and schedules accurate.

The consultation form prepares a message for the visitor to copy and send. Do not show a sent-success state unless an actual delivery integration is connected. Do not add backend services or new routes without an explicit request.

## Build and publication

The owner approved the public `Gecxxxx/Mebel` repository and GitHub Pages publication on 30 October 2026. The public site is served under `/Mebel/`. Asset paths must use `import.meta.env.BASE_URL`; preserve compatibility with the ordinary root-domain build.

Run `npm run build:pages` and `npm run test:sites` before pushing. The `Publish website` workflow publishes `dist/client` after a push to `main`, and also supports manual dispatch. Check the deployed site after publication.

Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs` and `tests/sites-worker.test.mjs` compatible with the original Sites-ready template. Never commit credentials, environment files, internal client correspondence, dependencies or build output.

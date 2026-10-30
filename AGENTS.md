# Prioritet website development

Use Node.js 24 and the checked-in lockfile. Run `npm ci` before development.

## Design and content

Preserve the approved charcoal and gold palette, typographic hierarchy, split hero, asymmetric project grid and responsive layouts. Use the supplied real furniture photographs. The generated materials still life must remain labelled as an illustration. The current crest is temporary and can be replaced when final brand assets arrive.

This is a furniture atelier working with partner factories. Do not invent claims about owning a factory, prices, free delivery, deadlines or guarantees. Keep phone numbers, addresses and schedules accurate.

The consultation form prepares a message for the visitor to copy and send. Do not show a sent-success state unless an actual delivery integration is connected. Do not add backend services or new routes without an explicit request.

## Build and publication

The owner approved the public `Gecxxxx/Mebel` repository and GitHub Pages publication on 30 October 2026. The public site is served under `/Mebel/`. Asset paths must use `import.meta.env.BASE_URL`; preserve compatibility with the ordinary root-domain build.

Run `npm run build:pages` and `npm run test:sites` before pushing. The `Publish website` workflow publishes `dist/client` after a push to `main`, and also supports manual dispatch. Check the deployed site after publication.

Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs` and `tests/sites-worker.test.mjs` compatible with the original Sites-ready template. Never commit credentials, environment files, internal client correspondence, dependencies or build output.

## Approved multipage extension

The owner approved the proposed multipage structure and its implementation on 30 October 2026. The site now uses Astro static pages with React islands, preserving the existing approved design and protected Sites packaging. Run `npm run test:static` after the Pages build as well as `test:sites`.

Centralized content lives in `src/data/`. Each product and project must have standalone rendered HTML. Preserve `/Mebel/` asset and link prefixes in Pages builds and ordinary root paths in root builds. Do not reintroduce a client-only router fallback.

Imported model prices are historical reference values, not verified current offers. Never claim current stock from the old export. The dining-group collection contains individual tables and chairs: clearly state that displayed prices are for individual items and the complete set is agreed separately. Exclude unreviewed Copy cards and do not invent missing project photographs.

This is a demonstration frontend for review. Keep `noindex,follow` until a deliberate production-domain launch. A CMS, production lead storage and payment integration are not connected; never imply otherwise in the UI. Do not put inquiry data or integration secrets into static files or the public repository.

## Latest typography preference

On 30 October 2026 the user explicitly rejected the previous fonts and the homepage headline overlapping its photograph. Use locally hosted Onest for headings and Golos Text for body/UI, with the shared tokens in `src/typography.css`. This supersedes the original serif direction. Hero heading, description and actions must wrap inside the text column with a visible right gutter. Never restore nowrap, oversized text widths or intentional text overlap onto the photo. Let the headline wrap naturally rather than using hard line breaks.

# Prioritet website development

Use Node.js 24 and the checked-in lockfile. Run `npm ci` before development.

## Design and content

Preserve the approved charcoal and gold palette, typographic hierarchy, split hero, asymmetric project grid and responsive layouts. Use the supplied real furniture photographs. The generated materials still life must remain labelled as an illustration. The current crest is temporary and can be replaced when final brand assets arrive.

This is a furniture atelier working with partner factories. Do not invent claims about owning a factory, prices, free delivery, deadlines or guarantees. Keep phone numbers, addresses and schedules accurate.

The owner explicitly requested server-side lead delivery on 4 November 2026. Forms and the five-question quiz now post to the separate Sites lead service. Show acceptance only after actual server persistence; show delivery only when its API confirms delivery. Never expose tokens or subscription credentials in frontend code.

## Build and publication

The owner approved the public `Gecxxxx/Mebel` repository and GitHub Pages publication on 30 October 2026. The public site is served under `/Mebel/`. Asset paths must use `import.meta.env.BASE_URL`; preserve compatibility with the ordinary root-domain build.

Run `npm run build:pages` and `npm run test:sites` before pushing. The `Publish website` workflow publishes `dist/client` after a push to `main`, and also supports manual dispatch. Check the deployed site after publication.

Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs` and `tests/sites-worker.test.mjs` compatible with the original Sites-ready template. Never commit credentials, environment files, internal client correspondence, dependencies or build output.

## Approved multipage extension

The owner approved the proposed multipage structure and its implementation on 30 October 2026. The site now uses Astro static pages with React islands, preserving the existing approved design and protected Sites packaging. Run `npm run test:static` after the Pages build as well as `test:sites`.

Centralized content lives in `src/data/`. Each product and project must have standalone rendered HTML. Preserve `/Mebel/` asset and link prefixes in Pages builds and ordinary root paths in root builds. Do not reintroduce a client-only router fallback.

Imported model prices are historical reference values, not verified current offers. Never claim current stock from the old export. The dining-group collection contains individual tables and chairs: clearly state that displayed prices are for individual items and the complete set is agreed separately. Exclude unreviewed Copy cards and do not invent missing project photographs.

GitHub and ordinary preview builds remain demonstrations with `noindex,follow`. The owner approved moving the production domain to the MAX VPS on 7 November 2026. `npm run build:vps` enables indexing and uses the main domain for canonical, Open Graph and sitemap URLs; request/privacy/error pages and redirect aliases stay noindex. A CMS and payment integration are not connected. Leads are stored in the separate private D1 database behind the public Sites API. Do not put inquiry data or integration secrets into static files or the public repository.

## Latest typography preference

On 30 October 2026 the user explicitly rejected the previous fonts and the homepage headline overlapping its photograph. Use locally hosted Onest for headings and Golos Text for body/UI, with the shared tokens in `src/typography.css`. This supersedes the original serif direction. Hero heading, description and actions must wrap inside the text column with a visible right gutter. Never restore nowrap, oversized text widths or intentional text overlap onto the photo. Let the headline wrap naturally rather than using hard line breaks.

## Catalog, galleries and motion

The owner requested consistent catalog/product/project pages, mobile usability and site animations. Shared refinements live in `src/refinements.css`; lightweight reveal behavior lives in `src/scripts/motion.js`. Preserve reduced-motion support and visible content when JavaScript or animation APIs are unavailable. Use the native dialog for enlarged galleries and keep focus/keyboard controls usable. Mobile product headings come before photos. Catalog filters are serialized into the URL so sharing and returning from a product preserve the selection; run `npm run test:catalog` as well as the build checks.

## Real photography

The owner requested a more photographic homepage using supplied sources. The selected 12 original photos come from the client's public Yandex Disk showroom shoot; provenance is in `src/data/photo-sources.json`, presentation data in `src/data/photos.js`. Keep responsive image variants and lazy loading. Do not publish photos of the former short-haired employee from that shoot. Do not describe showroom pictures as completed customer projects or invent team identities. The homepage no longer uses the generated materials illustration. The photo carousel uses native horizontal scrolling, explicit controls and enlarged dialogs; preserve keyboard navigation and reduced-motion behavior, with no automatic advance.

## Client revisions approved on 3 November 2026

Navigation has three furniture directions: Кухни, Корпусная мебель, Столы и стулья. Furniture made to order includes kitchens; never present it as a mutually exclusive category. Корпусная мебель covers wardrobes, walk-in closets, entrance halls, living rooms, children's rooms, bedrooms and built-ins.

Keep all 168 dining models, their variants, non-price filters and favorites. Hide historical prices from rendered pages and island data; use «Стоимость уточняйте». Price sorting and historical price filters are removed. Old catalog and custom-furniture URLs redirect to their new canonical counterparts while retaining query/hash; exclude aliases from the sitemap.

The owner confirmed the new Telegram photos belong to the atelier. Selected photos are grouped by object on Наши работы, with category filters and relevant albums on service pages. Never invent missing materials, locations, client identities or photographs of bedrooms/children's rooms. Before-installation views, project images and process shots need explicit captions, including in enlarged galleries. Original appearance of furniture and rooms must be preserved. Technical responsive conversion is not AI enhancement. Source filenames and responsive dimensions live in src/data/work-photo-sources.json.

Preserve the dark/gold palette and local Onest/Golos fonts. Add warmth through real photos, restrained textures and small decorative details. Both the summary step 03 and third About benefit use «Всегда на связи» and the approved quality/environment/safety wording; the full installation step stays in the complete order process. About must state «Официальный дилер фабрики „ГЕОС Идеал“ (Беларусь)». The returns explanation distinguishes furniture of proper quality made to individual requirements from claims about defects.

The owner rejected the showroom-space photograph (IMG_0237) because the blurred foreground plant obscures the furniture. Do not use it in the first process step or showroom galleries. Keep furniture visible when selecting replacements; avoid repeating the same dining group throughout the homepage.

## Client revisions approved on 4–5 November 2026

The owner requested larger outlined navigation, messenger icons, a larger family-atelier eyebrow without the city, and a new homepage headline font. Use locally hosted Manrope only for that headline; retain Onest/Golos elsewhere and natural wrapping inside the text column. Shared revisions live in `src/client-revisions.css`.

Use varied real photographs on direction cards, a compact carousel with prominent arrows, and photographic categories on the corpus-furniture page. The user confirmed the woman with long dark hair dressed in white is the owner; she may be identified as such. The facade has a restrained ImageGen retouch, recorded in `src/data/exterior-photo-provenance.json`. Keep original photo sources. Present tables/chairs on consistent light stages without changing product geometry or materials.

«Давайте знакомиться» belongs to About. Contacts keeps locations, maps, atelier photos, social icons and project/contact actions. Main WhatsApp uses +7 (961) 606-93-09.

The separate Sites service accepts website applications and connects any Telegram/MAX recipient through `/start`, a server-side password and `/status`; `/stop` unsubscribes. Multiple subscribers are independent. Do not replace this with manual recipient IDs or expose the password. Backend source and operating notes are in `lead-service/`; deployed source is in the adjacent `prioritet-leads-api` checkout. Run `npm run test:leads` with existing build/static/catalog checks before publication.

MAX incoming events now use the independent VPS HTTPS relay in `lead-service/max-relay/`; recipient state, leads and outgoing messages remain in Sites. Preserve the production `MAX_WEBHOOK_URL` when reconfiguring the bot. The former Pages callback remains in source for compatibility and is not the active subscription. Validate real MAX commands and lead delivery without a local polling process before claiming the integration works. The VPS has other applications: isolate the Node runtime, systemd service and nginx host instead of replacing existing services or upgrading their runtime.

The public domain is `https://prioritetmebel48.ru`. Browser forms use the VPS `/api/leads` gateway because the direct Sites endpoint returned Cloudflare 403 from four Russian networks. Keep the exact main/www/Pages/GitHub CORS allowlist on both services. The gateway signs the nginx-verified client IP with `LEAD_PROXY_SECRET`; never trust forwarded IP headers without this separate server secret. The same VPS serves the unchanged introductory video with byte-range support. Public gateway configuration is centralized in `src/lib/public-gateway.js`; credentials remain outside frontend assets and source control.

The owner requested Yandex Metrika counter `114121807` on 7 November 2026. It is loaded once per page in the shared Base layout, with the supplied Webvisor/clickmap/link/bounce/dataLayer settings and noscript fallback. Preserve `ym-disable-keys` on inquiry/quiz text inputs and textarea, and the analytics disclosure on the privacy page.

VPS website publication is documented in `deployment/vps/README.md`. nginx serves `/var/www/prioritet/current`; keep atomic releases and rollback snapshots. The provider hostname also previews the website and is an explicitly allowed fifth CORS origin on both gateway and Sites. The user will change DNS themselves: do not mutate DNS records without a later request. The initial TLS bootstrap waits for real DNS/HTTP readiness, then installs separate apex/www certificates and disables itself. Preserve the existing certbot renewal timer and all unrelated nginx hosts. A GitHub push updates previews, not the VPS; use a separate verified production release for VPS changes.

## Marketing materials approved on 6 November 2026

The owner approved the new catalog, introductory video and certificate promotion, and explicitly requested a closable popup after some time on the site. The owner explicitly changed the delay to 7 seconds of visible browsing, once per tab visit, with a persistent manual reopen button. Suppress automatic opening while a form, navigation, video or another dialog is in use. Request, privacy and error pages have no promotion popup. Preserve native-dialog focus handling, Escape/backdrop/close controls and reduced-motion support.

The certificate grants 10% of furniture cost or 15% for two or more furniture items in one contract, capped at 100,000 RUB, valid three months from issue and used instead of gifts. Do not promise immediate certificate issuance merely because a lead was saved. The provided gift thresholds are 160,000 RUB for a sink and 300,000 RUB for a hood; confirm the actual gift configuration with the customer. Request sources distinguish certificate/gift inquiries without storing contact information in browser storage.

The six-page PDF contains four specific project configurations with assembly prices, dated 5 November 2026. These may appear as examples on kitchen/corpus-furniture pages; this does not restore historical prices to the dining catalog. The source PDF stays intact. `src/data/marketing-sources.json` records provenance. The website video keeps narration and uses a supplied furniture photograph over the unconfirmed employee shot at 11.8–15.55 seconds. Do not restore that shot inadvertently. The owner requested a compact homepage video card immediately after the five-question quiz and before the certificate offer, with one player on the homepage. Keep the existing full-size About video unchanged. Keep both videos click-to-play with a poster and preload=none. Run `test:promotions` with the established build checks before publishing.

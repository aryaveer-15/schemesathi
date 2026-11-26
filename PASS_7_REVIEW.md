# SchemeSathi Pass 7 review

## Before changes, ranked by risk

1. **High · Runtime dependencies.** npm flagged high-severity advisories in Mongoose, body-parser and compression, and a moderate advisory in qs. Vite and its development dependencies also had high and moderate findings.
2. **High · Session exposure.** Express issues a seven-day bearer JWT after registration or login. The browser stores it with the signed-in profile in localStorage and sends it as an Authorization header. An injected script could read the token. Signing did not validate the quality of the configured secret, and token verification did not explicitly restrict algorithms or validate claim types. Logout was client-side. The app used no session cookies.
3. **Medium · Auth and rate limiting.** Login returned a generic 401 but skipped bcrypt for unknown emails. Signup let bcrypt silently truncate passwords after 72 UTF-8 bytes. Login and registration shared a limiter, while auth reads and eligibility submissions were unlimited. Without proxy configuration, clients behind Render could share an IP bucket.
4. **Medium · Validation and database access.** Auth rejected object credentials before building an email equality query. Scheme list queries used selected string fields and escaped search regex characters, but silently ignored malformed, repeated or object-shaped filters. Detail paths were checked for slugs or ObjectIds. Matchers already validated recognized answers and profile types without writing to MongoDB. Extra body fields and non-boolean partial flags were accepted in parts of the matcher API. Authentication claims reached the user lookup without shape checks.
5. **Medium · Browser policy and previews.** CSP covered framing, objects and the base URL. The application served generic initial HTML for scheme links, including a 200 for missing schemes. No report-only policy had been exercised on the production build.
6. **Low · Operational checks and secrets.** API failures returned a generic message or a controlled validation error. Logs covered failures only. Readiness used MongoDB's connection state. CORS used an explicit origin allowlist. Required settings were MongoDB credentials and a JWT secret, with port, host, origins, proxy hops and DNS overrides available. The ignored local environment file did not appear in tracked paths. A credential-pattern scan of local history and reflogs yielded empty placeholders and generated test fixtures. Encoded secrets and inaccessible refs are outside that scan.

## Server changes

- Kept bcrypt at cost 10, rejected passwords longer than 72 UTF-8 bytes at signup, and ran a bcrypt comparison even for an unknown email. Existing password comparison remains compatible with previously accepted passwords. Login errors for nonexistent accounts and wrong passwords use the same status and text. New JWTs explicitly use HS256, and verification checks HS256, expiry, user ID and role. No cookies are issued, so HttpOnly, Secure and SameSite flags do not apply to this bearer-token flow.
- Auth and eligibility POSTs accept only expected keys and scalar types where required. Catalogue filters reject unknown keys, arrays and oversize input. The app retains CORS's configured origins and explicitly limits preflight methods and request headers. JSON has a 16 KiB limit. Compressed inputs are rejected, while supported outgoing compression remains enabled.
- Login and registration share 20 calls per client per 15 minutes. Auth reads allow 120 per 15 minutes. Eligibility writes allow 90 per minute. The Render default trusts one ingress hop. Tests used two client IPs and varied a client-controlled earlier forwarded entry to prove it did not alter the bucket. Actual service routing still needs the two-network staging check. [Express proxy guidance](https://expressjs.com/en/guide/behind-proxies/) · [Render ingress guidance](https://render.com/articles/how-render-handles-ddos-attacks)
- Liveness and readiness return only simple status responses. Readiness uses the database connection state and liveness never consults MongoDB. JSON logs contain event, method, fixed route pattern, status, duration and request ID. Tests prove that submitted credentials, authorization headers, cookies, questionnaire fields, full query strings, raw paths and internal database error messages are absent.
- Express sends escaped title and Open Graph metadata for maintained scheme pages in the initial HTML. Canonical and image URLs use an explicitly configured origin or Render's provided origin. The initial preview uses the existing generic catalogue photo. Imported-only listings use generic previews. Unknown schemes return the app shell, generic metadata and HTTP 404. The shell still revalidates with `no-cache`; hashed assets keep their existing cache rules. A test verifies that a hostile script-like title and description stay inside their text and attribute contexts.

## Production CSP and accessibility

The full Helmet policy defaults to **report-only** for the first Render deploy. Existing enforced frame, object and base-URL restrictions remain active. The policy allows local scripts, styles, fonts, images and API connections, plus data images. It needs neither `unsafe-inline` nor `unsafe-eval`. Chromium tested 99 page and flow combinations at 360 px, across all 11 languages and Urdu RTL. The checks included the catalogue, direct scheme pages, help chat, account pages, both questionnaire routes and submitted results. A separate English check loaded and decoded each of the 51 scheme banners. All 150 checks produced zero CSP violations. The application serves no remote CSP collector. [Helmet CSP configuration](https://github.com/helmetjs/helmet/blob/main/middlewares/content-security-policy/README.md)

The full regression suites went from 96 to 105 passing server tests and from 74 to 76 passing browser tests. Axe passed in English, Hindi and Urdu on desktop and mobile. All 11 languages passed the 360 px layout checks. Production build and client lint passed.

## Lighthouse mobile comparison

Two fresh Chromium runs per page used the same Lighthouse 13.6 simulated mobile profile as Pass 6, at 360 × 800 CSS px. Local Express served each production build, with the same catalogue fixture and real matcher. The synthetic results flow submitted an answer and waited for results. Its LCP can reflect the questionnaire before results appear. The table reports the midpoint of each two-run sample. Accessibility and best practices scored 100 before and after for all five pages.

| Page | Performance | LCP (ms) | CLS | TBT (ms) | JS transferred (kB) | JS decoded (kB) |
|---|---:|---:|---:|---:|---:|---:|
| Home | 100 → 100 | 768 → 767 | 0 → 0 | 30 → 6 | 112.69 → 113.19 | 372.73 → 372.87 |
| Catalogue | 97.5 → 97 | 2,441 → 2,639 | 0.039 → 0.039 | 2 → 6 | 125.06 → 127.78 | 396.01 → 396.31 |
| Scheme detail | 98 → 98 | 2,416 → 2,443 | 0 → 0 | 6 → 17 | 123.28 → 125.96 | 391.82 → 392.06 |
| Questionnaire | 99 → 99 | 2,181 → 2,247 | 0 → 0 | 17 → 13 | 123.69 → 126.34 | 390.54 → 390.67 |
| Results flow | 99 → 99 | 2,184 → 2,155 | 0 → 0 | 7 → 10 | 123.69 → 126.34 | 390.54 → 390.67 |

CSS transfer increased from 5.44 kB to 5.87 kB per page. Decoded CSS remained 19.63 kB. Transfer includes response header overhead. Catalogue LCP rose 198 ms, and questionnaire LCP rose 66 ms in this two-run comparison. The live Render deployment and physical devices were outside this lab test.

## Chat replay

I replayed all 20 Pass 6 prompts in Chrome using the production build and the 51-entry fixture. Four formerly unanswered prompts now give suggestions with a link to the same catalogue listings.

| Prompt | New discovery |
|---|---|
| Is there a scholarship for a student with disabilities? | AICTE Saksham Scholarship |
| old age pension | Five pension listings, including Atal Pension Yojana and NSAP pensions. The chat shows four and links to the set. |
| beti ke liye saving scheme | Sukanya Samriddhi Yojana |
| pm ksan ke liye apply kaise kare | PM-KISAN, with its catalogue and official links |

Seven earlier discovery replies now link directly to the matching listings, including the English, Hindi and Hinglish farmer and scholarship cases. The seven named replies and account FAQ remained in the same categories. Aadhaar status still receives the unknown answer and a link to browse. The search-links carry catalogue slugs only. Chat questions stay in browser memory and never become URL parameters or requests.

## Dependency audit

The server's production-only audit reported zero advisories. Updated Mongoose to 9.11.4, compression to 1.8.2, body-parser to 2.4.0, qs to 6.17.1, Vite to 8.3.8 and Zod to 4.6.7. No existing dependency moved to a new major. The compatible MongoDB connection-string package is pinned at 7.0.2 to avoid its later transitive WHATWG URL major upgrade.

- **New server package** `helmet@8.3.0` supplies security headers without browser code. Compression also adds its `destroy` utility for stream handling.
- **New optional build packages** `@rolldown/binding-wasm32-wasi`, `@napi-rs/wasm-runtime`, `@emnapi/core`, `@emnapi/runtime`, `@emnapi/wasi-threads`, `@tybys/wasm-util` and `tslib` support Vite's optional Rolldown WASM toolchain. They do not ship in browser JavaScript or the final Docker stage.
- **Remaining moderate, client linting only** `minimatch`, `eslint` and `@eslint/config-array` report the same underlying advisory. The compatible ESLint upgrade now resolves a new major of minimatch. It was left pending approval.
- **Remaining moderate, server development only** `minimatch` and `nodemon` report the same underlying advisory. npm's fallback requires an out-of-range nodemon downgrade. [npm advisory for minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249)

## Remaining risks before commit

- The existing bearer JWT is readable by scripts on the same origin. Client-side logout clears it locally without revoking a copied token. Duplicate registration still returns 409. Older passwords that exceeded bcrypt's input limit remain compatible at login. The minimum secret length checks length, while strength still depends on how the value was generated.
- Per-process limits reset on restart, are not shared across replicas, and can affect users who share one public IP. The locally simulated proxy chain does not verify the exact live Render ingress. Validate client separation before opening the deployment to regular users. Registration and sign-in have no second factor or account recovery in this pass.
- CSP remains report-only for the full policy. Zero observed events in Chromium cannot verify browser extensions, other browsers, live domains, production proxies or a separately hosted client. Render and the hosting provider may keep their own access logs separately from Express.
- Maintained previews depend on the repo copy and the configured public origin. An imported scheme served only from MongoDB has generic preview copy. Legacy links depend on database readiness. Third-party preview services may cache old previews and support different image formats.
- Chat suggestions are text matches, so the result can represent a different state or population. Chat cannot check Aadhaar or confirm an application's current status. Search match lists can become large with a heavily expanded catalogue. Official sources can change or fail independently.
- Docker is unavailable in this environment. Inspection confirmed the two-stage build uses `npm ci --omit=dev` in the final stage, runs as `node`, and excludes known secret files and dev-only directories through `.dockerignore`. A live image build, container health on Render and real MongoDB access remain unverified. Docker uses a moving Node 24 base tag. The README includes the local verification commands.
- Questionnaire and results remain lazy-loaded. The prior cold-load delay and the latest catalogue LCP increase warrant measurement on real devices. Manual screen-reader and low-end physical-device checks remain open. The live domain can be confirmed after the first push. No sitemap or robots file was generated.

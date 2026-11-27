# SchemeSathi

SchemeSathi is a government-scheme directory with preliminary eligibility checks in English, Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Urdu, Kannada, Odia, and Malayalam.

## Run locally

You need Node.js 24, npm, and a MongoDB database.

1. Run `npm ci` in both `server` and `client`.
2. Copy `server/.env.example` to `server/.env`. Set `MONGO_URI` to your MongoDB connection string, `JWT_SECRET` to a private random string, and `PORT` to `5000`. Keep `.env` out of Git.
3. In `server`, run `npm run seed` to add the maintained schemes. This inserts missing slugs and preserves existing scheme records. Run it against the database configured in `server/.env`.
4. In `server`, run `npm run dev`. In a second terminal, run `npm run dev` in `client` and open the URL Vite prints.

In development use the same hostname for frontend and API (localhost or 127.0.0.1) so SameSite cookies work. In development the client uses `http://localhost:5000` by default. The production build calls `/api` on the same origin. Set `VITE_API_URL` for a separate local development API. Production cookie sign-in requires same-origin hosting.

## Checks and production build

- In `server`, run `npm test` for the eligibility API tests. They use a local HTTP server and do not need MongoDB.
- In `client`, run `npm run lint` and `npm run build`. The build outputs static files in `client/dist`.
- In `client`, run `npx playwright install chromium` once, then `npm run test:e2e` to run desktop and mobile browser tests. They simulate API responses so they can cover outages and expired sessions without a live database. Set `PLAYWRIGHT_CHANNEL=chrome` to use an installed Chrome browser.

## Publish

### Environment variables

| Variable | Required | Secret | Purpose |
|---|---|---|---|
| `MONGO_URI` | Yes | Yes | MongoDB connection string for the API, seed and catalogue import. |
| `JWT_SECRET` | Yes | Yes | Random signing secret of at least 32 bytes in production. Keep the value across deploys to preserve existing sessions. |
| `NODE_ENV` | Set by Docker | No | The image sets `production`, enabling serving the built client and HTTPS-only transport policy. |
| `SERVE_CLIENT` | No | No | Set to true to serve the built client in local development Docker tests. |
| `HOST` | No | No | Local default is loopback. The image listens on `0.0.0.0`. |
| `PORT` | No | No | Local and Docker default is 5000. Render can supply its own value. |
| `MONGO_DNS_SERVERS` | No | No | Comma-separated DNS resolver override for MongoDB SRV records. Production otherwise uses the host resolver. |
| `CORS_ORIGINS` | No | No | Exact comma-separated local frontend origins for credentialed development requests. Production write trust uses the canonical HTTPS origin. |
| `VITE_API_URL` | No | No | Optional local development API origin. Leave unset for same-origin Render deployment. |
| `TRUST_PROXY_HOPS` | No | No | Defaults to one on Render and zero elsewhere. Override only after confirming the fixed trusted ingress chain. |
| `CSP_MODE` | No | No | Full CSP defaults to `report-only`. Use `enforce` after testing the deployed site. |
| `PUBLIC_SITE_ORIGIN` | No | No | The confirmed HTTPS public origin for write protection, previews and canonical URLs. Defaults to Render's external URL on Render. |
| `RENDER`, `RENDER_EXTERNAL_URL` | Provided by Render | No | Platform-provided hosting indicator and external URL. |
| `PLAYWRIGHT_CHANNEL` | Test only | No | Set to `chrome` to run browser tests with installed Chrome. |

### Docker and Render

From the repository root, with Docker Desktop running and a local `server/.env` pointing to a test MongoDB database, run these PowerShell commands.

```powershell
docker build --pull --tag schemesathi:pass7 .
docker run --detach --rm --name schemesathi-pass7 --env-file .\server\.env -p 127.0.0.1:5000:5000 schemesathi:pass7
Invoke-RestMethod http://127.0.0.1:5000/api/health
docker exec schemesathi-pass7 id -u
docker exec schemesathi-pass7 sh -c 'test ! -e /app/server/.env && test ! -d /app/server/node_modules/nodemon && test ! -d /app/client/node_modules'
docker stop schemesathi-pass7
```

The container user ID must be nonzero. Use the terminal or Render logs to check startup if the health request fails. A container connecting to MongoDB on the Windows host needs a reachable host address rather than its own loopback interface.

1. Push the reviewed feature branch, then merge it into the branch connected to Render. Confirm the Render service uses the repository Dockerfile and the root build context.
2. Keep `MONGO_URI` and `JWT_SECRET` in the service's secret settings. No new variable is required for standard Render hosting. Keep the first deploy in CSP report-only mode. Set `PUBLIC_SITE_ORIGIN` only after confirming the public URL if it differs from the Render-provided origin.
3. Set the Render health check to `/api/health`. It returns HTTP 503 while the MongoDB connection is unavailable. `/api/health/live` only confirms that HTTP is responding. Run the catalogue seed once for a new database to add missing entries.
4. Smoke-test sign-in, the questionnaire, results, help chat, Urdu and a direct scheme link. Verify a known scheme has preview tags in the raw HTML and a missing scheme returns 404. From two real networks, confirm each has its own rate-limit counter before relying on it. Keep the one-hop setting only when the last Render hop supplies the client IP at the right of the forwarded chain and traffic reaches Express through that ingress.
5. If deployment fails, use Render **Deploys → Rollback** to the previous successful build. Verify health and sign-in again. Revert the offending Git commit on the deployed branch before re-enabling automatic deploys. [Render rollback documentation](https://render.com/docs/rollbacks)

Login and registration share 20 requests per client per 15 minutes. Auth reads allow 120 requests per 15 minutes and eligibility submissions allow 90 per minute. These counters are per process. Request logs contain method, fixed route pattern, status, duration and the response's `X-Request-Id`. They exclude request values, IP addresses and errors' internal messages.

## Maintain scheme information

Edit `server/catalog.js` or `server/additionalCatalog.js` to update the 51 maintained entries. Existing scheme IDs and MongoDB records are preserved. The API publishes maintained titles, summaries, eligibility requirements where available, and source URLs for those slugs. Keep the questions in `client/src/eligibilityContent.js` and the checks in `server/routes/eligibility.js` and `server/profileEligibility.js` aligned with official criteria.

### Verify a maintained scheme

Run from the repository root in PowerShell.

```powershell
npm.cmd --prefix server run verify:checklist -- --online
npm.cmd --prefix server run check:links
```

Open `VERIFICATION_CHECKLIST.md` and work from the highest priority down. Omit `--online` to generate the checklist without network requests. The online mode tries the published primary page and linked criteria. Excerpts may cover a different route or programme. Compare the full official document yourself. For PDFs, put Poppler's `pdftotext` on your PATH or pass the executable as `--pdf 'C:\Path\To\pdftotext.exe'`. Use `--output` to write to a separate file. The script replaces the generated checklist on each run. Keep your own copies if you annotate the file directly.

After reviewing the full scheme, enter the scheme ID, your actual review date, initials and decision when prompted by these PowerShell lines. The first command only previews the diff. Use `--snapshot` with the ID in the checklist if you want the command to reject a review of outdated data.

```powershell
$schemeId = Read-Host 'Scheme ID'
$reviewDate = Read-Host 'Date reviewed (YYYY-MM-DD)'
$reviewer = Read-Host 'Your initials'
$decision = Read-Host 'Matches official source (yes, no, or unclear)'
$snapshot = Read-Host 'Snapshot ID from the checklist'
npm.cmd --prefix server run verify:record -- --scheme $schemeId --date $reviewDate --by $reviewer --matches $decision --snapshot $snapshot
```

If the preview is correct, repeat with `--apply`, then run `git diff -- server/verificationRecords.json` before committing. The command never commits. A `yes` applies to the current scheme snapshot and sets the public **Last verified** date after restart or redeploy. A `no`, an `unclear`, or a changed snapshot leaves the date pending. Old database dates without a ledger review are pending. The ledger records the latest decision per scheme and committed history preserves earlier entries.

For `no` or `unclear`, add `--field` and `--value` with the correction you obtained from the official source. The command records it as a proposal and leaves the live matcher and published facts as they are. Optional `--notes` can include the official document section. Use initials only and keep personal or confidential information out of the ledger.

The banner switch uses the same preview and apply workflow. It keeps the banner's dimensions and omits its photograph from the catalogue, detail view and link preview for that scheme.

```powershell
npm.cmd --prefix server run verify:record -- --scheme $schemeId --banner off
npm.cmd --prefix server run verify:record -- --scheme $schemeId --banner off --apply
git diff -- server/verificationRecords.json
```

Use `--banner on` to enable it again. The original photo files stay in the repository and can still be used by other schemes.

### Export reviews for Google Sheets

From the repository root, run `npm.cmd --prefix server run export:reviews` in PowerShell. If `LINK_REPORT.md` is missing or predates its “Needs human check” section, first run `npm.cmd --prefix server run check:links`.

Import the files from `exports/` as separate tabs in Google Sheets and turn off automatic conversion of text to numbers, dates and formulas. The CSVs use UTF-8 with a byte order mark. Verification rows follow checklist order. Translation files show the exact dictionary text, including entries the site currently displays in English pending review. Reviewer columns start blank. Move any existing exports before rerunning so review notes are preserved.

When updating user-facing text or maintained scheme content, update the corresponding translations in `client/src/locales/`. The original English, Hindi, and Kannada copies are in `client/src/i18n.jsx`, `client/src/eligibilityContent.js`, and `server/catalog.js`.

Eligibility results explain whether the answers match the criteria checked by SchemeSathi. Users should confirm current rules with the official programme before applying. The housing check covers PMAY Urban 2.0. PM-JAY coverage for people below 70 requires checking the official beneficiary portal. The pension check covers old-age and widow pensions. The questionnaire directs disability pension applicants to verify applicable rules with their state office.

Signed-in users can use **Find my schemes** to see preliminary checks and official next steps across the 51 maintained schemes. The Jan Aushadhi locator is open to the public. Profile answers apply to each applicable check. When a result needs verification, it can identify the relevant authority. Questionnaire answers are not stored. The additional scheme questions, their rules and their application directions are maintained together in `server/remainingEligibility.js`.

The **Help chat** answers common questions about accounts, eligibility, and where to apply. Visitors can select a topic or type a supported scheme name. Messages are matched in the browser and cleared when the visitor leaves the page. The chat reads public scheme details and official links from SchemeSathi's catalog and requires no external AI service.

### Import an authorized catalog

Use an export that allows redistribution. In `server`, run `npm run import:catalog -- path/to/catalog.json` to validate the entire file. Add `--apply` to insert missing schemes into the configured MongoDB database. Imports preserve existing records and publish official links for verification.

The JSON has a top-level `sourceUrl` for the dataset and a `schemes` array. Each scheme requires a unique `slug`, a `category` from `server/catalogFields.js`, a `level` of `central` or `state`, a `state` for state schemes, an official `sourceUrl`, a `title`, and a `summary`. Title and summary can be English strings or objects keyed by locale, with `en` required. Both URLs must use HTTPS. The importer accepts up to 20,000 schemes per file.

Each entry can also include up to 30 `eligibilityRequirements` for the scheme detail page. Each item can be an English string or a translation object with `en` required. The profile matcher uses reviewed rules defined in the application.

## Cookie sign-in on Render and localhost

Serve the client and API at the same HTTPS origin. Leave VITE_API_URL unset in the Render build. The trusted production write origin is the validated origin from PUBLIC_SITE_ORIGIN, or RENDER_EXTERNAL_URL when RENDER=true. For a custom domain set PUBLIC_SITE_ORIGIN to the exact public HTTPS scheme and hostname. For the standard Render hostname no additional variable is required. On Render, missing both origin settings stops startup. Outside Render, missing origin configuration in production denies writes with 403. Invalid configuration stops startup. Host, X-Forwarded-Host and the proxy hop count do not determine this origin. Production ignores CORS_ORIGINS for write trust. Every unsafe API request requires the exact Origin and X-SchemeSathi-Request header set to 1.

The host-only /api cookie is HttpOnly and SameSite=Lax, with Secure enabled in production. The cookie and signed token each have a seven-day lifetime (604800 seconds). Existing browser sign-ins require a new login. Logout expires the browser cookie. A copied token can remain usable until its signed expiry.

For a local Docker test, use local-only database credentials in MONGO_URI and a local JWT_SECRET in your PowerShell environment. SERVE_CLIENT=true serves the built client in development. CORS_ORIGINS explicitly opts the listed loopback origins into local testing. Publish the port on loopback only.

```powershell
docker build -t schemesathi:pass10 .
docker run --rm -p 127.0.0.1:5000:5000 -e NODE_ENV=development -e SERVE_CLIENT=true -e MONGO_URI -e JWT_SECRET -e "CORS_ORIGINS=http://localhost:5000,http://127.0.0.1:5000" schemesathi:pass10
```

## Public indexing and CSP on Render

Set PUBLIC_SITE_ORIGIN to https://schemesathi-qx5e.onrender.com. Render's RENDER_EXTERNAL_URL supplies the fallback when the explicit setting is absent. Express serves /sitemap.xml from the bundled catalogue and /robots.txt with the sitemap location and a crawl exclusion for /api.

In the Render service's Environment settings, set CSP_MODE to enforce, then save and deploy. To return to reporting, set CSP_MODE to report-only or remove it and redeploy. The default reports the full policy and still enforces the existing baseline restrictions.

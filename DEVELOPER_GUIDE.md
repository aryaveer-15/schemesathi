# SchemeSathi developer guide

Start with one change you can see or test. Open the folder containing the root README.md in your editor and a PowerShell terminal. Run `git status --short --branch` before editing and `git diff` afterward. If you started from an AI-generated change, follow the data from the source file to the screen before editing it.

## Project map

| Where | What it does |
| --- | --- |
| `client/` | React code for the browser. Vite serves it while you work and builds it into `client/dist/`. |
| `client/src/main.jsx`, `App.jsx`, `pages/` | Start the app, set up navigation and routes, and render the individual pages. |
| `client/src/api.js`, `AuthContext.jsx`, `i18n.jsx` | Call the server, keep the current user in memory, and manage the language preference. |
| `client/src/index.css`, `client/public/`, `client/src/assets/` | Shared styles, the public logo, and banner images. `SchemeBanner.jsx` selects the image and its alt text. |
| `client/src/locales/` | English interface text in `en.js`, one file per other language, and the language list and lookup in `index.js`. |
| `server/` | Express API and MongoDB access. `index.js` starts the app, `siteConfig.js` reads site settings, `app.js` sets up middleware and routes, and `models/` defines MongoDB records. |
| `server/catalog.js`, `additionalCatalog.js`, `catalogFields.js` | The maintained catalogue, including slugs, descriptions and official links. A slug is the part after `/schemes/` in a scheme URL. `catalogFields.js` defines accepted categories and fields. |
| `server/profileEligibility.js`, `remainingEligibility.js`, `legacyEligibilityChecks.js` | Rules for the profile matcher, additional schemes, and older scheme-specific checks. `server/routes/eligibility.js` validates inputs and calls the matcher. `client/src/eligibilityMatcher.mjs` contains shared matching functions. |
| `server/questionnaire.js`, `applicationDirections.js` | Assemble question criteria and document checklists, and supply official next steps. `client/src/questionnaire.js`, `eligibilityContent.js`, `schemeQuestionSources.js`, `EligibilityQuestionnaire.jsx` and `EligibilityResults.jsx` turn that data into questions and results on screen. |
| `server/verificationRecords.json`, `verification.js`, `verificationInventory.js` | Store human review decisions, decide when a review applies to the current data, and collect the data for reviewers. |
| `server/seed/`, `server/scripts/`, `exports/` | Insert missing catalogue records, check links, generate reviews, and write CSV exports. The CSVs are local files ignored by Git. |
| `server/test/`, `client/e2e/` | Node tests for the server and Playwright tests for browser flows, mobile layouts and accessibility. |
| `Dockerfile`, `.dockerignore` | Package the built React app and Express server in one image and control what gets copied into the build. |
| Root review files | `DATA_REVIEW.md` and `TRANSLATIONS_REVIEW.md` track review issues. The link report and verification checklist are generated. Pass notes document earlier work. |

## Run locally

Install Node.js 24 and use a MongoDB database dedicated to development. Run these commands from the root. Copy the environment file once.

```powershell
node --version
npm.cmd --prefix server ci
npm.cmd --prefix client ci
Copy-Item .\server\.env.example .\server\.env
notepad .\server\.env
```

In the file, set `MONGO_URI` to your development database connection string, keep `PORT=5000`, and set `JWT_SECRET` to a private random value. The following command generates one to paste into the file. Keep `server/.env` out of Git.

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Seed missing schemes and start the server. The seed reads `server/.env` and keeps existing records. PowerShell environment values take priority over the file. Verify the database name before running it.

```powershell
npm.cmd --prefix server run seed
npm.cmd --prefix server run dev
```

Open another PowerShell terminal at the root and start Vite. Open the URL printed by Vite, normally `http://localhost:5173`. Use `localhost` consistently so the frontend and the default API address use the same hostname. If Vite moves to another port, set `CORS_ORIGINS` in `server/.env` to the exact Vite origin and restart the server. Press **Ctrl+C** in either terminal to stop that process.

```powershell
npm.cmd --prefix client run dev
```

### Run the Docker build locally

Start Docker Desktop. Use a fresh PowerShell terminal for this block. Stop any local Express process using port 5000. Use the development database from above. If MongoDB runs on Windows, set the seed's host-side URI to the Windows address as usual and use `host.docker.internal` in the container's URI in the next block. For MongoDB Atlas, use the development database URI and give your network access. The local container uses HTTP and serves the built client and API from one origin.

```powershell
docker build -t schemesathi:local .
$env:MONGO_URI = Read-Host 'Development MongoDB URI reachable from Docker'
$env:JWT_SECRET = node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
docker run -d --name schemesathi-local -p 127.0.0.1:5000:5000 -e NODE_ENV=development -e SERVE_CLIENT=true -e MONGO_URI -e JWT_SECRET -e "CORS_ORIGINS=http://localhost:5000,http://127.0.0.1:5000" schemesathi:local
Remove-Item Env:MONGO_URI,Env:JWT_SECRET
docker logs schemesathi-local
Invoke-RestMethod 'http://127.0.0.1:5000/api/health'
Start-Process 'http://127.0.0.1:5000'
```

When finished, stop the container. Start it again with `docker start schemesathi-local`, or remove the stopped container with `docker rm schemesathi-local` before recreating it with a new build.

```powershell
docker stop schemesathi-local
```

### Test and build

Run from the root after installing dependencies. The server tests and browser tests can run without a MongoDB server. Playwright uses test API responses. Install Chromium once, or set `$env:PLAYWRIGHT_CHANNEL = 'chrome'` to use already installed Chrome.

```powershell
npm.cmd --prefix server test
Push-Location .\client
npx.cmd playwright install chromium
Pop-Location
npm.cmd --prefix client run test:e2e
npm.cmd --prefix client run lint
npm.cmd --prefix client run build
```

The build puts deployable files in `client/dist/`. Use the Docker workflow above to try the built client with Express and the API together.

## I want to change something

| Change | Files and steps |
| --- | --- |
| A colour or font size | Open `client/src/index.css`. Edit the variables under `:root`, such as `--violet` or `--type-page`. Check the dark-mode overrides and a 360 px screen. |
| The logo or brand name | Replace `client/public/schemesathi-logo.jpeg` for the header artwork and `client/public/schemesathi-mark.svg` for the favicon. The header crop is set in `client/src/index.css`. Their references are in `client/src/App.jsx` and `client/index.html`. Change `appName` in the files in `client/src/locales/` and update the default title in `client/index.html` and `server/schemeMetadata.js` if renaming the product. |
| An English sentence on a page | Open the component in `client/src/pages/`, find its `t('key')` call, then edit that key in `client/src/locales/en.js`. If the sentence is written directly in JSX, edit the component. Check the meaning and corresponding locale keys when wording changes. |
| A scheme description | Find the slug in `server/catalog.js` or `server/additionalCatalog.js`. Update `summary.en` using the official source. Check any maintained summary for the same scheme in other languages, and review the detail page and its link preview after restart. |
| Add a maintained scheme | Follow an entry in `server/additionalCatalog.js` and check `server/catalogFields.js` and `server/models/Scheme.js`. Give it a unique slug and official source. Add a reviewed eligibility approach in the files below, including an explicit review path if available information is insufficient. Seed the development database and check the list, detail page, questionnaire and sitemap. Existing records are preserved by the seed. Review the catalogue count assertions in `server/test/questionnaire.test.js`, `server/test/export-reviews.test.js`, `server/test/crawler-policy.test.js`, `server/test/personalized.test.js`, `server/test/verification.test.js` and `server/test/scheme-links.test.js` when intentionally changing the count. |
| An eligibility rule and its tests | Find the slug in `server/profileEligibility.js`, `server/remainingEligibility.js` or `server/legacyEligibilityChecks.js`. Update only the sourced rule. Cover below, at and above each changed numeric cutoff, plus missing or “Not sure” answers, in `server/test/matcher-boundaries.test.js` and the relevant tests in `server/test/personalized.test.js` or `server/test/eligibility.test.js`. Keep displayed criteria and directions aligned. |
| A question | For older checks, start with `server/legacyEligibilityChecks.js` and `client/src/eligibilityContent.js`. For profile checks use `server/profileEligibility.js` or `server/remainingEligibility.js`. Follow the key through `server/questionnaire.js` and `client/src/questionnaire.js`. For a new answer key, check server validation in `server/routes/eligibility.js` and `server/profileEligibility.js`. Check labels in the locale files and sources in `client/src/schemeQuestionSources.js`. Test the browser flow in `client/e2e/questionnaire.spec.js`. |
| A banner or alt text | Use a photo with a known licence. Store the original WebP in `client/src/assets/schemes/` or `client/src/assets/scholarships/`, and add matching `-256.webp`, `-640.webp`, and `-960.webp` versions under `client/src/assets/responsive/`. In `client/src/SchemeBanner.jsx`, find the mapping by slug or category and edit the description for the image basename. Shared image descriptions affect every scheme using that image. |
| A translation | Use the matching `client/src/locales/<code>.js` file and compare the key in `en.js`. Preserve placeholders and the reviewed English fallback for critical guidance until a native reviewer approves the text. Track review in `TRANSLATIONS_REVIEW.md`. Check `server/test/localisation.test.js` and `client/e2e/localisation.spec.js`. |
| A help-chat answer | Edit topic matching and reply rules in `client/src/helpTopics.js`, answer strings in `client/src/locales/`, and how replies appear in `client/src/pages/SchemeChat.jsx`. Keep factual replies tied to catalogue entries and approved help copy. Check `client/e2e/discovery.spec.js`. |
| A search synonym | Edit `client/src/searchTerms.js`. `client/src/schemeSearch.js` uses those terms. Check that the new synonym finds the intended schemes without pulling in unrelated ones. See `server/test/discovery.test.js`. |

## Changes that need extra care

- **Questionnaire privacy.** Keep answers in memory only and send them only to the matcher as needed, because answers can disclose sensitive personal circumstances.
- **CSRF and cookies.** Preserve the trusted-origin and request-header checks in `server/app.js` and the cookie settings in `server/routes/auth.js`, because these protect browser sessions against requests initiated by other sites and limit script access to credentials.
- **Rate limits.** Review the limits and proxy setup together because the app uses the client IP to decide which requests share a limit.
- **Scheme facts.** Use official sources because a wrong cutoff, deadline or application link can cost someone an opportunity.

## Verify a scheme or record a friend's review

1. Generate a fresh checklist. The online option includes excerpts for you to compare with the full official document.

```powershell
npm.cmd --prefix server run verify:checklist
# Or fetch excerpts from official links.
npm.cmd --prefix server run verify:checklist -- --online
```

2. To share reviews, generate the link report if needed, then export the CSVs. Move old exports somewhere safe before regenerating. In Google Sheets, use **File → Import → Upload**, insert the file as a new sheet, and turn off conversion of text to numbers, dates and formulas.

```powershell
npm.cmd --prefix server run check:links
npm.cmd --prefix server run export:reviews
```

3. For a returned sheet, download the relevant tab with **File → Download → Comma-separated values (.csv)**. The repository has no review-CSV importer. Use the sheet to read the reviewer’s decisions and record them one at a time with the existing command. Match each row to its scheme ID and reviewed snapshot in the checklist. Use the reviewer’s actual date and initials. If an exported row lacks a snapshot, compare it with the fresh checklist and confirm what the reviewer saw before recording it.

```powershell
$schemeId = Read-Host 'Scheme ID from the checklist'
$reviewDate = Read-Host 'Review date (YYYY-MM-DD)'
$reviewer = Read-Host 'Reviewer initials'
$decision = Read-Host 'yes, no or unclear'
$snapshot = Read-Host 'Snapshot ID of the reviewed data'
$reviewArgs = @('--scheme', $schemeId, '--date', $reviewDate, '--by', $reviewer, '--matches', $decision, '--snapshot', $snapshot)
npm.cmd --prefix server run verify:record -- @reviewArgs
# Read the preview before saving.
npm.cmd --prefix server run verify:record -- @reviewArgs --apply
git diff -- server/verificationRecords.json
```

For a correction proposed on a `no` or `unclear` row, add `--field` and `--value` to the command. The proposal goes to the ledger for review. For links, banners and translations, keep returned feedback in the review files or sheet until it is checked and applied to the relevant source file.

**Last verified** is the date a human recorded a **yes** for the current scheme snapshot. A **no**, **unclear**, changed snapshot or missing review is pending. Restart or redeploy after saving a review for the public page to pick up the new ledger.

## Environment variables

| Variable | Secret? | Use |
| --- | --- | --- |
| `MONGO_URI` | Yes | Required locally and on Render. Connects the API and the seed/import scripts to MongoDB. |
| `JWT_SECRET` | Yes | Required locally and on Render. Signs and checks session tokens. Production requires at least 32 bytes. |
| `PUBLIC_SITE_ORIGIN` | No | Canonical origin for allowed writes, previews and crawler files. Set to `https://schemesathi-qx5e.onrender.com` on Render if configuring it explicitly. |
| `RENDER`, `RENDER_EXTERNAL_URL` | No | Render supplies these. Express requires a valid HTTPS origin on Render and uses the external URL if the explicit origin is absent. |
| `NODE_ENV`, `SERVE_CLIENT` | No | Docker sets production mode. The local Docker example uses development mode for HTTP and `SERVE_CLIENT=true` to serve the built client. |
| `HOST`, `PORT` | No | Bind address and port. Express defaults to loopback and 5000 locally. Docker binds all container interfaces. Let Render supply its port. |
| `CSP_MODE` | No | Optional. `report-only` is the default for the full Content Security Policy. `enforce` makes the browser block violations. |
| `TRUST_PROXY_HOPS` | No | Defaults to one on Render and zero locally. Change only after confirming the proxy chain. |
| `CORS_ORIGINS` | No | Comma-separated trusted frontend origins for development. Leave unset on the same-origin Render deployment. |
| `VITE_API_URL` | No | Optional browser-visible development API URL. Leave unset on Render. |
| `MONGO_DNS_SERVERS` | No | Optional comma-separated DNS resolvers for the server and catalogue import, useful when a MongoDB SRV hostname fails to resolve. |
| `PLAYWRIGHT_CHANNEL` | No | Local browser test setting. Set to `chrome` for installed Chrome. |

## Deploy and roll back on Render

1. In the Render dashboard, open the **SchemeSathi** web service and click **Settings**. Check the linked GitHub branch, root build context and Dockerfile path. Keep the repo root as the context and use `./Dockerfile`.
2. In **Settings → Health Checks → Edit**, set the path to `/api/health` and click **Save Changes**. [Render health checks](https://render.com/docs/health-checks)
3. Open **Environment → Environment Variables → Edit**. Use **Add variable** if needed. Set the two secrets and confirm the public origin. If changing settings before a code deployment, choose **Save only** and apply them on the next deploy. For a runtime-only change such as turning CSP enforcement on or off, choose **Save and deploy**. [Render environment variables](https://render.com/docs/configure-environment-variables)
4. Push the branch with the reviewed changes. If it differs from the Render-linked branch, merge the reviewed pull request into the linked branch in GitHub.

```powershell
$branch = git branch --show-current
git push -u origin $branch
```

5. In **Deploys**, confirm the expected commit SHA. If a deploy has not started automatically, click **Manual Deploy → Deploy latest commit**. Open the deploy entry to watch its logs. After it goes live, verify the health URL and try a direct scheme link, sign-in, and a questionnaire submission with a test account. Seed a new production database once with the maintained catalogue before checking its list. [Render deploys](https://render.com/docs/deploys)

```powershell
Invoke-RestMethod 'https://schemesathi-qx5e.onrender.com/api/health'
```

6. To roll back, open **Deploys**, choose the previous successful deploy, click **Rollback**, then **Rollback to this deploy**. Check health and sign-in again. Dashboard rollback disables auto-deploys. After correcting the linked branch, go to **Settings → Auto-Deploy** and restore the previous setting. Rollback reuses a retained build and does not undo MongoDB changes. [Render rollbacks](https://render.com/docs/rollbacks)

## Troubleshooting

| Symptom | First thing to check |
| --- | --- |
| Sign-in returns 403 | Open browser DevTools → Network and check the request origin against `CORS_ORIGINS` locally or the configured canonical origin on Render. Confirm the request has `X-SchemeSathi-Request: 1`. Use the same local hostname in the frontend and API. |
| “Sign-in has changed” | An old browser token was cleared during the switch to cookies. Sign in again. |
| Tests fail after an edit | Read the first failed assertion and inspect `git diff`. Rerun a server file with `node --test .\server\test\matcher-boundaries.test.js`, or a browser file with `npm.cmd --prefix client run test:e2e -- website.spec.js`. Compare intended changes to the test's expectations. |
| Docker will not start | Run `docker info`, `docker ps -a` and `docker logs schemesathi-local`. Check Docker Desktop, port 5000, and the database URI from inside the container. |
| Render deploy fails | Open **Deploys** and the failed deploy's logs. Check the first error, linked branch, Dockerfile path, database access, environment variables and health check path. If a bad release is already live, use the rollback steps above. |

## Repository notes for later

- `client/README.md` still contains the Vite starter template.
- `server/.env.example` describes the public origin as preview-only and shows an HTTPS example for separate frontend CORS. The app also uses the canonical origin for write protection, and the separate-origin cookie workflow is for local development.
- The seed script hardcodes public DNS resolvers. The server and catalogue importer support `MONGO_DNS_SERVERS`, which can make DNS troubleshooting differ across commands.
- The review exporter is present. Returned review CSVs still need the manual ledger workflow above.

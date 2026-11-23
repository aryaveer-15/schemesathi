# SchemeSathi

SchemeSathi is a government-scheme directory with preliminary eligibility checks in English, Hindi, and Kannada.

## Run locally

You need Node.js 24, npm, and a MongoDB database.

1. Run `npm ci` in both `server` and `client`.
2. Copy `server/.env.example` to `server/.env`. Set `MONGO_URI` to your MongoDB connection string, `JWT_SECRET` to a private random string, and `PORT` to `5000`. Keep `.env` out of Git.
3. In `server`, run `npm run seed` to add the example schemes. This inserts missing slugs and preserves existing scheme records. Run it against the database configured in `server/.env`.
4. In `server`, run `npm run dev`. In a second terminal, run `npm run dev` in `client` and open the URL Vite prints.

In development the client uses `http://localhost:5000` by default. The production build calls `/api` on the same origin. Set `VITE_API_URL` before running or building the client if the API uses a separate origin.

## Checks and production build

- In `server`, run `npm test` for the eligibility API tests. They use a local HTTP server and do not need MongoDB.
- In `client`, run `npm run lint` and `npm run build`. The build outputs static files in `client/dist`.
- In `client`, run `npx playwright install chromium` once, then `npm run test:e2e` to run desktop and mobile browser tests. They simulate API responses so they can cover outages and expired sessions without a live database. Set `PLAYWRIGHT_CHANNEL=chrome` to use an installed Chrome browser.

## Publish

Build from the repository root with `docker build -t schemesathi .`. Configure a container host to start the image with the production `MONGO_URI` and a long random `JWT_SECRET` from its secret store. The image serves the frontend and API together on port 5000 by default. The host may override `PORT`. Use the host's HTTPS endpoint and run `npm run seed` once, using the production database settings, to add any missing catalog entries.

Production uses the host's DNS resolver. If the MongoDB connection uses SRV records and the host resolver cannot resolve them, set `MONGO_DNS_SERVERS` to a comma-separated list of resolvers approved for your environment.

Keep `CORS_ORIGINS` unset for same-origin hosting. For a separately hosted frontend, set it to the exact HTTPS frontend origins, comma separated, and set `VITE_API_URL` at frontend build time. Set `TRUST_PROXY_HOPS` only if the app is reachable exclusively through that many trusted proxy hops and the proxy normalizes forwarded headers. Login and registration share a 20-request limit per client in a 15-minute window. The counter is per instance. Deploy a single instance with the built-in store or configure a shared rate-limit store before scaling out.

Set a host health check on `GET /api/health`. It returns HTTP 503 when MongoDB is unavailable. Keep the container's stderr logs and configure alerts for repeated `http_failure` events with HTTP 5xx, health-check failures, and `database_connection_failed`. HTTP 429 log events show when the auth limit is applied. Use the response's `X-Request-Id` to correlate a request with its error log.

## Maintain scheme information

Edit `server/catalog.js` to update the eight maintained entries. Existing scheme IDs and MongoDB records are preserved. The API publishes maintained titles, summaries, and source URLs for those slugs. Keep the questions in `client/src/eligibilityContent.js` and their checks in `server/routes/eligibility.js` aligned with official criteria.

Eligibility results explain whether the answers match the criteria checked by SchemeSathi. Users should confirm current rules with the official programme before applying. The housing check covers PMAY Urban 2.0. PM-JAY coverage for people below 70 requires checking the official beneficiary portal. The pension check covers old-age and widow pensions. The questionnaire directs disability pension applicants to verify applicable rules with their state office.

# SchemeSathi client

This React and Vite app shows the scheme catalogue, eligibility questionnaire, results, and help chat. It calls the Express API in `server/`.

## Run locally

Install Node.js 24, then follow the server setup in the [developer guide](../DEVELOPER_GUIDE.md#run-locally). With the API running, open PowerShell at the repository root and run:

```powershell
npm.cmd --prefix client ci
npm.cmd --prefix client run dev
```

Open the URL Vite prints. Use the same hostname for the Vite page and the API, such as `localhost`, so local sign-in works.

## Build

```powershell
npm.cmd --prefix client run build
```

Vite writes the production files to `client/dist/`. See the [developer guide](../DEVELOPER_GUIDE.md) for file locations, tests, and running the build with Express.

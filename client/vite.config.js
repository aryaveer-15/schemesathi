import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Ship only language copy and the exact English source. Reviewer details stay in the ledger.
const reviews = JSON.parse(readFileSync(new URL('../server/translationApprovals.json', import.meta.url), 'utf8'));
const published = Object.fromEntries(Object.entries(reviews).map(([lang, rows]) => [
  lang, Object.fromEntries(Object.entries(rows).map(([key, { english, text }]) => [key, { english, text }])),
]));
export default defineConfig({
  plugins: [react()],
  define: { __SCHEMESATHI_REVIEWS__: JSON.stringify(published) },
})

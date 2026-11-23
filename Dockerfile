FROM node:24-bookworm-slim AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=5000 HOST=0.0.0.0
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client-build /app/client/dist /app/client/dist
USER node
EXPOSE 5000
HEALTHCHECK CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/health').then(r => { if (!r.ok) process.exitCode = 1; }).catch(() => { process.exitCode = 1; })"
CMD ["node", "index.js"]

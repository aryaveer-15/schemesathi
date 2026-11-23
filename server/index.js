const dns = require('dns');
const path = require('node:path');

require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const createApp = require('./app');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '127.0.0.1';
const production = process.env.NODE_ENV === 'production';
const devOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5179', 'http://127.0.0.1:5179'];
const origins = process.env.CORS_ORIGINS?.split(',').map((value) => value.trim()).filter(Boolean)
  ?? (production ? [] : devOrigins);
const proxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
if (!Number.isSafeInteger(proxyHops) || proxyHops < 0) {
  throw new Error('TRUST_PROXY_HOPS must be a non-negative integer');
}
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  throw new Error('Set MONGO_URI and JWT_SECRET before starting SchemeSathi');
}
if (process.env.MONGO_DNS_SERVERS) {
  dns.setServers(process.env.MONGO_DNS_SERVERS.split(',').map((value) => value.trim()));
} else if (!production) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

const app = createApp({
  origins,
  proxyHops,
  isReady: () => mongoose.connection.readyState === 1,
  staticDir: production ? path.resolve(__dirname, '../client/dist') : undefined,
});

mongoose
  .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10_000 })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, HOST, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error(JSON.stringify({ event: 'database_connection_failed', code: err.code || err.name }));
    process.exit(1);
  });

function siteConfig(env) {
  const production = env.NODE_ENV === 'production';
  const onRender = env.RENDER === 'true';
  const mode = env.CSP_MODE ?? 'report-only';
  if (!['report-only', 'enforce'].includes(mode)) throw new Error('CSP_MODE must be report-only or enforce');
  const value = env.PUBLIC_SITE_ORIGIN || (onRender && env.RENDER_EXTERNAL_URL);
  if (!value && onRender) {
    throw new Error('Set PUBLIC_SITE_ORIGIN or provide RENDER_EXTERNAL_URL on Render');
  }
  const siteOrigin = value ? deploymentOrigin(value, production || onRender) : undefined;
  return { siteOrigin, cspReportOnly: mode === 'report-only' };
}

function deploymentOrigin(value, production) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Set PUBLIC_SITE_ORIGIN to a valid HTTP origin'); }
  if ((!production && url.protocol === 'http:' || url.protocol === 'https:')
    && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash) return url.origin;
  throw new Error('Set PUBLIC_SITE_ORIGIN to an HTTPS origin with no path, query or credentials');
}

module.exports = siteConfig;

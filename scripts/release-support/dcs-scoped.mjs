// Release adapter only. Original application/asset bytes stay in the accepted build.
export const PUBLIC_ORIGIN = 'https://www.tidesofknowing.com';
export const ASSET_PREFIX = '/_dcs-assets';
const authPaths = new Set(['/auth/login', '/auth/register', '/auth/check-email', '/auth/callback', '/auth/logout', '/auth/forgot-password', '/auth/password-update', '/auth/confirm-email']);
const privatePages = /^\/studio(?:\/|$)|^\/artists\/(?:collaborate|visual-design-exchange)\/?$|^\/ask-leilia\/admin\/studio-(?:access|artists|community|services)\/?$/;
const privateApis = /^\/api\/(?:studio|artists)(?:\/|$)/;
const pdf = /^\/api\/(?:ask-leilia\/requests\/[^/\\%]+\/delivery-pdf|reading-library\/[^/\\%]+\/pdf)\/?$/u;
const developmentPage = /^\/studio\/(?:avatar-lab|community-(?:demo|local|lab))(?:\/|$)/;
const trim = path => path.replace(/\/$/, '');
const unavailable = status => new Response('DCS request unavailable.', { status, headers: { 'Cache-Control': 'private, no-store' } });

// The existing normalizer intentionally defaults invalid/empty input to Studio.
// Routing therefore requires an explicit valid DCS shape BEFORE using it.
export function explicitDcsReturn(value, safeRedirect) {
  if (typeof value !== 'string' || value.length > 1200 || /[%\\\r\n]/.test(value)) return null;
  const path = value.split(/[?#]/)[0];
  const shape = /^\/studio(?:\/[A-Za-z0-9_-]+)*\/?$/.test(path) ||
    /^\/artists\/(?:collaborate|visual-design-exchange)\/?$/.test(path) ||
    (path === '/community/account/' || path === '/community/account') && new URL(value, PUBLIC_ORIGIN).searchParams.get('workspace') === 'studio' ||
    /^\/deck-creator-studio\/checkout\/?$/.test(path);
  if (!shape) return null;
  const safe = safeRedirect(value);
  if (path.startsWith('/deck-creator-studio/') && !safe.startsWith('/deck-creator-studio/checkout/?')) return null;
  return safe;
}

async function formReturn(request) {
  const type = request.headers.get('content-type') ?? '';
  if (!/^(application\/x-www-form-urlencoded|multipart\/form-data)(?:;|$)/i.test(type)) return null;
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > 65536)) return null;
  const clone = request.clone(), reader = clone.body?.getReader();
  if (!reader) return null;
  const chunks = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      // Do not await tee cancellation: the untouched original has not been consumed yet.
      if (size > 65536) { void reader.cancel().catch(() => {}); return null; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const form = await new Response(bytes, { headers: { 'content-type': type } }).formData();
    const values = form.getAll('redirectTo');
    return values.length === 1 && typeof values[0] === 'string' ? values[0] : null;
  } catch { return null; } finally { reader.releaseLock(); }
}

export async function classifyDcsRequest(request, safeRedirect) {
  const url = new URL(request.url), path = url.pathname;
  if (url.origin !== PUBLIC_ORIGIN) return { target: 'private-worker' };
  if (/^\/(?:studio|api\/(?:studio|artists))%/i.test(path)) return { target: 'reject', status: 400 };
  if (path === ASSET_PREFIX || path.startsWith(ASSET_PREFIX + '/')) return { target: 'asset' };
  if (privatePages.test(path) || privateApis.test(path)) {
    if (/%|\\/.test(path)) return { target: 'reject', status: 400 };
    if (developmentPage.test(path)) return { target: 'reject', status: 404 };
    return { target: 'app' };
  }
  if (['GET', 'HEAD'].includes(request.method)) {
    let decoded = path;
    for (let depth = 0; depth < 4; depth++) {
      if (pdf.test(decoded)) return depth > 1 ? { target: 'reject', status: 400 } : { target: 'app' };
      if (!decoded.includes('%')) break;
      try { decoded = decodeURIComponent(decoded); } catch { break; }
    }
    // Encoded separators must not send a signer-shaped URL to the older origin.
    if (/^\/api\/(?:ask-leilia\/requests|reading-library)\//.test(path) && /\/(?:delivery-pdf|pdf)\/?$/.test(decoded) && /%|\\|\.\./.test(path)) return { target: 'reject', status: 400 };
  }
  if (trim(path) === '/community/sections/deck-creator-studio') return ['GET', 'HEAD'].includes(request.method)
    ? { target: 'redirect', location: '/studio/private-community/' } : { target: 'app' };
  if (trim(path) === '/community/account' && url.searchParams.get('workspace') === 'studio') return { target: 'app' };
  if (trim(path) === '/deck-creator-studio/checkout') return { target: 'app' };
  // Serve one restored account generation on the public auth wildcard; private perimeter remains unchanged.
  if (authPaths.has(trim(path))) {
    if (url.searchParams.getAll('redirectTo').length > 1) return { target: 'reject', status: 400 };
    return { target: 'app' };
  }
  return { target: 'pages' };
}

export function rewriteDcsHtml(response, request, manifest, safeRedirect, createRewriter) {
  if (!response.body || !/\btext\/html\b/i.test(response.headers.get('content-type') ?? '')) return response;
  const assets = new Set(Object.keys(manifest.assets));
  const base = new URL(request.url);
  const returnTo = explicitDcsReturn(base.searchParams.get('redirectTo'), safeRedirect) ?? explicitDcsReturn(base.pathname, safeRedirect);
  const assetUrl = value => {
    if (!value) return value;
    let url; try { url = new URL(value, base); } catch { return value; }
    if (url.origin !== PUBLIC_ORIGIN || !assets.has(url.pathname)) return value;
    return ASSET_PREFIX + url.pathname + url.search + url.hash;
  };
  const rewriter = createRewriter();
  for (const [selector, attr] of [['script[src]', 'src'], ['link[href]', 'href'], ['img[src]', 'src'], ['source[src]', 'src'], ['video[poster]', 'poster']]) {
    rewriter.on(selector, { element(element) {
      if (selector === 'link[href]' && /(?:canonical|alternate)/i.test(element.getAttribute('rel') ?? '')) return;
      const value = element.getAttribute(attr), next = assetUrl(value);
      if (value !== next) element.setAttribute(attr, next);
    } });
  }
  for (const [selector, attr] of [['img[srcset]', 'srcset'], ['source[srcset]', 'srcset'], ['link[imagesrcset]', 'imagesrcset']]) {
    rewriter.on(selector, { element(element) {
      const value = element.getAttribute(attr);
      element.setAttribute(attr, value.replace(/(^|[,\s])((?:https:\/\/www\.tidesofknowing\.com)?\/[^\s,]+)(?=\s|,|$)/g,
        (_all, separator, url) => separator + assetUrl(url)));
    } });
  }
  // Each inline module gets bounded, request-local state; chunk boundaries can split URLs.
  let moduleText = '';
  rewriter.on('script[type="module"]:not([src])', {
    element() { moduleText = ''; },
    text(chunk) {
      moduleText += chunk.text;
      if (moduleText.length > 131072) throw Error('DCS inline module exceeds the reviewed bound.');
      if (!chunk.lastInTextNode) { chunk.remove(); return; }
      const text = moduleText.replace(/(["'`])(\/_astro\/[^"'`\s]+)\1/g, (all, quote, value) => quote + assetUrl(value) + quote);
      chunk.replace(text, { html: true }); moduleText = '';
    }
  });
  const markAuth = (element, attr) => {
    const value = element.getAttribute(attr); if (!value) return;
    let url; try { url = new URL(value.replace(/&(?:amp|#0*38|#x0*26);/gi, '&'), base); } catch { return; }
    if (url.origin !== PUBLIC_ORIGIN || !authPaths.has(trim(url.pathname))) return;
    if (returnTo && !url.searchParams.has('redirectTo')) {
      url.searchParams.set('redirectTo', returnTo);
      element.setAttribute(attr, url.pathname + url.search + url.hash);
    }
  };
  rewriter.on('form[action]', { element: e => markAuth(e, 'action') });
  rewriter.on('a[href]', { element: e => markAuth(e, 'href') });
  const headers = new Headers(response.headers);
  // Changed HTML must not retain a length/digest/validator for its prior representation.
  for (const name of ['content-length', 'etag', 'content-md5', 'digest', 'content-digest']) headers.delete(name);
  headers.set('Cache-Control', 'private, no-store');
  return rewriter.transform(new Response(response.body, { status: response.status, statusText: response.statusText, headers }));
}


// Reach the existing guarded DCS history handlers through the existing scoped
// Studio/API routes. No new Cloudflare route or legacy application is activated.
export function historyDispatchRequest(request){
 const url=new URL(request.url),p=url.pathname;let original=null;
 if(/^\/studio\/community-history\/[A-Za-z0-9_-]+(?:\/edit)?\/?$/.test(p))original=p.replace('/studio/community-history/','/community/');
 else if(/^\/api\/studio\/community-history\/(?:posts\/[A-Za-z0-9_-]+(?:\/replies)?|replies\/[A-Za-z0-9_-]+|reports)\/?$/.test(p))original=p.replace('/api/studio/community-history/','/api/community/');
 else if(p.startsWith('/studio/community-history')||p.startsWith('/api/studio/community-history'))return null;
 if(!original)return request;url.pathname=original;return new Request(url,request);
}

export function withScopedDcs(worker, originFetch, manifest, safeRedirect, createRewriter = () => new HTMLRewriter()) {
  return { ...worker, async fetch(request, env, context) {
    const route = await classifyDcsRequest(request, safeRedirect);
    if (route.target === 'private-worker') { const dispatch=historyDispatchRequest(request);return dispatch?worker.fetch(dispatch,env,context):unavailable(404); }
    if (route.target === 'reject') return unavailable(route.status);
    if (route.target === 'redirect') return new Response(null, { status: 303, headers: { Location: route.location, 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
    if (route.target === 'pages') return originFetch(request, { redirect: 'manual' });
    if (route.target === 'asset') {
      if (!['GET', 'HEAD'].includes(request.method)) return unavailable(405);
      const url = new URL(request.url), original = url.pathname.slice(ASSET_PREFIX.length);
      if (!manifest.assets[original] || /%|\\/.test(original)) return unavailable(404);
      if (!env.ASSETS?.fetch) return unavailable(503);
      url.pathname = original;
      return env.ASSETS.fetch(new Request(url, request));
    }
    const dispatch=historyDispatchRequest(request);if(!dispatch)return unavailable(404);
    const response = await worker.fetch(dispatch, env, context);
    return rewriteDcsHtml(response, request, manifest, safeRedirect, createRewriter);
  } };
}

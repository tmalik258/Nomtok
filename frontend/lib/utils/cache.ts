import type { AxiosInstance, AxiosRequestConfig } from 'axios';

type StorageType = 'local' | 'session';

interface CacheEntry<T> {
  data: T;
  etag?: string;
  timestamp: number; // ms since epoch
  ttl: number; // ms
}

interface CacheOptions {
  ttlMs?: number; // default 5 minutes
  storage?: StorageType; // default 'local'
  namespace?: string; // default 'nomtok'
  preferCache?: boolean; // if true, return cache if fresh
  maxKeysPerNamespace?: number; // default 200
}

interface CachedGetOptions extends CacheOptions {
  // Allow providing a key suffix for multi-variant caching
  keySuffix?: string;
}

const DEFAULTS: Required<CacheOptions> = {
  ttlMs: 5 * 60 * 1000,
  storage: 'local',
  namespace: 'nomtok',
  preferCache: true,
  maxKeysPerNamespace: 200,
};

const metrics = {
  hits: 0,
  misses: 0,
  stale: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
  lastGetDurationMs: 0,
  lastNetworkDurationMs: 0,
};

function getStore(storage: StorageType): Storage {
  if (storage === 'session') return window.sessionStorage;
  return window.localStorage;
}

function stableStringify(obj: any): string {
  try {
    return JSON.stringify(obj, Object.keys(obj).sort());
  } catch {
    return JSON.stringify(obj);
  }
}

function buildKey(namespace: string, url: string, params?: Record<string, any>, suffix?: string): string {
  const origin = url.replace(/^https?:\/\/[^/]+/, '');
  const paramsStr = params ? stableStringify(params) : '';
  const sfx = suffix ? `:${suffix}` : '';
  return `${namespace}:${origin}:${paramsStr}${sfx}`;
}

function readEntry<T>(opts: Required<CacheOptions>, key: string): CacheEntry<T> | null {
  try {
    const store = getStore(opts.storage);
    const raw = store.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    return parsed;
  } catch (e) {
    metrics.errors++;
    return null;
  }
}

function writeEntry<T>(opts: Required<CacheOptions>, key: string, entry: CacheEntry<T>) {
  try {
    const store = getStore(opts.storage);
    store.setItem(key, JSON.stringify(entry));
    metrics.sets++;
    enforceMaxKeys(opts);
  } catch (e) {
    metrics.errors++;
  }
}

function enforceMaxKeys(opts: Required<CacheOptions>) {
  // Best-effort cap keys per namespace; remove oldest by timestamp
  try {
    const store = getStore(opts.storage);
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && k.startsWith(`${opts.namespace}:`)) keys.push(k);
    }
    if (keys.length <= opts.maxKeysPerNamespace) return;
    // Collect timestamps
    const entries = keys.map(k => {
      const raw = store.getItem(k);
      let ts = 0;
      if (raw) {
        try {
          const { timestamp } = JSON.parse(raw);
          ts = timestamp || 0;
        } catch {}
      }
      return { k, ts };
    });
    entries.sort((a, b) => a.ts - b.ts);
    const toRemove = entries.length - opts.maxKeysPerNamespace;
    for (let i = 0; i < toRemove; i++) {
      store.removeItem(entries[i].k);
      metrics.deletes++;
    }
  } catch {}
}

export function invalidatePrefix(prefix: string, options?: CacheOptions) {
  const opts: Required<CacheOptions> = { ...DEFAULTS, ...(options || {}) };
  const store = getStore(opts.storage);
  const fullPrefix = `${opts.namespace}:${prefix}`;
  const toDelete: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k && k.startsWith(fullPrefix)) toDelete.push(k);
  }
  toDelete.forEach(k => store.removeItem(k));
  metrics.deletes += toDelete.length;
}

export function clearAll(options?: CacheOptions) {
  const opts: Required<CacheOptions> = { ...DEFAULTS, ...(options || {}) };
  const store = getStore(opts.storage);
  const toDelete: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (k && k.startsWith(`${opts.namespace}:`)) toDelete.push(k);
  }
  toDelete.forEach(k => store.removeItem(k));
  metrics.deletes += toDelete.length;
}

export function getMetrics() {
  return { ...metrics };
}

export async function cachedAxiosGet<T>(
  axios: AxiosInstance,
  url: string,
  config?: AxiosRequestConfig,
  options?: CachedGetOptions
): Promise<{ data: T; fromCache: boolean; isStale: boolean; etag?: string }> {
  const opts: Required<CacheOptions> = { ...DEFAULTS, ...(options || {}) };
  const startGet = performance.now();
  const key = buildKey(opts.namespace, url, config?.params, options?.keySuffix);
  const entry = readEntry<T>(opts, key);

  const now = Date.now();
  const fresh = !!entry && now - entry.timestamp < entry.ttl;

  if (opts.preferCache && entry && fresh) {
    metrics.hits++;
    metrics.lastGetDurationMs = performance.now() - startGet;
    return { data: entry.data, fromCache: true, isStale: false, etag: entry.etag };
  }

  const headers = { ...(config?.headers || {}) } as Record<string, string>;
  if (entry?.etag) {
    headers['If-None-Match'] = entry.etag;
  }

  const startNet = performance.now();
  try {
    const resp = await axios.get<T>(url, { ...config, headers });
    metrics.lastNetworkDurationMs = performance.now() - startNet;
    const etag = (resp.headers as any)?.etag as string | undefined;
    const newEntry: CacheEntry<T> = {
      data: resp.data,
      etag,
      timestamp: Date.now(),
      ttl: opts.ttlMs,
    };
    writeEntry(opts, key, newEntry);
    metrics.misses += entry && !fresh ? 1 : (entry ? 0 : 1);
    metrics.lastGetDurationMs = performance.now() - startGet;
    return { data: resp.data, fromCache: false, isStale: false, etag };
  } catch (err: any) {
    // Handle 304 Not Modified: use cache
    const status = err?.response?.status;
    if (status === 304 && entry) {
      metrics.hits++;
      metrics.lastNetworkDurationMs = performance.now() - startNet;
      metrics.lastGetDurationMs = performance.now() - startGet;
      return { data: entry.data, fromCache: true, isStale: false, etag: entry.etag };
    }
    // Network error: serve stale if available
    if (entry) {
      metrics.stale++;
      metrics.errors++;
      metrics.lastNetworkDurationMs = performance.now() - startNet;
      metrics.lastGetDurationMs = performance.now() - startGet;
      return { data: entry.data, fromCache: true, isStale: true, etag: entry.etag };
    }
    metrics.errors++;
    metrics.lastNetworkDurationMs = performance.now() - startNet;
    metrics.lastGetDurationMs = performance.now() - startGet;
    throw err;
  }
}

// Dev helpers
declare global {
  interface Window { __cacheDebug?: any }
}

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  if (!window.__cacheDebug) {
    window.__cacheDebug = {
      metrics: getMetrics,
      clearAll,
      invalidatePrefix,
      DEFAULTS,
    };
  }
}
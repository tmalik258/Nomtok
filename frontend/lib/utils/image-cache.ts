// Image URL cache and validation utilities with TTL and metrics
// Store per-restaurant cached image URLs in localStorage and validate via Image preload

type CacheEntry = {
  url: string;
  validatedAt: number; // ms epoch
  ttlMs: number;
  failures?: number;
};

type Metrics = {
  hits: number;
  misses: number;
  sets: number;
  validations: number;
  validationErrors: number;
  validationAvgMs: number;
};

const NAMESPACE = "nomtok:image";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const metrics: Metrics = {
  hits: 0,
  misses: 0,
  sets: 0,
  validations: 0,
  validationErrors: 0,
  validationAvgMs: 0,
};

function keyFor(slug: string) {
  return `${NAMESPACE}:${slug}`;
}

function getStore() {
  return typeof window !== "undefined" ? window.localStorage : undefined;
}

function read(slug: string): CacheEntry | null {
  try {
    const store = getStore();
    if (!store) return null;
    const raw = store.getItem(keyFor(slug));
    if (!raw) {
      metrics.misses++;
      return null;
    }
    const entry = JSON.parse(raw) as CacheEntry;
    const now = Date.now();
    const fresh = now - (entry.validatedAt || 0) < entry.ttlMs;
    if (fresh) {
      metrics.hits++;
      return entry;
    }
    metrics.misses++;
    return null;
  } catch {
    metrics.misses++;
    return null;
  }
}

function write(slug: string, url: string, ttlMs: number = DEFAULT_TTL_MS) {
  try {
    const store = getStore();
    if (!store) return;
    const entry: CacheEntry = {
      url,
      validatedAt: Date.now(),
      ttlMs,
      failures: 0,
    };
    store.setItem(keyFor(slug), JSON.stringify(entry));
    metrics.sets++;
  } catch {}
}

export async function validateImageUrl(url: string, timeoutMs: number = 3500): Promise<boolean> {
  const t0 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
  metrics.validations++;
  return new Promise<boolean>((resolve) => {
    try {
      const img = new Image();
      let done = false;
      const finish = (ok: boolean) => {
        if (done) return;
        done = true;
        const t1 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
        const duration = Math.max(0, t1 - t0);
        // incremental avg
        metrics.validationAvgMs = metrics.validationAvgMs === 0
          ? duration
          : (metrics.validationAvgMs * 0.9 + duration * 0.1);
        resolve(ok);
      };
      const timer = setTimeout(() => finish(false), timeoutMs);
      img.referrerPolicy = "no-referrer";
      img.onload = () => {
        clearTimeout(timer);
        finish(true);
      };
      img.onerror = () => {
        clearTimeout(timer);
        metrics.validationErrors++;
        finish(false);
      };
      img.src = url;
    } catch {
      metrics.validationErrors++;
      resolve(false);
    }
  });
}

export function getCachedUrl(slug: string): string | null {
  const entry = read(slug);
  return entry?.url || null;
}

export function setCachedUrl(slug: string, url: string, ttlMs?: number) {
  write(slug, url, ttlMs ?? DEFAULT_TTL_MS);
}

export function getMetrics() {
  return { ...metrics };
}

declare global {
  interface Window { __imageCacheDebug?: { metrics: () => Metrics } }
}

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  if (!window.__imageCacheDebug) {
    window.__imageCacheDebug = { metrics: () => ({ ...metrics }) };
  }
}
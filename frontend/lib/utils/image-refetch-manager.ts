import api from "@/lib/api";

type InFlight = Map<string, Promise<string | null>>;
const inFlight: InFlight = new Map();

const NS = "nomtok:image:last_refetch";
const MIN_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

function lastKey(slug: string) {
  return `${NS}:${slug}`;
}

function getStore() {
  return typeof window !== "undefined" ? window.localStorage : undefined;
}

function getLastRefetch(slug: string): number | null {
  try {
    const s = getStore();
    if (!s) return null;
    const v = s.getItem(lastKey(slug));
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

function setLastRefetch(slug: string, ts: number = Date.now()) {
  try {
    const s = getStore();
    if (!s) return;
    s.setItem(lastKey(slug), String(ts));
  } catch {}
}

type HttpError = { response?: { status?: number }; message?: string };
function isHttpError(e: unknown): e is HttpError {
  return typeof e === "object" && e !== null && "response" in e;
}

export async function refetchPhoto(
  slug: string,
  opts?: { force?: boolean }
): Promise<string | null> {
  const existing = inFlight.get(slug);
  if (existing) return existing;

  const force = !!opts?.force;
  const now = Date.now();
  const last = getLastRefetch(slug) || 0;
  if (!force && now - last < MIN_INTERVAL_MS) {
    console.info(`[image] Refetch throttled for ${slug} (${now - last}ms since last)`);
    return null;
  }

  const p = (async () => {
    const t0 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    try {
      const resp = await api.post(`/restaurants/${slug}/refetch-photo/`);
      const url = resp?.data?.photo_url as string | undefined;
      const t1 = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
      console.info(`[image] Refetched photo for ${slug} in ${(t1 - t0).toFixed(0)}ms`);
      if (url) {
        setLastRefetch(slug);
        return url;
      }
      return null;
    } catch (e: unknown) {
      const status = isHttpError(e) ? e.response?.status : undefined;
      if (status === 429) {
        console.warn(`[image] Refetch rate limited for ${slug}`);
        return null;
      }
      const msg = isHttpError(e) ? e.message : String(e);
      console.warn(`[image] Refetch failed for ${slug}:`, msg);
      return null;
    } finally {
      inFlight.delete(slug);
    }
  })();

  inFlight.set(slug, p);
  return p;
}
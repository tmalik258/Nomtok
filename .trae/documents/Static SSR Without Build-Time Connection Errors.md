## Recommendation
Given your current behavior is valid and working, I recommend staying with Dynamic SSR for the Home page if your initial SEO payload and build-time simplicity are the priorities. It avoids build-time network coupling and keeps deployments robust. If you need strictly static prerendered HTML on deploy while still avoiding build-time failures, implement Static ISR with a build-time fetch guard as detailed below.

## Option A — Keep Dynamic SSR (Current)
- Keep `export const dynamic = 'force-dynamic'` in `app/(routes)/page.tsx`.
- Continue using `unstable_cache({ revalidate: 3600 })` so responses cache for an hour at runtime.
- Pros: No build-time backend dependency; simplest; robust across CI/CD.
- Cons: First request after deploy performs runtime fetch (not fully static at deploy time).

## Option B — Static ISR Without Build-Time Errors
- Goal: Keep static SSR/ISR while eliminating build-time backend requests and errors.
- Steps:
  1. Builder env guard:
     - In `frontend/Dockerfile.prod` (builder stage only), set `SKIP_REMOTE_FETCH_AT_BUILD=1`.
  2. Fetch gating:
     - In `frontend/lib/actions/home-actions.ts`, early return empty arrays when `process.env.SKIP_REMOTE_FETCH_AT_BUILD === '1'`; otherwise run axios calls.
     - Retain current API URL sanitation.
  3. Restore Static ISR:
     - Remove `export const dynamic = 'force-dynamic'` from `app/(routes)/page.tsx`.
     - Keep `export const revalidate = 3600` and `unstable_cache` so ISR populates at runtime.
  4. Optional helper:
     - Add `lib/utils/env.ts` with `getApiBaseUrl()` to sanitize and centralize `NEXT_PUBLIC_API_URL`.
- Pros: Static HTML at build; no build-time network; runtime ISR fills on first request.
- Cons: Initial deploy serves placeholders until first runtime request triggers ISR.

## Option C — Include Real Data At Build (Environment-Dependent)
- Builder-stage `NEXT_PUBLIC_API_URL=http://host.docker.internal:8030` (Windows/macOS only) to reach host backend during `next build`.
- Pros: Fully static with real data at build.
- Cons: Fragile on Linux CI; couples build to backend availability.

## Verification
- For Option B/C, run `next build` and confirm no `ENOTFOUND backend` logs.
- Hit `/` post-deploy; Option B should populate ISR cache on first request; Option C will already have data in the static output.

## Decision Points
- Choose Option A if simplicity and reliability are primary.
- Choose Option B if you want static ISR while keeping builds clean.
- Choose Option C only if your builder can reliably reach the backend (Windows/macOS dev), not recommended for Linux CI.

## Next Steps (If You Want Changes)
- Let me know which option to implement; I will apply the corresponding code and Dockerfile updates and verify with a production build.
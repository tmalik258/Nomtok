## Findings
- No `<img>` is present for the main card image; the component renders an initial-letter fallback, so the browser makes no image request.
- In `components/restaurant-image.tsx`, when `src` is absent and no cached URL exists, the code sets `isValid=false` and returns without triggering a refetch; this explains the “no network request” state when the restaurant has no `photo_url` or an empty value.
- Pre-validation uses a hidden `<img>` via `validateImageUrl`; if validation never runs due to missing `currentSrc`, neither the optimizer nor the preload performs a request.
- If a cached URL exists but fails validation, the code calls `tryRefetch(false)` which may be throttled for 2 minutes, causing no POST in that window.
- The influencer avatar uses Next/Image and loads fine; the issue is specific to the main restaurant image.

### Code References
- Initial fallback path: `frontend/components/restaurant-image.tsx:60–74`
- Validation and conditional refetch: `frontend/components/restaurant-image.tsx:75–81`
- Restaurant card consuming the image: `frontend/components/restaurant-card.tsx:56–63`
- API proxy for refetch endpoint: `frontend/next.config.ts:96–111`

## Verification Plan (Read-only)
1. Inspect restaurant data (`lib/actions/restaurant-actions.ts`) to confirm if `photo_url` is null/empty for the affected card.
2. Validate expected URL structure from backend (usually `lh3.googleusercontent.com` or Cloudinary) and attempt direct access in a separate tab.
3. Check DevTools Network:
   - Confirm that no requests are fired because the component renders fallback instead of `<Image>`.
   - Verify no hidden requests from `validateImageUrl` when `src` is null.
4. Inspect DOM:
   - Confirm the main card uses `RestaurantImage` and renders a `<div>` fallback (no `<img>`), so no request is made.
5. Console:
   - Look for `[image] Refetch throttled` or other logs indicating suppressed refetch.

## Fix Plan
- Trigger refetch when `src` is missing:
  - In `RestaurantImage` useEffect branch where `!currentSrc` and no cached URL, call `tryRefetch(true)` to fetch a fresh `photo_url` immediately.
- Keep forced refetch on explicit render failures:
  - Ensure `onError` continues to call `tryRefetch(true)` to bypass throttling and recover quickly.
- Reduce optimizer mismatches:
  - For `lh3.googleusercontent.com`, use Next/Image `unoptimized` to avoid server-side fetch failures while still using Next/Image.
- Observability:
  - Add concise logs around initial-no-src case and refetch attempts to correlate with Network panel.

## Post-Fix Validation
- Load Restaurants list and a specific restaurant page; confirm a `POST /api/restaurants/:slug/refetch-photo/` occurs when `photo_url` is absent and the image subsequently renders.
- Verify direct image GET returns `200 OK` and the browser displays the image.
- Confirm Network shows the requests and no long throttling blocks recovery.
- Watch backend logs to ensure refetch endpoint stability (address DB pool issues if observed).
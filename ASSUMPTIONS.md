# Assumptions

- Initial launch includes only `Bonded Custom Hat`; t-shirt stays coming-soon but fully modeled.
- Determinism is enforced through strict canonicalization (rotate by EXIF, resize max 1024, PNG output) and frozen configs.
- If automated DST QA fails, checkout moves to `NEEDS_REVIEW` gate before production.
- Side Bonded logo is treated as pre-digitized reusable asset and not regenerated per order.
- Shipping starts as flat rate by Chilean region, with provider abstraction for Blue Express/Chilexpress integrations.
- Legal pages are template content requiring lawyer review before go-live.

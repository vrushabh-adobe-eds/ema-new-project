# Reusable Blocks Library — What Exists & Where to See It

## Status
Two related things are live for this project. The **consolidated base+variant blocks** are on PR #35 (`blocks-reusable → main`, all checks green, awaiting merge). The **DA Blocks Library** panel was reconsolidated to match.

## A. The reusable blocks (base + variant model)
After consolidation, authors pick a **base block with a variant** instead of a separate block per use. Each base re-applies its legacy classes so styling/behavior is unchanged.

| Base block | Variants | Notes |
|---|---|---|
| `carousel` | hero, gallery | hero is query-index driven (slide paths → query index) |
| `hero` | promo, intro | promo demotes h1→h2, image-bottom card |
| `columns` | featured | WKND featured-article teaser |
| `cards` | teaser, related | related = title+date list, no image |
| `accordion` | faq | sheet-driven (`faq-data.json`), no static fallback |
| `tabs` | adventure | Overview / Itinerary / What to Bring |

**Kept as their own query-index blocks (not folded):** `article-list` (+ tabs / members / related), `contributors`.
**Standalone blocks:** `adventure-details`, `article-author`, `social-links`, `widget`.
**Structural (never in library):** `header`, `footer`, `fragment`.

## B. The DA Blocks Library panel (what authors browse)
- **How authors open it:** in the DA editor (`da.live/edit#/vrushabh-adobe-eds/ema-new-project/...`), the left toolbar **Library** icon → **Blocks**.
- **Entries (15, consolidated):** Carousel · Hero · Columns · Cards · Accordion · Tabs · Article List · Article List (tabs) · Article List (members) · Article List (related) · Contributors · Adventure Details · Article Author · Social Links · Widget
  - The 6 base entries each show their variants as example sections; query-index + standalone blocks are listed individually.
- **How it's wired:** DA site `library` config → `/block-library/blocks.json` manifest → one example doc per entry under `/block-library/<slug>`.

## C. Verify directly (no DA editor needed)
- Manifest: `https://blocks-reusable--ema-new-project--vrushabh-adobe-eds.aem.page/block-library/blocks.json`
- Example doc, e.g.: `…/block-library/carousel` (shows Carousel hero + gallery variants)
- (After PR #35 merges, the same paths resolve on `main--…`.)

## Checklist
- [x] Consolidate blocks into base + variants (carousel/hero/columns/cards/accordion/tabs) — done on `blocks-reusable`
- [x] Keep query-index blocks (article-list, contributors) separate
- [x] Rebuild DA Blocks Library to 15 consolidated entries + example docs
- [x] Fix homepage PageSpeed (84→99) and get PR #35 checks green
- [ ] Merge PR #35 (`blocks-reusable → main`) so the consolidated blocks + library reach production *(requires Execute mode)*
- [ ] After merge: open DA editor → Library → confirm the 15 consolidated entries appear and insert correctly
- [ ] Follow-up: delete fallback block folders (carousel-hero, carousel-gallery, hero-promo, hero-intro, columns-featured, cards-teaser, cards-related, accordion-faq, tabs-adventure) once production is verified *(requires Execute mode)*

**Note:** This is an informational summary of the reusable blocks library — no code changes needed to answer it. The remaining checklist items (merging PR #35, post-merge verification, deleting the fallback folders) are actions that require **Execute mode**; this session is in Plan mode, so those are paused. Switch to Execute mode and tell me which one to do next.

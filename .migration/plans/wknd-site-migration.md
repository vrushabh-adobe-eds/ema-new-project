# WKND Site Migration Plan

Migrate `https://wknd.site/us/en.html` (WKND Adventures) to this AEM Edge Delivery project, satisfying the must-have features and acceptance-criteria rubric. Approach: **scope → content migration → styling/design per page/block**.

## Decisions confirmed
- **Scope:** Full site (home, magazine landing, 5 articles, about, adventures, faqs)
- **URL structure:** Preserve `/us/en` locale prefix (1:1 with source); old external paths still redirect
- **Language/region selector:** Omit — single locale, no MSM/multi-locale plumbing
- **Article-list block:** Build new (query-index-driven)
- **Content source:** Document Authoring (da.live) → `vrushabh-adobe-eds/ema-new-project`
- **Redirects:** User will specify the ≥2 old→new URL pairs (prompt at that step)

## Scope (analyzed from source)

**Pages (paths preserve `/us/en`):**
- Home — `/us/en`
- Magazine landing — `/us/en/magazine`
- Magazine articles (5) — `/us/en/magazine/{western-australia, arctic-surfing, san-diego-surf, ski-touring, guide-la-skateparks}`
- About Us — `/us/en/about-us`
- Adventures — `/us/en/adventures`
- FAQs — `/us/en/faqs`

**Blocks (map to Block Collection patterns):**
- `header` / `footer` (scaffolded — restyle to WKND; header **without** region selector)
- `hero` / hero-carousel (home)
- `cards` — article/adventure grids (exists — add variants)
- `columns` (exists)
- **`article-list`** (NEW) — query-index-driven dynamic Magazine listing (the "Day 4" block)
- **`social-links`** (NEW custom block)
- **`article-author`** (NEW custom block — writer/photographer name, avatar, title)
- `contributors`/`teaser` for About Us profiles (likely cards variant)

**Site plumbing:**
- `helix-query.yaml` — index Magazine articles under `/us/en/magazine/` (path, title, image, author, description, date)
- Per-page + bulk metadata on Magazine pages
- Redirects — ≥2 old→new 301 (user-specified)

## Progress tracking
Living tracking doc created as the **first execution action** at `.migration/MIGRATION_PLAN.md` — a copy of this checklist, checked off and annotated as each step completes, so the effort stays on track across sessions.

## Open item
- [ ] User to provide exact old→new redirect URL pairs (≥2) before Phase 2's redirects step (will prompt).

## Checklist

### Phase 0 — Setup & verification
- [ ] Create `.migration/MIGRATION_PLAN.md` tracking doc from this checklist
- [ ] Confirm dev server runs (`aem up`, localhost:3000) and DA content source (`vrushabh-adobe-eds/ema-new-project`) is reachable
- [ ] Confirm project type & Block Library endpoint via project-expert

### Phase 1 — Site scope & catalog
- [ ] URL discovery + site catalog on wknd.site (templates: home, magazine-landing, article, about, adventures, faqs)
- [ ] Per-page analysis — sections, content sequences, block variants
- [ ] Produce migration scope report; confirm block inventory (reuse vs. new)
- [ ] Update tracking doc with findings

### Phase 2 — Content migration (into DA)
- [ ] Build import infrastructure: page templates, block parsers, page transformers
- [ ] Generate & run bundled import script (via content-import skill) — never hand-author content HTML
- [ ] Import all pages under `/us/en/*`; verify each renders in local preview
- [ ] Set up `helix-query.yaml` indexing for Magazine articles
- [ ] Apply per-page + bulk metadata to Magazine pages
- [ ] Add redirects file with user-supplied ≥2 old→new 301 mappings
- [ ] Update tracking doc

### Phase 3 — New blocks (JS + CSS, Block Collection patterns)
- [ ] `social-links` custom block
- [ ] `article-author` custom block (name, avatar, title)
- [ ] `article-list` block (dynamic, reads query index)
- [ ] Wire About Us contributors/guides sections (cards variant or dedicated block)
- [ ] Update tracking doc

### Phase 4 — Styling / design migration (per page & block)
- [ ] Extract WKND design tokens (colors, fonts, spacing) into global styles
- [ ] Restyle header & footer to WKND
- [ ] Style hero/carousel, cards, columns to match source
- [ ] Style each new block; visual critique vs. source (target ~85%+ block/page similarity)
- [ ] Iterate per block until key blocks look right by eye
- [ ] Update tracking doc

### Phase 5 — QA against rubric
- [ ] Responsive: mobile / tablet / desktop breakpoints, no overflow
- [ ] Accessibility: Lighthouse 100, keyboard nav, meaningful alt text on all images
- [ ] Performance: mobile Lighthouse/PageSpeed 100 on home + one article; LCP/CLS "good"
- [ ] `npm run lint` passes (lint:fix as needed)
- [ ] Update tracking doc

### Phase 6 — Delivery & governance
- [ ] Feature branch → PR (nothing pushed straight to main)
- [ ] PR body includes preview URL to a changed page
- [ ] `gh pr checks` green (code sync, lint, perf)
- [ ] Preview + publish at least one page from da.live (content-workflow criterion)
- [ ] Final tracking-doc update marking migration complete

---
*No open questions remain (except the redirect URL pairs, deferred to Phase 2). Execution requires Execute mode. On approval: create `.migration/MIGRATION_PLAN.md`, then Phase 1 (site scope); pause for redirect URLs before Phase 2's redirects step.*

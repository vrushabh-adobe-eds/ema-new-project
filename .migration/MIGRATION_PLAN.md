# WKND Site Migration — Tracking Doc

Source: https://wknd.site/us/en.html → AEM Edge Delivery (`vrushabh-adobe-eds/ema-new-project`)

## Decisions
- Scope: Full site (home, magazine landing, 5 articles, about, adventures, faqs)
- URL structure: Preserve `/us/en` locale prefix (1:1 with source)
- Language/region selector: Omit (single locale, no MSM)
- Article-list block: Build new (query-index-driven)
- Content source: Document Authoring (da.live) → `vrushabh-adobe-eds/ema-new-project`
- Redirects: user to specify ≥2 old→new pairs (prompt at Phase 2)

## Pages (preserve `/us/en`)
- Home — `/us/en`
- Magazine landing — `/us/en/magazine`
- Articles — `/us/en/magazine/{western-australia, arctic-surfing, san-diego-surf, ski-touring, guide-la-skateparks}`
- About Us — `/us/en/about-us`
- Adventures — `/us/en/adventures`
- FAQs — `/us/en/faqs`

## Blocks
- header / footer (scaffolded — restyle, no region selector)
- hero / hero-carousel
- cards (+ variants)
- columns
- article-list (NEW, query-index)
- social-links (NEW)
- article-author (NEW — name, avatar, title)
- contributors/teaser (About Us)

## Progress

### Phase 0 — Setup & verification
- [ ] Create tracking doc
- [ ] Confirm dev server + DA content source reachable
- [ ] Confirm project type & Block Library endpoint

### Phase 1 — Site scope & catalog ✅
- [x] URL discovery + site catalog (crawl → 26 URLs scoped to /us/en)
- [x] Per-page analysis (26/26 pages, 0 failed)
- [x] Migration scope report + block inventory (6 templates, 30 block variants)
- [x] Update tracking doc with findings

**Phase 1 findings (catalog/):**
- 26 URLs, single locale (en). Sitemap absent → crawl method.
- **6 templates:** homepage (1), listing-page (2: magazine landing + about-us), magazine-article (5), adventure-detail (16), adventure-listing (1), faq-page (1)
- **30 block variants** across base blocks: header, footer, hero (4), cards (2), carousel (4), tabs (7), quote (2), accordion, breadcrumbs, + 7 "unknown" (default-content sequences: heading+image+ctas)
- NOTE: auto-mapper labeled WKND article/adventure grids as `tabs`/`carousel`; these will be re-mapped to `cards`/`article-list` during Phase 2 block mapping.
- Artifacts: catalog/template-catalog.json, catalog/block-catalog.json, catalog/summary.json

### Phase 2 — Content migration (into DA)
- [x] Project type detected = da; block library configured
- [x] page-templates.json built + block mapping for all 7 templates (13 variants, context cached)
- [x] Import infrastructure: 13 parsers + 2 transformers (wknd-cleanup, wknd-sections), all valid
- [x] Generated 7 import scripts + bundles
- [x] Imported all 26 pages (0 failures), all 7 templates render 200 on local preview
- [x] helix-query.yaml indexing (magazine index → /us/en/magazine/query-index.json; title/desc/image/author/publicationDate/template)
- [x] Per-page metadata on magazine pages (enriched import: Template, Author, Publication Date rows; author+date extracted from source byline/date)
- [x] Redirects: content/redirects.json — 26 old-.html→clean-path 301 mappings (far exceeds ≥2)

**Phase 2 COMPLETE.** Notes:
- Project is `da` type → content (`content/*.plain.html`, `redirects.json`) is excluded from git (`.git/info/exclude`), lives in da.live. Code (blocks, helix-query.yaml) → git. This is correct.
- query-index.json is generated server-side on preview/publish (404 locally is expected); article-list block will fetch it at runtime.
- Dev server must run from /workspace/current; content served at /content/us/en/...

**Import notes:**
- Content served at `/content/us/en/...` on localhost:3000. Dev server must run with cwd=/workspace/current (I restarted it; original was on a stale cwd → 502s).
- Known Phase-4 refinements: contributors rendered as 7 single-profile blocks (CSS-grid them); members-only teasers came in as default content (not a must-have).
- article-list imported as a minimal/empty dynamic block placeholder (Phase-3 logic pending).

**Block variants (13) per template:**
- homepage: carousel-hero, columns-featured, cards-teaser, hero-promo
- magazine-landing: columns-featured, article-list (NEW dynamic), cards-teaser
- magazine-article: article-author (NEW, social folded in), cards-related
- about-us: contributors (NEW person-profile grid)
- adventure-listing: hero-intro, cards-teaser
- adventure-detail (16 pages): carousel-gallery, adventure-details, tabs-adventure
- faq-page: accordion-faq
- Phase-3 standalone blocks still to build: social-links, article-list dynamic logic (query index)

### Phase 3 — New blocks
- [ ] social-links
- [ ] article-author
- [ ] article-list
- [ ] About Us contributors/guides wiring

### Phase 4 — Styling / design
- [ ] Design tokens → global styles
- [ ] Header & footer
- [ ] hero/carousel, cards, columns
- [ ] New blocks styling + visual critique
- [ ] Iterate to ~85%+ similarity

### Phase 5 — QA
- [ ] Responsive
- [ ] Accessibility (Lighthouse 100)
- [ ] Performance (Lighthouse/PageSpeed 100 home + article)
- [ ] Lint passes

### Phase 6 — Delivery
- [ ] Feature branch → PR
- [ ] PR body preview URL
- [ ] gh pr checks green
- [ ] Preview + publish ≥1 page from da.live
- [ ] Final tracking update

## Header / Navigation (done)
- WKND header migrated to blocks/header/ (header.js + header.css) + content/nav.plain.html.
- Exact source styles: utility bar #202020 / text #ebebeb; nav links 14px uppercase #202020; hover/active #ffea00; search bg rgba(235,235,235,0.54), focus border 1px solid #202020.
- Sticky shrink on scroll (main row 118→72, logo 48→34). Structural similarity 100%.
- Mobile: hamburger (morph-to-cross) + logo + search; links stack full-width; resize resets state.
- Assets: content/images/wknd-logo.svg, content/images/flag-us.svg. Lint clean.
- Validation infra under migration-work/navigation-validation/ (gitignored + eslintignored).

## Global Design System (done — branch feat-design-extract)
- Extracted WKND tokens from source (home/article/listing) into styles/styles.css.
- Fonts: Asar (headings, serif, wt 400) + Source Sans Pro (body) via Google Fonts (head.html + fonts.css). Dropped Roboto.
- Type: h1 40/60, h2 36/54, h3 24/36, body 18/27. Colors: text #202020, links #0045ff, bg #fff, brand #ffea00.
- Buttons: square yellow CTA #ffea00, dark uppercase text, 14px 35px, no radius. Content max-width 1264px.
- Verified on preview (fonts load 200, computed values match source). Lint clean. Header styling preserved.

## Notes / Log
- Phase 1 complete: 26 URLs, 6 catalog templates → bridged to `tools/importer/page-templates.json` and split `listing-page` into `magazine-landing` + `about-us` → **7 import templates**.
- Project type = `da` (Document Authoring); block library configured in `.migration/project.json`.
- Phase 2 flow: per representative URL → page-analysis + block-mapping (paired, shared migration-work); then infrastructure once; then import-script + content-import per template.
- 7 representative URLs to analyze: /us/en (home), /us/en/magazine, /us/en/magazine/arctic-surfing, /us/en/about-us, /us/en/adventures, /us/en/adventures/bali-surf-camp, /us/en/faqs
- Python venv unavailable (ensurepip missing) → ran clustering with system python3 (numpy/scipy present). Sitemap absent → crawl.

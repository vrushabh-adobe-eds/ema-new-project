/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the "Members Only" section on the magazine landing page.
 * Base block: article-list (dynamic, query-index driven — members mode).
 * Source: https://wknd.site/us/en/magazine.html (.cmp-teaser--secure).
 *
 * article-list "members" mode reads the magazine query index at render time and
 * shows only entries flagged `members=true`, rendered as locked secure cards.
 *
 * Because the query-index config (helix-query.yaml) only takes effect once it is
 * on the default branch, this parser also serializes the authored member cards
 * as a STATIC FALLBACK so the section renders immediately. At render time the
 * block prefers the dynamic index results and falls back to these rows when the
 * index has no members yet.
 *
 * Emitted rows:
 *   row 1: "members"                              (enables members mode)
 *   row 2: the magazine query-index path
 *   row 3+: one fallback card each → [ body(title h3 + desc + Read More), image ]
 *
 * Acts only on the first secure teaser and removes the rest so the section
 * collapses to a single dynamic block.
 */
export default function parse(element, { document }) {
  const SEL = '.cmp-teaser--secure';
  const teasers = Array.from(document.querySelectorAll(SEL));
  if (!teasers.length) { element.replaceWith(...element.childNodes); return; }
  if (teasers[0] !== element) { if (element.parentNode) element.remove(); return; }

  const cells = [['members'], ['/us/en/magazine/query-index.json']];

  teasers.forEach((teaser) => {
    const image = teaser.querySelector('img');
    const titleEl = teaser.querySelector('.cmp-teaser__title, [class*="title"], h1, h2, h3');
    const descEl = teaser.querySelector('.cmp-teaser__description, [class*="description"], p');

    const body = [];
    if (titleEl) {
      const h = document.createElement('h3');
      h.textContent = titleEl.textContent.trim();
      body.push(h);
    }
    if (descEl && descEl.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = descEl.textContent.trim();
      body.push(p);
    }
    // Non-linking "Read More" affordance (content is locked).
    const cta = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = 'Read More';
    cta.append(strong);
    body.push(cta);

    // Fallback card row: [ body cell, image cell ]. The block classifies the
    // image-only cell as the image and the other as the body.
    cells.push([body, image || '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-list', cells });

  teasers.slice(1).forEach((t) => { if (t.parentNode) t.remove(); });
  element.replaceWith(block);
}

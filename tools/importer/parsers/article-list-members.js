/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the "Members Only" section on the magazine landing page.
 * Base block: article-list (dynamic, query-index driven — members mode).
 * Source: https://wknd.site/us/en/magazine.html (.cmp-teaser--secure).
 *
 * IMPORTANT: article-list is a dynamic block. In members mode it reads the
 * magazine query index at render time and shows only entries flagged
 * `members=true`, rendering them as locked secure cards. The parser therefore
 * emits ONLY a config table (no static card content):
 *   row 1: "members"  (enables members mode)
 *   row 2: the magazine query-index path
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
  const block = WebImporter.Blocks.createBlock(document, { name: 'article-list', cells });

  teasers.slice(1).forEach((t) => { if (t.parentNode) t.remove(); });
  element.replaceWith(block);
}

/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-list — DYNAMIC, reusable listing block.
 * Sources:
 *   - Recent Articles (homepage) / Magazine landing → magazine query index
 *   - "Where do you want to go?" (homepage) / Adventures landing → adventures query index
 *
 * IMPORTANT: article-list is a dynamic block. At render time it reads the query
 * index and builds the cards itself. The parser therefore emits ONLY a minimal
 * config table and must NOT serialize the static source cards into content
 * (that would show hardcoded details in Document Authoring and duplicate the
 * dynamically generated list):
 *   row 1: the limit (number of cards to show; 4 on the homepage)
 *   row 2: the query-index path for the collection to list
 *
 * The collection is detected from the first card's link (…/magazine/… vs
 * …/adventures/…) so the same parser drives both homepage grids.
 */
export default function parse(element, { document }) {
  const firstLink = element.querySelector('a[href]');
  const href = firstLink ? firstLink.getAttribute('href') : '';

  let indexPath = '/us/en/magazine/query-index.json';
  if (/\/adventures\//.test(href)) indexPath = '/us/en/adventures/query-index.json';

  // Landing pages (the full ".image-list" grid) list ALL entries — no limit.
  // Homepage teaser grids cap at 4.
  const isLanding = !!element.closest('.image-list');

  // Config-only: (optional limit) + index path. No static card rows.
  const cells = isLanding ? [[indexPath]] : [['4'], [indexPath]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-list', cells });
  element.replaceWith(block);
}

/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-list — DYNAMIC, reusable listing block.
 * Sources:
 *   - Recent Articles (homepage) / Magazine landing → magazine query index
 *   - "Where do you want to go?" (homepage) / Adventures landing → adventures query index
 *
 * IMPORTANT: article-list is a dynamic block. At render time it reads the query
 * index and builds the cards itself, so the parser must NOT serialize the
 * static source cards (that would duplicate the generated list). Instead it
 * emits a minimal config table:
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

  // Homepage grids show 4 cards; landing pages omit the limit (show all).
  const cells = [['4'], [indexPath]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-list', cells });
  element.replaceWith(block);
}

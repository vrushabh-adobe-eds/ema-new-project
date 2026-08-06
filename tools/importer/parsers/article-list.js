/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-list — DYNAMIC block.
 * Source: https://wknd.site/us/en/magazine.html (.image-list .cmp-image-list)
 *
 * IMPORTANT: article-list is a dynamic block. At render time it reads the query
 * index and builds the article cards itself. The parser therefore emits only a
 * minimal block table (the block name + an empty config row) and must NOT
 * serialize the static source article cards into content — doing so would
 * duplicate the dynamically generated list.
 */
export default function parse(element, { document }) {
  // Minimal/empty config row — the dynamic block populates itself from the query index.
  const cells = [['']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-list', cells });
  element.replaceWith(block);
}

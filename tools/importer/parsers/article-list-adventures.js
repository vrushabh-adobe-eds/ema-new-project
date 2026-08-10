/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the Adventures LANDING grid — dynamic article-list.
 * Source: https://wknd.site/us/en/adventures.html ("Current Adventures").
 *
 * The source shows every adventure as teaser cards across CATEGORY TABS
 * (All / Climbing / Cycling / Skiing / Surfing / Travel). Instead of
 * serializing them, emit a single config-only dynamic article-list in `tabs`
 * mode that reads the adventures query index, renders ALL adventures, and
 * builds the category tab bar from the index `categories` field. Any static
 * source cards inside the container are dropped.
 */
export default function parse(element, { document }) {
  // Preserve the section heading ("Current Adventures") that lives inside the
  // container, then replace the container with a config-only dynamic block.
  const heading = element.querySelector('h1, h2, h3');

  const cells = [['tabs'], ['/us/en/adventures/query-index.json']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'article-list', cells });

  if (heading) {
    element.replaceWith(heading, block);
  } else {
    element.replaceWith(block);
  }
}

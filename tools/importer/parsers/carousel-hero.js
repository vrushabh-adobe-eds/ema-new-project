/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base block: carousel (variant: hero).
 * Source: https://wknd.site/us/en (.cmp-carousel--hero)
 *
 * IMPORTANT: carousel-hero is a DYNAMIC block. At render time it reads the
 * adventures query index and builds one slide per adventure (image + title +
 * description + "View Trip" CTA). The parser therefore emits ONLY a minimal
 * config table and must NOT serialize the static source slides into content
 * (that would hardcode slide details in Document Authoring and duplicate the
 * dynamically generated carousel):
 *   row 1: the limit (number of slides to show; 3 on the homepage)
 *   row 2: the adventures query-index path
 */
export default function parse(element, { document }) {
  const indexPath = '/us/en/adventures/query-index.json';
  const cells = [['3'], [indexPath]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}

/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-author (custom block — no library convention).
 * Source: https://wknd.site/us/en/magazine/arctic-surfing.html (.cmp-byline / .cmp-teaser--author)
 * Content: author avatar image + name + role/title + optional social links (fb/twitter/instagram).
 * Structure: 1 column. Row 1 = block name. Row 2 = single content cell holding all author elements.
 */
export default function parse(element, { document }) {
  // Avatar image.
  const image = element.querySelector('.cmp-byline__image img, .cmp-image__image, img');

  // Name (heading).
  const name = element.querySelector('.cmp-byline__name, .cmp-teaser__title, h1, h2, h3, h4');

  // Role / occupation / title text.
  const role = element.querySelector(
    '.cmp-byline__occupations, .cmp-teaser__description, [class*="occupation"], [class*="role"], p',
  );

  // Optional social links — facebook / twitter / instagram etc.
  const socialLinks = Array.from(element.querySelectorAll(
    '.cmp-byline__social a[href], [class*="social"] a[href], a[href*="facebook"], a[href*="twitter"], a[href*="instagram"]',
  ));

  const contentCell = [];
  if (image) contentCell.push(image);
  if (name) contentCell.push(name);
  if (role) contentCell.push(role);
  contentCell.push(...socialLinks);

  // Empty-block guard: unwrap if nothing meaningful was found.
  if (!image && !name && !role && socialLinks.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // 1-column block: one row, one cell holding all elements.
  const cells = [[contentCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-author', cells });
  element.replaceWith(block);
}

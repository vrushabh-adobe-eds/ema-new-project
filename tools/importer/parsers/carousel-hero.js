/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base block: carousel (variant: hero).
 * Source: https://wknd.site/us/en (.cmp-carousel--hero)
 *
 * IMPORTANT: carousel-hero is a DYNAMIC block. At render time it resolves each
 * configured slide path against the query indexes (adventures + magazine) and
 * builds the slide (image + title + description + CTA) from the index entry.
 * The parser therefore emits ONLY the ordered list of slide paths and must NOT
 * serialize the static slide image/title/description into content (that would
 * hardcode the slide details in Document Authoring):
 *   one row per slide, each holding the target page path (the slide's CTA link).
 *
 * The curated slides + their order come straight from the source carousel's
 * per-slide CTA links.
 */
export default function parse(element, { document }) {
  const slides = Array.from(element.querySelectorAll(
    ':scope .cmp-carousel__item, :scope [class*="carousel__item"]',
  ));

  const cells = [];
  slides.forEach((slide) => {
    const cta = slide.querySelector(
      '.cmp-teaser__action-link[href], a.cmp-button[href], a.button[href], a[href]',
    );
    const href = cta ? cta.getAttribute('href') : '';
    if (!href) return;
    // normalize to a site-absolute path (strip origin + .html)
    let path = href;
    try { path = new URL(href, 'https://wknd.site').pathname; } catch (e) { /* keep href */ }
    path = path.replace(/\.html$/, '');
    cells.push([path]);
  });

  // Fallback to the known curated slide set if the source markup changes.
  if (cells.length === 0) {
    ['/us/en/adventures', '/us/en/magazine/san-diego-surf', '/us/en/adventures/downhill-skiing-wyoming']
      .forEach((p) => cells.push([p]));
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}

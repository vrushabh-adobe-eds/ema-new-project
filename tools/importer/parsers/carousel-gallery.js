/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-gallery. Base block: carousel (variant: gallery).
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html (.cmp-carousel--mini)
 *
 * Library (carousel): 2 columns. Row 1 = block name. Each subsequent row = one slide:
 *   [ image cell (mandatory) , text cell (optional) ].
 * This is an image-only gallery, so slides carry just an image. We add the text
 * column only if any slide actually has text, keeping every row's cell count equal.
 */
export default function parse(element, { document }) {
  const slides = Array.from(element.querySelectorAll(
    ':scope .cmp-carousel__item, :scope [class*="carousel__item"]',
  ));

  // Extract image + optional text per slide first, so we can pick the column count.
  const parsed = slides.map((slide) => {
    const image = slide.querySelector('img');
    const titleEl = slide.querySelector(
      '.cmp-carousel__title, .cmp-title, [class*="title"] h1, [class*="title"] h2, h2, h3',
    );
    const descEl = slide.querySelector(
      '.cmp-carousel__description, .cmp-text p, [class*="description"]',
    );
    const ctas = Array.from(slide.querySelectorAll('a.cmp-button, .cmp-teaser__action-link, a.button'));
    const textParts = [];
    if (titleEl) textParts.push(titleEl);
    if (descEl) textParts.push(descEl);
    textParts.push(...ctas);
    return { image, textParts };
  }).filter((p) => p.image || p.textParts.length);

  const hasText = parsed.some((p) => p.textParts.length > 0);

  const cells = [];
  parsed.forEach((p) => {
    if (hasText) {
      // 2-column slide row: [image, text]. Pad missing cells to keep column count.
      cells.push([p.image || '', p.textParts.length ? p.textParts : '']);
    } else {
      // Image-only gallery: single-cell slide row.
      cells.push([p.image || '']);
    }
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel (gallery)', cells });
  element.replaceWith(block);
}

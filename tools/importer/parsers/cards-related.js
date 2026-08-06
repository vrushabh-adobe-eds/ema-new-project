/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-related. Base block: cards (variant: related).
 * Source: https://wknd.site/us/en/magazine/arctic-surfing.html
 *   (.cmp-layoutcontainer--sidebar .cmp-list / .cmp-list--related)
 *
 * Library (cards): 2 columns [image | text] when images present; the "no images"
 * pattern is 1 column [text] per card. This related-articles instance renders as a
 * list of links (title + date) with no images, so we detect image presence and
 * choose the column count accordingly, keeping every row consistent.
 *   Row 1 = block name. Each subsequent row = one card.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll(
    ':scope .cmp-list__item, :scope .cmp-image-list__item, :scope li',
  ));

  // Collect per-item extracted parts first so we can decide the column count.
  const parsed = items.map((item) => {
    const image = item.querySelector('img');
    const link = item.querySelector('a[href]');
    const titleEl = item.querySelector(
      '.cmp-list__item-title, .cmp-image-list__item-title, [class*="title"]',
    );
    const dateEl = item.querySelector(
      '.cmp-list__item-date, [class*="date"]',
    );
    const descEl = item.querySelector(
      '.cmp-list__item-description, .cmp-image-list__item-description, [class*="description"]',
    );
    return { image, link, titleEl, dateEl, descEl };
  }).filter((p) => p.titleEl || p.image || p.link);

  const hasImages = parsed.some((p) => p.image);

  const cells = [];

  parsed.forEach((p) => {
    // Build the text cell (title link + optional description + optional date).
    const textCell = [];

    if (p.titleEl) {
      const titleText = p.titleEl.textContent.trim();
      if (p.link && p.link.getAttribute('href')) {
        // Preserve the article link on the title so the card is clickable.
        const a = document.createElement('a');
        a.setAttribute('href', p.link.getAttribute('href'));
        a.textContent = titleText;
        textCell.push(a);
      } else {
        textCell.push(p.titleEl);
      }
    } else if (p.link && p.link.getAttribute('href')) {
      textCell.push(p.link);
    }

    if (p.descEl && p.descEl.textContent.trim()) textCell.push(p.descEl);
    if (p.dateEl && p.dateEl.textContent.trim()) textCell.push(p.dateEl);

    if (hasImages) {
      // 2-column card row: [image, text]. Pad image cell if this card lacks one.
      cells.push([p.image || '', textCell.length ? textCell : '']);
    } else {
      // 1-column card row: [text].
      cells.push([textCell.length ? textCell : '']);
    }
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-related', cells });
  element.replaceWith(block);
}

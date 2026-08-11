/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base block: accordion.
 * Source: https://wknd.site/us/en/faqs.html (.cmp-accordion)
 * Structure (library): 2 columns. Row 1 = block name. Each subsequent row is one
 * accordion item: [ title cell , content cell ].
 */
export default function parse(element, { document }) {
  // Each accordion item = one question/answer row.
  const items = Array.from(element.querySelectorAll(':scope .cmp-accordion__item'));

  const cells = [];

  items.forEach((item) => {
    // Title cell: the clickable question label.
    const titleEl = item.querySelector('.cmp-accordion__title, .cmp-accordion__header, button');
    const titleText = titleEl ? titleEl.textContent.trim() : '';

    // Content cell: the answer body — collect the text/media elements inside the panel.
    const panel = item.querySelector('.cmp-accordion__panel, [class*="panel"]');
    const contentEls = [];
    if (panel) {
      const bodyNodes = Array.from(panel.querySelectorAll(
        ':scope p, :scope h2, :scope h3, :scope h4, :scope h5, :scope h6, :scope ul, :scope ol, :scope blockquote, :scope img, :scope a[href]',
      )).filter((n) => n.textContent.trim() || n.querySelector('img') || n.tagName === 'IMG');
      contentEls.push(...bodyNodes);
    }

    // Skip empty items entirely.
    if (!titleText && contentEls.length === 0) return;

    // 2-column row: [title, content]. Pad content with empty string if none found.
    cells.push([titleText, contentEls.length ? contentEls : '']);
  });

  // Empty-block guard: nothing extracted -> unwrap so no empty block is produced.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion (faq)', cells });
  element.replaceWith(block);
}

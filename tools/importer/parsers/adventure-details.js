/* eslint-disable */
/* global WebImporter */
/**
 * Parser for adventure-details (custom block — no library convention).
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html (.cmp-contentfragment--elements)
 * Structure: key/value spec table. 2 columns.
 *   Row 1 = block name.
 *   Each subsequent row = one spec: [ label , value ].
 */
export default function parse(element, { document }) {
  const cells = [];

  // Each spec element wraps a <dt> (label) and <dd> (value).
  const specEls = Array.from(element.querySelectorAll(
    '.cmp-contentfragment__element, dl > div',
  ));

  specEls.forEach((spec) => {
    const labelEl = spec.querySelector('.cmp-contentfragment__element-title, dt');
    const valueEl = spec.querySelector('.cmp-contentfragment__element-value, dd');
    const label = labelEl ? labelEl.textContent.trim() : '';
    const value = valueEl ? valueEl.textContent.trim() : '';
    if (!label && !value) return;
    // 2-column row: [label, value].
    cells.push([label, value]);
  });

  // Fallback: if no wrapping element divs, pair raw dt/dd siblings directly.
  if (cells.length === 0) {
    const dts = Array.from(element.querySelectorAll('dt'));
    dts.forEach((dt) => {
      const dd = dt.nextElementSibling && dt.nextElementSibling.tagName === 'DD'
        ? dt.nextElementSibling : null;
      const label = dt.textContent.trim();
      const value = dd ? dd.textContent.trim() : '';
      if (!label && !value) return;
      cells.push([label, value]);
    });
  }

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'adventure-details', cells });
  element.replaceWith(block);
}

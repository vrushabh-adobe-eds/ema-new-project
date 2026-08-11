/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-adventure. Base block: tabs (variant: adventure).
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html (.cmp-tabs)
 *
 * Library (tabs): 2 columns. Row 1 = block name. Each subsequent row = one tab:
 *   [ tab label , tab content ].
 * Labels come from .cmp-tabs__tab list items; content from the matching
 * .cmp-tabs__tabpanel (paired by index).
 */
export default function parse(element, { document }) {
  const labels = Array.from(element.querySelectorAll(
    ':scope .cmp-tabs__tablist .cmp-tabs__tab, :scope .cmp-tabs__tab',
  ));
  const panels = Array.from(element.querySelectorAll(
    ':scope .cmp-tabs__tabpanel, :scope [class*="tabpanel"]',
  ));

  const cells = [];

  labels.forEach((label, i) => {
    const labelText = label.textContent.trim();
    const panel = panels[i];

    // Collect meaningful content nodes from the panel (skip layout-only grid wrappers).
    const contentEls = [];
    if (panel) {
      const nodes = Array.from(panel.querySelectorAll(
        ':scope h2, :scope h3, :scope h4, :scope h5, :scope h6, :scope p, :scope ul, :scope ol, :scope blockquote, :scope img',
      )).filter((n) => (
        n.textContent.trim() || n.tagName === 'IMG' || n.querySelector('img')
      ));
      contentEls.push(...nodes);
    }

    if (!labelText && contentEls.length === 0) return;

    // 2-column row: [label, content]. Pad missing content to keep column count.
    cells.push([labelText, contentEls.length ? contentEls : '']);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs (adventure)', cells });
  element.replaceWith(block);
}

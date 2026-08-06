/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section breaks + section metadata.
 *
 * Reads the sections defined for the current page's template
 * (`payload.template.sections`, sourced from tools/importer/page-templates.json)
 * and:
 *   - inserts a section-break `<hr>` before every non-first section that has
 *     content before it (one `<hr>` per section boundary), and
 *   - inserts a "Section Metadata" block for each section that declares a
 *     `style` (none of the current WKND templates set a style, so in practice
 *     no metadata blocks are emitted today — the logic is kept for future
 *     templates that add section styles).
 *
 * Runs in `afterTransform` only: block parsers run between the hooks and rely
 * on the DOM being un-split; inserting section breaks earlier could interfere
 * with block matching.
 *
 * Section selectors are NOT guessed — they come from the per-template
 * `sections[].selector` arrays captured during page analysis.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/**
 * Return the first element under `root` matching any selector in the list.
 * Selectors come from the template's captured DOM analysis.
 */
function findSectionElement(root, selectors) {
  if (!selectors) return null;
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (let i = 0; i < list.length; i += 1) {
    const sel = list[i];
    if (!sel) continue;
    let el = null;
    try {
      el = root.querySelector(sel);
    } catch (e) {
      el = null; // ignore invalid selector, try the next candidate
    }
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const template = payload && payload.template;
  const sections = template && template.sections;
  if (!sections || sections.length < 2) return;

  const doc = element.ownerDocument;

  // The very first element (document order) under main — used to guard against
  // emitting a stray leading section break.
  const firstInMain = element.querySelector('*');

  // Resolve each section's anchor element up front (before any DOM mutation).
  const resolved = sections.map((section) => ({
    section,
    el: findSectionElement(element, section.selector),
  }));

  // Process in reverse so inserting nodes never shifts earlier lookups.
  for (let i = resolved.length - 1; i >= 0; i -= 1) {
    const { section, el } = resolved[i];
    if (!el || !el.parentNode) continue;

    // Section Metadata block for sections that declare a style.
    if (section.style) {
      const block = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      el.parentNode.insertBefore(block, el.nextSibling);
    }

    // Section break before every non-first section that has content before it.
    if (i > 0 && el !== firstInMain) {
      const hr = doc.createElement('hr');
      el.parentNode.insertBefore(hr, el);
    }
  }
}

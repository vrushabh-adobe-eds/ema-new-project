/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide DOM cleanup.
 *
 * Removes non-authorable global chrome (header/nav, footer, breadcrumb,
 * search, sign-in / language nav, mobile nav overlay, tracking iframe,
 * hidden separators) and empty AEM layout wrappers so the import contains
 * only page-level authorable content. The main content area is preserved.
 *
 * ALL selectors below are taken from captured DOM:
 *   - migration-work/cleaned.html (FAQ page) — line references noted inline
 *   - tools/importer/page-templates.json     — for selectors not present on
 *     the FAQ page (e.g. `.cmp-breadcrumb`, documented per template)
 *
 * IMPORTANT (do not change without re-validating against captured DOM):
 *   - Header/footer experience fragments use the class `cmp-experiencefragment`
 *     (no internal hyphens). The authorable "Our Contributors" block on About Us
 *     uses `cmp-experience-fragment--contributor` (hyphenated) + `experiencefragment`.
 *     These are DIFFERENT class names, so removing the `--header`/`--footer`
 *     variants never touches the authorable contributors block. Never remove the
 *     bare `.experiencefragment` / `.cmp-experience-fragment` selectors.
 *   - `id` and `class` attributes are preserved — the section transformer
 *     (wknd-sections.js) relies on container ids/classes to locate sections.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// AEM layout wrappers that are removed only when they end up empty.
const EMPTY_WRAPPER_SELECTOR = [
  '.cmp-container',
  '.responsivegrid',
  '.aem-Grid',
  '.aem-GridColumn',
  '.container',
  '.xf-content-height',
  '.separator',
].join(', ');

/**
 * Remove AEM layout wrappers that are left empty (no text, no media, no
 * interactive/structural content). Runs multiple passes so that removing an
 * empty child which empties its parent is cleaned up too. Never removes
 * <main>/<body> or elements that still contain authorable content.
 */
function removeEmptyWrappers(root) {
  let removedInPass = true;
  while (removedInPass) {
    removedInPass = false;
    root.querySelectorAll(EMPTY_WRAPPER_SELECTOR).forEach((el) => {
      if (!el.isConnected) return;
      if (el.matches('main, body, header, footer')) return;
      const hasText = el.textContent && el.textContent.trim().length > 0;
      const hasContent = el.querySelector(
        'img, picture, source, svg, video, audio, iframe, input, button, table, hr, '
        + 'a, h1, h2, h3, h4, h5, h6, p, li, blockquote',
      );
      if (!hasText && !hasContent) {
        el.remove();
        removedInPass = true;
      }
    });
  }
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / tracking that should be gone before block parsing so they
    // cannot interfere with block matching or be picked up by parsers.
    WebImporter.DOMUtils.remove(element, [
      '#toggleNav', // cleaned.html:454 — mobile nav toggle button
      '#mobileNav', // cleaned.html:460 — mobile nav overlay
      '.cmp-navigation--mobile', // cleaned.html:460 — mobile nav overlay
      'iframe[src*="demdex"]', // cleaned.html:452 — Adobe ID syncing / tracking iframe
      'iframe[title*="Adobe ID Syncing"]', // cleaned.html:452 — same tracking iframe (id varies per page)
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable global chrome (site shell/layout).
    WebImporter.DOMUtils.remove(element, [
      // Header experience fragment and its parts
      'header', // cleaned.html:5 — header XF wrapper (semantic tag)
      '.cmp-experiencefragment--header', // cleaned.html:5-6 — header XF
      '.cmp-navigation--header', // cleaned.html:111-112 — main navigation
      '.cmp-search--header', // cleaned.html:134-135 — header search widget
      '.cmp-languagenavigation--header', // cleaned.html:21 — language switcher
      '.sign-in-buttons', // cleaned.html:14 — sign in/out utility bar column
      '.wknd-sign-in-buttons', // cleaned.html:15 — sign in/out widget

      // Footer experience fragment and its parts
      'footer', // cleaned.html:357 — footer XF wrapper (semantic tag)
      '.cmp-experiencefragment--footer', // cleaned.html:357-358 — footer XF
      '.cmp-navigation--footer', // cleaned.html:373-374 — footer navigation

      // Breadcrumb (not on FAQ page; documented in page-templates.json →
      // magazine-article section "a2" selector ".cmp-breadcrumb")
      '.cmp-breadcrumb',

      // Hidden decorative separators (non-authorable visual dividers)
      '.cmp-separator--hidden', // cleaned.html:334, 428

      // Non-authorable leftover / malformed elements
      'meta', // cleaned.html:176 — stray <meta> inside content image
      'link',
      'noscript',
      'script',
      'style',
    ]);

    // Attribute cleanup: strip event handlers and AEM data-layer/tracking
    // attributes. Preserve id/class (needed by the section transformer) and
    // content attributes (href/src/alt/title).
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const name = attr.name;
        if (
          name.startsWith('on')
          || name.startsWith('data-cmp-')
          || name.startsWith('data-track')
        ) {
          el.removeAttribute(name);
        }
      });
    });

    // Finally, remove AEM layout wrappers left empty after chrome removal.
    removeEmptyWrappers(element);
  }
}

/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the "Members Only" secure teasers on the magazine landing page.
 * Base block: cards (variant: teaser secure).
 * Source: https://wknd.site/us/en/magazine.html (.cmp-teaser--secure).
 *
 * Library (cards): 2 columns. Row 1 = block name + variant. Each subsequent
 * row is one card: [ image, text cell (title heading + description + CTA) ].
 *
 * Each secure teaser is its own section; this parser collects ALL secure
 * teasers into one `cards-teaser (secure)` grid so they render as locked
 * 2-column cards. Acts only on the first teaser and removes the rest.
 */
export default function parse(element, { document }) {
  const SEL = '.cmp-teaser--secure';
  const teasers = Array.from(document.querySelectorAll(SEL));
  if (!teasers.length) { element.replaceWith(...element.childNodes); return; }
  if (teasers[0] !== element) { if (element.parentNode) element.remove(); return; }

  const cells = [];
  teasers.forEach((teaser) => {
    const image = teaser.querySelector('img');
    const titleEl = teaser.querySelector('.cmp-teaser__title, [class*="title"], h1, h2, h3');
    const descEl = teaser.querySelector('.cmp-teaser__description, [class*="description"], p');
    const cta = teaser.querySelector('.cmp-teaser__action-link, a.cmp-button, a[href]');

    const textCell = [];
    if (titleEl) {
      const h = document.createElement('h3');
      h.textContent = titleEl.textContent.trim();
      textCell.push(h);
    }
    if (descEl && descEl.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = descEl.textContent.trim();
      textCell.push(p);
    }
    // Source secure teasers show a "Read More" affordance with no link
    // (content is locked). Emit it as strong text so the block styles it as a
    // (disabled-looking) button without a real destination.
    const ctaText = (cta && cta.textContent.trim()) || 'Read More';
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = ctaText;
    p.append(strong);
    textCell.push(p);
    // 2-column card row: [image, text]. Pad any missing cell to keep columns.
    cells.push([image || '', textCell.length ? textCell : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards-teaser (secure)',
    cells,
  });

  teasers.slice(1).forEach((t) => { if (t.parentNode) t.remove(); });
  element.replaceWith(block);
}

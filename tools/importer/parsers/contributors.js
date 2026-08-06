/* eslint-disable */
/* global WebImporter */
/**
 * Parser for contributors (custom person-profile grid block).
 * Source: https://wknd.site/us/en/about-us.html
 *   (each person is a separate section.cmp-experience-fragment--contributor)
 *
 * The source renders TWO grids — "Our Contributors" (4 people) and "WKND
 * Guides" (3 people) — but each person is its own XF section sharing one parent
 * grid. This parser groups the person XFs by their nearest preceding heading
 * (H2) so it emits ONE multi-card `contributors` grid per section instead of
 * one block per person.
 *
 * Block shape: 1 column, one row per person; each cell holds
 *   [ avatar, name (h3), role (p), social links ].
 */
function buildPersonCell(person, document) {
  const image = person.querySelector('.cmp-image__image, .image img, img');
  const titleEls = Array.from(person.querySelectorAll(
    '.cmp-title__text, .cmp-title h1, .cmp-title h2, .cmp-title h3, .cmp-title h4, .cmp-title h5',
  ));
  const nameEl = titleEls[0] || null;
  const roleEl = titleEls[1] || null;

  const socialAnchors = Array.from(person.querySelectorAll(
    'a.cmp-button[href], [class*="btn-list"] a[href], [class*="social"] a[href]',
  )).map((a) => {
    const href = a.getAttribute('href');
    const labelEl = a.querySelector('.cmp-button__text');
    const label = (labelEl ? labelEl.textContent : a.textContent).trim();
    if (!href) return null;
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = label || href;
    return link;
  }).filter(Boolean);

  if (!image && !nameEl && !roleEl && socialAnchors.length === 0) return null;

  const contentCell = [];
  if (image) contentCell.push(image);
  if (nameEl) {
    const heading = document.createElement('h3');
    heading.textContent = nameEl.textContent.trim();
    contentCell.push(heading);
  }
  if (roleEl && roleEl.textContent.trim()) {
    const role = document.createElement('p');
    role.textContent = roleEl.textContent.trim();
    contentCell.push(role);
  }
  contentCell.push(...socialAnchors);
  return contentCell;
}

export default function parse(element, { document }) {
  const XF_SEL = '.cmp-experience-fragment--contributor';
  const allXf = Array.from(document.querySelectorAll(XF_SEL));
  if (allXf.length === 0) { element.replaceWith(...element.childNodes); return; }

  // Ordered list of SECTION headings + person XFs in document order, so each XF
  // can be attributed to its nearest preceding section heading. Only headings
  // that live OUTSIDE any contributor XF count as section boundaries (each XF
  // card has its own inner title elements which must be ignored).
  const headings = Array.from(document.querySelectorAll('h2'))
    .filter((h) => !h.closest(XF_SEL));
  const nodes = [...headings, ...allXf].sort((a, b) => (
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ));
  const groups = [];
  let current = null;
  nodes.forEach((n) => {
    if (n.matches(XF_SEL)) {
      if (!current) { current = { members: [] }; groups.push(current); }
      current.members.push(n);
    } else {
      // a section heading ends the current group
      current = null;
    }
  });

  // Find the group this element starts. Only act when `element` is the group's
  // first member; build the grid and remove the group's other XFs so the
  // importer (which skips detached nodes) doesn't emit them as separate blocks.
  const group = groups.find((g) => g.members[0] === element);
  if (!group) {
    // Not a group head — it was (or will be) consumed by its group's head.
    if (element.parentNode) element.remove();
    return;
  }

  const cells = [];
  group.members.forEach((person) => {
    const cell = buildPersonCell(person, document);
    if (cell) cells.push([cell]);
  });
  if (cells.length === 0) { element.replaceWith(...element.childNodes); return; }

  // Remove the trailing members (keep the first to replace in place).
  group.members.slice(1).forEach((m) => { if (m.parentNode) m.remove(); });

  const block = WebImporter.Blocks.createBlock(document, { name: 'contributors', cells });
  element.replaceWith(block);
}

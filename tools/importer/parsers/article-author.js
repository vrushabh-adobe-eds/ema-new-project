/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-author (custom block — no library convention).
 * Source: https://wknd.site/us/en/magazine/western-australia.html (.cmp-byline / .cmp-teaser--author)
 * Content: author avatar image + name + role/title + social links (fb/twitter/instagram).
 *
 * Structure: 2 columns so the block renders "avatar | (name + role + socials)":
 *   Row 1 = block name.
 *   Row 2 cell A = avatar image.
 *   Row 2 cell B = name heading + role paragraph + social links (fb/twitter/insta).
 *
 * The social links live INSIDE the info cell so they decorate within the block
 * (they were previously siblings that leaked out as plain text after the block).
 */
export default function parse(element, { document }) {
  // Avatar image.
  const image = element.querySelector('.cmp-byline__image img, .cmp-image__image, img');

  // Name (heading).
  const name = element.querySelector('.cmp-byline__name, .cmp-teaser__title, h1, h2, h3, h4');

  // Role / occupation / title text.
  const role = element.querySelector(
    '.cmp-byline__occupations, .cmp-teaser__description, [class*="occupation"], [class*="role"], p',
  );

  // Social links — scan the byline AND its following siblings, because the
  // source renders the fb/twitter/instagram links just after the byline block.
  const socialLinks = [];
  const pushSocials = (root) => {
    root.querySelectorAll('a[href]').forEach((a) => {
      const label = (a.getAttribute('aria-label') || a.textContent || '').trim();
      if (/facebook|twitter|instagram/i.test(label) || /facebook|twitter|instagram/i.test(a.getAttribute('href') || '')) {
        socialLinks.push(a);
      }
    });
  };
  pushSocials(element);
  // also look at the byline's parent scope for adjacent social links
  if (element.parentElement) {
    element.parentElement.querySelectorAll(':scope > a[href], :scope > p > a[href], [class*="social"] a[href]').forEach((a) => {
      const label = (a.getAttribute('aria-label') || a.textContent || '').trim();
      if ((/facebook|twitter|instagram/i.test(label)) && !socialLinks.includes(a)) {
        socialLinks.push(a);
      }
    });
  }

  // Build clean social anchors carrying a network class, so the block CSS can
  // render dark icon boxes (matching the source) instead of plain text.
  const socialCell = socialLinks.map((a) => {
    const label = (a.getAttribute('aria-label') || a.textContent || '').trim();
    const net = /facebook/i.test(label) ? 'facebook'
      : /twitter/i.test(label) ? 'twitter'
        : /instagram/i.test(label) ? 'instagram' : '';
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href') || '#');
    if (net) link.className = `article-author-social-${net}`;
    link.setAttribute('aria-label', label || net);
    link.textContent = label || net;
    return link;
  });

  const infoCell = [];
  if (name) infoCell.push(name);
  if (role) infoCell.push(role);
  infoCell.push(...socialCell);

  // Empty-block guard.
  if (!image && !name && !role && socialCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // 2-column block: [ avatar | info(name+role+socials) ].
  const cells = [[image || '', infoCell.length ? infoCell : '']];

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-author', cells });
  element.replaceWith(block);
}

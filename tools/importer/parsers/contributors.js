/* eslint-disable */
/* global WebImporter */
/**
 * Parser for contributors (custom block — no library convention).
 * Source: https://wknd.site/us/en/about-us.html
 *   (section.experiencefragment.cmp-experience-fragment--contributor / .cmp-experience-fragment--contributor)
 *
 * Content: grid of person profiles — avatar + name + role/title + social links
 * (facebook / twitter / instagram). Structure: 1 column, one row per person; the
 * person's cell holds [ avatar, name heading, role, social links ].
 *
 * The mapped selector matches individual contributor sections, but the parser is
 * resilient: it collects all person units inside the element (each inner
 * .cmp-experiencefragment card), falling back to treating the element itself as a
 * single person when no nested person cards are present.
 */
export default function parse(element, { document }) {
  // Identify person units. Inner XF cards carry class cmp-experiencefragment--<name>.
  let personUnits = Array.from(element.querySelectorAll(
    '.cmp-experiencefragment[class*="cmp-experiencefragment--"]',
  ));
  // Fallback: the element itself is a single contributor card.
  if (personUnits.length === 0) personUnits = [element];

  const cells = [];

  personUnits.forEach((person) => {
    const image = person.querySelector('.cmp-image__image, .image img, img');

    // Name = first title heading; role = a subsequent title heading.
    const titleEls = Array.from(person.querySelectorAll(
      '.cmp-title__text, .cmp-title h1, .cmp-title h2, .cmp-title h3, .cmp-title h4, .cmp-title h5',
    ));
    const nameEl = titleEls[0] || null;
    const roleEl = titleEls[1] || null;

    // Social links — build clean anchors (icon buttons wrap a text span + href).
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

    if (!image && !nameEl && !roleEl && socialAnchors.length === 0) return;

    // Build the person's content cell.
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

    // 1-column block: one row per person, single cell holding all elements.
    cells.push([contentCell]);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'contributors', cells });
  element.replaceWith(block);
}

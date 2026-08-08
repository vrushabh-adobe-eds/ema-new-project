/* eslint-disable */
/* global WebImporter */
/**
 * Parser for contributors (custom person-profile grid block).
 * Source: https://wknd.site/us/en/about-us.html
 *   (each person is a separate section.cmp-experience-fragment--contributor)
 *
 * The source renders TWO grids — "Our Contributors" and "WKND Guides" — split
 * by the person's `type` field in the contributors query index.
 *
 * IMPORTANT: contributors is a DYNAMIC block. At render time it reads the
 * contributors query index and builds one card per person, filtered by `type`.
 * The parser therefore emits ONLY a minimal config table and must NOT serialize
 * the static source person cards into content (that would hardcode profile
 * details in Document Authoring and duplicate the dynamically generated grid):
 *   row 1: the contributors query-index path
 *   row 2: the type filter for this section (contributor | guide)
 *
 * The section is detected from the group's nearest preceding H2 heading
 * ("Our Contributors" → contributor, "WKND Guides" → guide) so the same block
 * drives both grids from a single index.
 */
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
      if (!current) { current = { heading: null, members: [] }; groups.push(current); }
      current.members.push(n);
    } else {
      // a section heading starts a new group and labels it
      current = { heading: n.textContent.trim(), members: [] };
      groups.push(current);
    }
  });

  // Find the group this element starts. Only act when `element` is the group's
  // first member; emit the config table and remove the group's other XFs so the
  // importer (which skips detached nodes) doesn't emit them as separate blocks.
  const group = groups.find((g) => g.members[0] === element);
  if (!group) {
    // Not a group head — it was (or will be) consumed by its group's head.
    if (element.parentNode) element.remove();
    return;
  }

  // Derive the type filter from the section heading. "WKND Guides" → guide,
  // everything else (e.g. "Our Contributors") → contributor.
  const type = /guide/i.test(group.heading || '') ? 'guide' : 'contributor';
  const indexPath = '/us/en/contributors/query-index.json';

  // Config-only rows — the block builds the cards from the query index.
  const cells = [[indexPath], [type]];

  // Remove the trailing members (keep the first to replace in place).
  group.members.slice(1).forEach((m) => { if (m.parentNode) m.remove(); });

  const block = WebImporter.Blocks.createBlock(document, { name: 'contributors', cells });
  element.replaceWith(block);
}

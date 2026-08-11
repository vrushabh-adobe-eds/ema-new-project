/*
 * Columns — base block with a `featured` variant:
 *   Columns              → generic side-by-side columns (boilerplate).
 *   Columns (featured)   → WKND Featured Article teaser (image + grey panel).
 *                          Was columns-featured.
 *
 * The featured path swaps the block to the legacy `columns-featured` identity
 * (removing the base `columns`/`featured` classes so the base `.columns` rules
 * do NOT apply) and uses the legacy sub-element class names, so all existing
 * styling matches byte-for-byte.
 */

function decorateColumns(block, prefix) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`${prefix}-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add(`${prefix}-img-col`);
        }
      }
    });
  });
}

export default function decorate(block) {
  // Guard: an empty columns block (all cells blank — e.g. a stray table an
  // author left in the editor) renders nothing but still costs layout/decoration
  // work in the critical path. Remove it so it can't hurt LCP/FCP.
  if (!block.textContent.trim() && !block.querySelector('picture, img, a')) {
    const wrapper = block.closest('.columns-wrapper') || block.parentElement;
    (wrapper || block).remove();
    return;
  }

  if (block.classList.contains('featured')) {
    // Swap to the legacy variant identity so base `.columns` rules don't apply.
    block.classList.add('columns-featured');
    block.classList.remove('columns', 'featured');
    if (block.parentElement) block.parentElement.classList.add('columns-featured-wrapper');
    const section = block.closest('.section');
    if (section) section.classList.add('columns-featured-container');
    decorateColumns(block, 'columns-featured');
    return;
  }

  decorateColumns(block, 'columns');
}

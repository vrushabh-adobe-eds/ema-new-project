export default function decorate(block) {
  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }

  // The authored promo title comes through as an <h1>, but this block sits
  // mid-page (after the hero carousel + section h2s), which breaks the
  // sequential heading order (a11y). Demote a leading h1 to h2 so the document
  // outline stays descending; keep its id so anchors/breadcrumbs still resolve.
  const h1 = block.querySelector('h1');
  if (h1) {
    const h2 = document.createElement('h2');
    h2.id = h1.id;
    h2.innerHTML = h1.innerHTML;
    h1.replaceWith(h2);
  }
}

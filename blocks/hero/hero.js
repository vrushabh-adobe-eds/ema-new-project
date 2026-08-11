/*
 * Hero — base block with two variants:
 *   Hero (promo) → image-bottom promo card (homepage "Next Adventures",
 *                  adventures landing intro). Was hero-promo.
 *   Hero (intro) → light intro banner, image background + heading (no CTA).
 *                  Was hero-intro.
 * A plain `hero` (no variant) keeps the boilerplate behavior (no JS transform).
 *
 * To preserve all existing styling/behavior byte-for-byte, the variant paths
 * re-apply the legacy `hero-promo` / `hero-intro` root/wrapper/container
 * classes so every existing CSS selector matches unchanged.
 */

/**
 * Swaps the block from the base `hero` identity to the legacy variant identity
 * so the element's classes match the ORIGINAL block exactly (e.g. `hero-promo`
 * only, not `hero promo hero-promo`). This is important: the base `.hero` rules
 * (absolute-positioned background picture, min-height, etc.) must NOT apply to
 * the promo/intro variants — removing the base `hero`/variant classes keeps the
 * rendered DOM identical to the pre-refactor blocks.
 */
function applyLegacyClasses(block, legacy, variantClass) {
  block.classList.add(legacy);
  block.classList.remove('hero', variantClass);
  if (block.parentElement) block.parentElement.classList.add(`${legacy}-wrapper`);
  const section = block.closest('.section');
  if (section) section.classList.add(`${legacy}-container`);
}

/** Flags the no-image state (both promo + intro use `.no-image`). */
function flagNoImage(block) {
  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }
}

export default function decorate(block) {
  const promo = block.classList.contains('promo');
  const intro = block.classList.contains('intro');

  if (promo) {
    applyLegacyClasses(block, 'hero-promo', 'promo');
    flagNoImage(block);

    // Bump authored image delivery from optimize=medium to optimize=high.
    block.querySelectorAll('picture source').forEach((s) => {
      const srcset = s.getAttribute('srcset');
      if (srcset) s.setAttribute('srcset', srcset.replace(/optimize=medium/g, 'optimize=high'));
    });
    const promoImg = block.querySelector('picture img');
    if (promoImg && promoImg.src) {
      promoImg.src = promoImg.src.replace(/optimize=medium/g, 'optimize=high');
    }

    // Demote a leading authored h1 to h2 (a11y heading order); keep the id so
    // anchors/breadcrumbs still resolve.
    const h1 = block.querySelector('h1');
    if (h1) {
      const h2 = document.createElement('h2');
      h2.id = h1.id;
      h2.innerHTML = h1.innerHTML;
      h1.replaceWith(h2);
    }
    return;
  }

  if (intro) {
    applyLegacyClasses(block, 'hero-intro', 'intro');
    flagNoImage(block);
  }
  // plain hero: no transform (boilerplate behavior)
}

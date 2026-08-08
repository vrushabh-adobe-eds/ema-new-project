import { createOptimizedPicture } from '../../scripts/aem.js';
import { fetchPlaceholders, moveInstrumentation } from '../../scripts/scripts.js';

// Query indexes the carousel can resolve slide paths against.
const INDEXES = [
  '/us/en/adventures/query-index.json',
  '/us/en/magazine/query-index.json',
];

/**
 * Reads block config: an ordered list of slide paths (the curated slides). Each
 * config row holds one page path (as a link or plain text); the slide's image,
 * title and description are then resolved from the query index — so nothing
 * about the slide is hardcoded in Document Authoring.
 * @param {Element} block
 * @returns {string[]} ordered, normalized slide paths
 */
function readConfig(block) {
  const paths = [];
  block.querySelectorAll(':scope > div').forEach((row) => {
    const link = row.querySelector('a');
    const raw = (link ? link.getAttribute('href') : row.textContent).trim();
    if (!raw || /query-index\.json$/.test(raw)) return;
    // normalize to a query-index-style path: strip origin, /content prefix, .html
    let path = raw;
    try { path = new URL(raw, window.location.origin).pathname; } catch { /* keep raw */ }
    path = path.replace(/^\/content(?=\/)/, '').replace(/\.html$/, '').replace(/\/$/, '');
    if (path) paths.push(path);
  });
  return paths;
}

/**
 * Builds one carousel slide row (image column + content column) from a
 * query-index entry, matching the authored slide shape the decorator expects.
 * The CTA label follows the source: magazine articles → "Full Article",
 * the adventures landing → "View Trips", a single adventure → "View Trip".
 * @param {object} item
 * @param {boolean} [eager] Eager-load + prioritize the image (the LCP first slide)
 * @returns {HTMLDivElement}
 */
function buildSlideRow(item, eager = false) {
  const row = document.createElement('div');

  const imageCol = document.createElement('div');
  if (item.image) {
    const pic = createOptimizedPicture(item.image, item.title || '', eager, [{ width: '2000' }]);
    if (eager) {
      // LCP hint: load the first slide's image eagerly and with high priority so
      // it's discoverable/prioritized immediately (PageSpeed "LCP request discovery").
      const img = pic.querySelector('img');
      if (img) {
        img.setAttribute('loading', 'eager');
        img.setAttribute('fetchpriority', 'high');
      }
    }
    imageCol.append(pic);
  }

  const contentCol = document.createElement('div');
  const h2 = document.createElement('h2');
  h2.textContent = item.title || '';
  contentCol.append(h2);
  if (item.description) {
    const p = document.createElement('p');
    p.textContent = item.description;
    contentCol.append(p);
  }
  const ctaP = document.createElement('p');
  const cta = document.createElement('a');
  cta.href = item.path;
  if (/\/magazine\//.test(item.path)) cta.textContent = 'Full Article';
  else if (/\/adventures$/.test(item.path)) cta.textContent = 'View Trips';
  else cta.textContent = 'View Trip';
  ctaP.append(cta);
  contentCol.append(ctaP);

  row.append(imageCol, contentCol);
  return row;
}

/**
 * Replaces the block's config rows with the curated slides, resolving each
 * configured path against the query indexes so all slide data (image, title,
 * description) comes from the index. Leaves authored rows in place if the
 * indexes are unavailable so the carousel is never empty.
 * @param {Element} block
 */
async function populateFromIndex(block) {
  const paths = readConfig(block);
  if (!paths.length) return; // authored (static) carousel — leave as-is
  const hasImageRows = !!block.querySelector('picture, img');

  // Fetch the indexes once and build a path → entry lookup.
  const lookup = {};
  await Promise.all(INDEXES.map(async (indexPath) => {
    try {
      const resp = await fetch(indexPath);
      if (!resp.ok) return;
      const json = await resp.json();
      (json.data || []).forEach((it) => {
        if (it.path) lookup[it.path.replace(/\/$/, '')] = it;
      });
    } catch (e) {
      // index unavailable — resolved entries just stay missing
    }
  }));

  // Resolve the configured slide paths, in order, to their index entries.
  const items = paths.map((p) => lookup[p]).filter((it) => it && it.image);

  if (items.length) {
    block.querySelectorAll(':scope > div').forEach((row) => row.remove());
    // first slide is the LCP candidate — eager-load + prioritize its image
    items.forEach((item, i) => block.append(buildSlideRow(item, i === 0)));
  } else if (!hasImageRows) {
    // no index data and no authored slides — nothing to show
    block.textContent = '';
  }
}

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel-hero');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-hero-slide');

  slides.forEach((aSlide, idx) => {
    aSlide.setAttribute('aria-hidden', idx !== slideIndex);
    aSlide.querySelectorAll('a').forEach((link) => {
      if (idx !== slideIndex) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-hero-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

export function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-hero-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;
  if (slideIndex >= slides.length) realSlideIndex = 0;
  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-hero-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-hero-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      const slideIndicator = e.currentTarget.parentElement;
      showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
    });
  });

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });
  block.querySelectorAll('.carousel-hero-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-hero-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-hero-slide');

  row.querySelectorAll(':scope > div').forEach((column, colIdx) => {
    column.classList.add(`carousel-hero-slide-${colIdx === 0 ? 'image' : 'content'}`);
    slide.append(column);
  });

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-hero-${carouselId}`);

  // Dynamic: build slides from the adventures query index (config-only block).
  await populateFromIndex(block);

  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  const placeholders = await fetchPlaceholders();

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-hero-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-hero-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    // Bottom control strip (below the slides): centered dots + right-aligned arrows.
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.classList.add('carousel-hero-controls');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-hero-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-hero-navigation-buttons');
    slideNavButtons.innerHTML = `
      <button type="button" class= "slide-prev" aria-label="${placeholders.previousSlide || 'Previous Slide'}"></button>
      <button type="button" class="slide-next" aria-label="${placeholders.nextSlide || 'Next Slide'}"></button>
    `;
    slideIndicatorsNav.append(slideNavButtons);

    block.append(slideIndicatorsNav);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    moveInstrumentation(row, slide);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-hero-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    bindEvents(block);
  }
}

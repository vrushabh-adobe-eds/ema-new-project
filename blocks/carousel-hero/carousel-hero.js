import { createOptimizedPicture } from '../../scripts/aem.js';
import { fetchPlaceholders, moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULT_INDEX = '/us/en/adventures/query-index.json';

/**
 * Reads block config from single-cell rows: an optional query-index path and an
 * optional numeric limit (how many slides to show). Falls back to the default
 * adventures index when no path is authored.
 * @param {Element} block
 * @returns {{ indexPath: string, limit: number }}
 */
function readConfig(block) {
  let indexPath = DEFAULT_INDEX;
  let limit = 0;
  block.querySelectorAll(':scope > div').forEach((row) => {
    const text = row.textContent.trim();
    const link = row.querySelector('a');
    if (link && /query-index\.json/.test(link.getAttribute('href') || '')) {
      indexPath = new URL(link.getAttribute('href'), window.location.origin).pathname;
    } else if (/query-index\.json$/.test(text)) {
      indexPath = new URL(text, window.location.origin).pathname;
    } else if (/^\d+$/.test(text)) {
      limit = parseInt(text, 10);
    }
  });
  return { indexPath, limit };
}

/**
 * Builds one carousel slide row (image column + content column) from a
 * query-index entry, matching the authored slide shape the decorator expects.
 * @param {object} item
 * @returns {HTMLDivElement}
 */
function buildSlideRow(item) {
  const row = document.createElement('div');

  const imageCol = document.createElement('div');
  if (item.image) {
    const pic = createOptimizedPicture(item.image, item.title || '', false, [{ width: '2000' }]);
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
  cta.textContent = 'View Trip';
  ctaP.append(cta);
  contentCol.append(ctaP);

  row.append(imageCol, contentCol);
  return row;
}

/**
 * Replaces the block's authored rows with slides built from the query index.
 * Curated order (matching the source homepage carousel) leads; anything else
 * falls back to index order. Leaves the authored rows in place if the index is
 * unavailable so the carousel is never empty.
 * @param {Element} block
 */
const CAROUSEL_ORDER = ['climbing-new-zealand', 'colorado-rock-climbing', 'downhill-skiing-wyoming'];
async function populateFromIndex(block) {
  const { indexPath, limit } = readConfig(block);
  // config-only block if it has no authored image rows
  const hasImageRows = !!block.querySelector('picture, img');
  const slug = (p) => (p || '').split('/').pop();
  const rank = (p) => {
    const i = CAROUSEL_ORDER.indexOf(slug(p));
    return i === -1 ? CAROUSEL_ORDER.length : i;
  };
  const childRe = /\/adventures\/[^/]+$/;
  const landingPath = indexPath.replace(/\/query-index\.json$/, '');

  let items = [];
  try {
    const resp = await fetch(indexPath);
    if (resp.ok) {
      const json = await resp.json();
      items = (json.data || [])
        .filter((it) => it.path && it.path !== landingPath && childRe.test(it.path) && it.image)
        .sort((a, b) => (rank(a.path) - rank(b.path))
          || (a.title || '').localeCompare(b.title || ''));
      if (limit > 0) items = items.slice(0, limit);
    }
  } catch (e) {
    // index unavailable — keep authored rows
  }

  if (items.length) {
    // clear config/authored rows, then append dynamic slide rows
    block.querySelectorAll(':scope > div').forEach((row) => row.remove());
    items.forEach((item) => block.append(buildSlideRow(item)));
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

import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Collapses the mobile menu and resets the hamburger.
 * @param {Element} nav The nav element
 */
function closeMobileMenu(nav) {
  nav.setAttribute('aria-expanded', 'false');
  const hamburger = nav.querySelector('.nav-hamburger button');
  if (hamburger) hamburger.setAttribute('aria-label', 'Open navigation');
}

/**
 * Toggles the mobile menu open/closed.
 * @param {Element} nav The nav element
 */
function toggleMobileMenu(nav) {
  const expanded = nav.getAttribute('aria-expanded') === 'true';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  const hamburger = nav.querySelector('.nav-hamburger button');
  if (hamburger) {
    hamburger.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  }
}

/**
 * Wires the locale selector dropdown (utility bar).
 * @param {Element} utility The utility section element
 */
function decorateLocale(utility) {
  const localeTop = utility.querySelector('ul > li');
  if (!localeTop) return;
  // The trigger anchor may be a direct child or wrapped in a <p> by the
  // content pipeline (DA/EDS wraps it, local dev does not). The submenu <ul>
  // is the nested list. Find both without assuming the wrapper.
  const submenu = localeTop.querySelector(':scope > ul');
  const trigger = localeTop.querySelector(':scope > a, :scope > p > a');
  if (!trigger || !submenu) return;
  localeTop.classList.add('nav-locale');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    const open = localeTop.classList.toggle('locale-open');
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', (e) => {
    if (!localeTop.contains(e.target)) {
      localeTop.classList.remove('locale-open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
}

/**
 * Builds the search input (with magnifier icon) inside the search section.
 * Content-first: the fragment only carries a "Search" marker; the control is built here.
 * @param {Element} search The search section element
 */
function decorateSearch(search) {
  search.textContent = '';
  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.setAttribute('role', 'search');
  form.action = '/us/en/search';
  form.method = 'get';

  const icon = document.createElement('span');
  icon.className = 'nav-search-icon';
  icon.setAttribute('aria-hidden', 'true');

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = 'SEARCH';
  input.setAttribute('aria-label', 'Search');

  form.append(icon, input);
  search.append(form);
}

/**
 * Applies the sticky shrink-on-scroll behavior to the header block.
 * @param {Element} block The header block element
 */
function decorateSticky(block) {
  const onScroll = () => {
    if (window.scrollY > 60) block.classList.add('nav-sticky');
    else block.classList.remove('nav-sticky');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  // local dev / DA content tree keeps the nav at /content/nav; try it first,
  // then fall back to the metadata-configured nav path (production EDS).
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  let loadedNavPath = '/content/nav';
  let fragment = await loadFragment(loadedNavPath);
  if (!fragment || !fragment.firstElementChild) {
    loadedNavPath = navPath;
    fragment = await loadFragment(navPath);
  }

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Fragment authors reference images with paths relative to the nav doc
  // (e.g. "images/logo.svg"). Resolve them against the nav directory so they
  // load correctly regardless of the current page's depth.
  const navDir = loadedNavPath.replace(/\/[^/]*$/, '') || '';
  nav.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:)?\/\//.test(src) && !src.startsWith('/')) {
      img.setAttribute('src', `${navDir}/${src}`);
    }
  });

  const roles = ['utility', 'brand', 'sections', 'search'];
  roles.forEach((role, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${role}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    const brandLink = navBrand.querySelector('a');
    if (brandLink) brandLink.classList.add('nav-brand-link');
  }

  const navUtility = nav.querySelector('.nav-utility');
  if (navUtility) decorateLocale(navUtility);

  const navSearch = nav.querySelector('.nav-search');
  if (navSearch) decorateSearch(navSearch);

  const navSections = nav.querySelector('.nav-sections');

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMobileMenu(nav));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');

  // scrim behind the mobile drawer — clicking it closes the menu (only visible
  // on mobile via CSS). Placed just before the slide-in .nav-sections.
  const scrim = document.createElement('button');
  scrim.type = 'button';
  scrim.className = 'nav-scrim';
  scrim.setAttribute('aria-label', 'Close navigation');
  scrim.tabIndex = -1;
  scrim.addEventListener('click', () => closeMobileMenu(nav));
  if (navSections) nav.insertBefore(scrim, navSections);

  // reset on breakpoint change
  isDesktop.addEventListener('change', () => closeMobileMenu(nav));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  decorateSticky(block);

  // close mobile menu when a nav link is clicked
  if (navSections) {
    navSections.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => { if (!isDesktop.matches) closeMobileMenu(nav); });
    });
  }
}

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

// Query indexes to search over (page titles + paths). Same data that drives
// the dynamic listing blocks, so search results stay in sync with the site.
const SEARCH_INDEXES = [
  '/us/en/magazine/query-index.json',
  '/us/en/adventures/query-index.json',
];

let searchDataPromise;
/** Fetches + caches all query-index entries once (title + path pairs). */
function loadSearchData() {
  if (!searchDataPromise) {
    searchDataPromise = Promise.all(SEARCH_INDEXES.map((idx) => fetch(idx)
      .then((resp) => (resp.ok ? resp.json() : { data: [] }))
      .catch(() => ({ data: [] }))))
      .then((results) => {
        const seen = new Set();
        const items = [];
        results.forEach((json) => (json.data || []).forEach((it) => {
          // only real content pages (nested one level under the collection),
          // skip landing pages and duplicates
          if (!it.path || !it.title) return;
          if (!/\/(magazine|adventures)\/[^/]+$/.test(it.path)) return;
          if (seen.has(it.path)) return;
          seen.add(it.path);
          items.push({ title: it.title, path: it.path });
        }));
        return items;
      });
  }
  return searchDataPromise;
}

/** Escapes a string for safe use inside a RegExp. */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds the search input (with magnifier icon) plus a query-index-driven
 * typeahead: as the user types, page titles matching the term are suggested
 * (matched text highlighted); selecting one navigates to that page.
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
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-autocomplete', 'list');

  const results = document.createElement('ul');
  results.className = 'nav-search-results';
  results.setAttribute('role', 'listbox');
  results.hidden = true;

  form.append(icon, input, results);
  search.append(form);

  let matches = [];
  let activeIndex = -1;

  const closeResults = () => {
    results.hidden = true;
    results.innerHTML = '';
    form.classList.remove('is-loading');
    input.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
  };

  const go = (path) => {
    if (path) window.location.assign(path);
  };

  const setActive = (idx) => {
    const options = results.querySelectorAll('.nav-search-result');
    options.forEach((li, i) => li.classList.toggle('active', i === idx));
    activeIndex = idx;
  };

  const render = (term) => {
    const q = term.trim().toLowerCase();
    if (!q) { form.classList.remove('is-loading'); closeResults(); return; }
    // show the spinner (in place of the search icon) while fetching results
    form.classList.add('is-loading');
    loadSearchData().then((items) => {
      // ignore stale responses if the query changed while fetching
      if (input.value.trim().toLowerCase() !== q) return;
      form.classList.remove('is-loading');
      matches = items.filter((it) => it.title.toLowerCase().includes(q)).slice(0, 8);
      if (!matches.length) { closeResults(); return; }
      const re = new RegExp(`(${escapeRegExp(term.trim())})`, 'i');
      results.innerHTML = '';
      matches.forEach((m, i) => {
        const li = document.createElement('li');
        li.className = 'nav-search-result';
        li.setAttribute('role', 'option');
        li.id = `nav-search-result-${i}`;
        // highlight the matched substring
        li.innerHTML = m.title.replace(re, '<mark>$1</mark>');
        li.addEventListener('mousedown', (e) => { e.preventDefault(); go(m.path); });
        results.append(li);
      });
      results.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      activeIndex = -1;
    });
  };

  input.addEventListener('input', () => render(input.value));
  input.addEventListener('focus', () => { if (input.value.trim()) render(input.value); });

  input.addEventListener('keydown', (e) => {
    if (results.hidden) return;
    const options = results.querySelectorAll('.nav-search-result');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIndex + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && matches[activeIndex]) {
        e.preventDefault();
        go(matches[activeIndex].path);
      }
    } else if (e.key === 'Escape') {
      closeResults();
    }
  });

  // close the dropdown when focus/click moves away
  document.addEventListener('click', (e) => {
    if (!form.contains(e.target)) closeResults();
  });
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

import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
  toCamelCase,
} from './aem.js';

/**
 * Move a set of attributes from one element to another.
 * @param {Element} from Source element
 * @param {Element} to Target element
 * @param {string[]} [attributes] Attribute names to move (defaults to all)
 */
export function moveAttributes(from, to, attributes) {
  const attrs = attributes || [...from.attributes].map(({ nodeName }) => nodeName);
  attrs.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes (Universal Editor) from one element to another.
 * @param {Element} from Source element
 * @param {Element} to Target element
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * Fetches and caches placeholders for a given prefix.
 * @param {string} [prefix] Location of placeholders
 * @returns {Promise<object>} Placeholders keyed by camelCased key
 */
export async function fetchPlaceholders(prefix = 'default') {
  window.placeholders = window.placeholders || {};
  if (!window.placeholders[prefix]) {
    window.placeholders[prefix] = new Promise((resolve) => {
      fetch(`${prefix === 'default' ? '' : prefix}/placeholders.json`)
        .then((resp) => (resp.ok ? resp.json() : {}))
        .then((json) => {
          const placeholders = {};
          (json.data || [])
            .filter((placeholder) => placeholder.Key)
            .forEach((placeholder) => {
              placeholders[toCamelCase(placeholder.Key)] = placeholder.Text;
            });
          window.placeholders[prefix] = placeholders;
          resolve(window.placeholders[prefix]);
        })
        .catch(() => {
          window.placeholders[prefix] = {};
          resolve(window.placeholders[prefix]);
        });
    });
  }
  return window.placeholders[prefix];
}

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds a breadcrumb for adventure detail (/us/en/adventures/{slug}) and
 * magazine article (/us/en/magazine/{slug}) pages, derived from the URL + page
 * title, matching the source ("Adventures › {Title}" / "Magazine › {Title}").
 * Adventure pages get it at the top (above the hero); magazine articles get it
 * after the lead image, above the title.
 * @param {Element} main The container element
 */
function buildBreadcrumb(main) {
  // only for the real page <main> — decorateMain also runs on header/footer
  // fragments, which must not receive a breadcrumb.
  if (main !== document.querySelector('main')) return;
  const { pathname } = window.location;
  const m = pathname.match(/^(\/[a-z-]+\/[a-z-]+\/(adventures|magazine))\/([^/]+)$/);
  if (!m) return;
  const [, parentPath, section, slug] = m;
  const parentLabel = section === 'magazine' ? 'Magazine' : 'Adventures';
  // Current-page label from the URL slug, title-cased (matches the source's
  // short breadcrumb label, e.g. "Western Australia" — not the full H1
  // "Western Australia by Camper Van").
  const title = slug
    .replace(/\.html$/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .trim();
  if (!title) return;

  const nav = document.createElement('nav');
  nav.className = 'breadcrumb';
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');
  const parent = document.createElement('li');
  const a = document.createElement('a');
  a.href = parentPath;
  a.textContent = parentLabel;
  parent.append(a);
  const current = document.createElement('li');
  current.setAttribute('aria-current', 'page');
  current.textContent = title;
  ol.append(parent, current);
  nav.append(ol);

  const wrapper = document.createElement('div');
  wrapper.className = 'section breadcrumb-container';
  wrapper.append(nav);

  if (section === 'magazine') {
    // Source order: lead image → breadcrumb → title. buildAutoBlocks runs
    // BEFORE decorateSections, so main's children are still the raw per-section
    // <div>s (not .section wrappers). Insert after the raw div that holds the
    // lead image, and tag it so CSS can widen that section's banner.
    const leadImg = main.querySelector(':scope > div img, :scope > div picture');
    const leadDiv = leadImg
      ? [...main.children].find((d) => d.contains(leadImg))
      : null;
    if (leadDiv) {
      leadDiv.classList.add('lead-image');
      leadDiv.after(wrapper);
    } else {
      main.prepend(wrapper);
    }
  } else {
    main.prepend(wrapper);
  }
}

/**
 * Reunites the FAQ page's "Need more help?" panel. The heading is authored at
 * the end of the accordion section, but a section break splits its contact
 * body (phone/email) into a separate section below — so on the desktop
 * two-column layout the right rail shows only the heading and the contact copy
 * drops full-width beneath the grid. Move the trailing section's default
 * content back in after the heading (before decorateSections runs, while main's
 * children are still the raw per-section divs) so heading + body form one
 * trailing wrapper and render together in the right column.
 * @param {Element} main The container element
 */
function buildFaqLayout(main) {
  if (main !== document.querySelector('main')) return;
  const faq = main.querySelector('.accordion-faq');
  if (!faq) return;
  const faqDiv = [...main.children].find((d) => d.contains(faq));
  if (!faqDiv) return;

  // Anchor after which the contact copy is inserted: the heading that follows
  // the accordion block ("Need more help?"), or the accordion block itself.
  const faqChild = [...faqDiv.children].find((c) => c === faq || c.contains(faq));
  let anchor = faqChild;
  for (let el = faqChild?.nextElementSibling; el; el = el.nextElementSibling) {
    if (/^H[1-6]$/.test(el.tagName)) { anchor = el; break; }
  }
  if (!anchor) return;

  // Pull in following sibling sections that hold only default content (no
  // blocks), preserving order, then drop the now-empty section divs.
  for (let sib = faqDiv.nextElementSibling; sib;) {
    const next = sib.nextElementSibling;
    const hasBlock = [...sib.children].some((c) => c.tagName === 'DIV' && c.className);
    if (hasBlock) break;
    const children = [...sib.children];
    for (let i = 0; i < children.length; i += 1) {
      anchor.after(children[i]);
      anchor = children[i];
    }
    sib.remove();
    sib = next;
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildBreadcrumb(main);
    buildFaqLayout(main);
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();

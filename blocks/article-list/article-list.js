import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULT_INDEX = '/us/en/magazine/query-index.json';

/**
 * Bump a generated <picture> from aem.js's default `optimize=medium` to
 * `optimize=high` (~10% smaller, no visible quality loss) — PageSpeed
 * "Improve image delivery".
 * @param {HTMLPictureElement} pic
 */
function optimizeHigh(pic) {
  pic.querySelectorAll('source').forEach((s) => {
    const srcset = s.getAttribute('srcset');
    if (srcset) s.setAttribute('srcset', srcset.replace(/optimize=medium/g, 'optimize=high'));
  });
  const img = pic.querySelector('img');
  if (img && img.src) img.src = img.src.replace(/optimize=medium/g, 'optimize=high');
}

/**
 * Reads block config from single-cell rows (an index path, a limit, and/or a
 * `members` mode flag).
 * @param {Element} block
 * @returns {{ indexPath: string, limit: number, members: boolean }}
 */
function readConfig(block) {
  let indexPath = DEFAULT_INDEX;
  let limit = 0;
  let members = false;
  let related = false;
  block.querySelectorAll(':scope > div').forEach((row) => {
    const text = row.textContent.trim();
    const link = row.querySelector('a');
    if (link && /query-index\.json/.test(link.getAttribute('href') || '')) {
      indexPath = new URL(link.getAttribute('href'), window.location.origin).pathname;
    } else if (/query-index\.json$/.test(text)) {
      indexPath = new URL(text, window.location.origin).pathname;
    } else if (/^\d+$/.test(text)) {
      limit = parseInt(text, 10);
    } else if (/^members$/i.test(text)) {
      members = true;
    } else if (/^related$/i.test(text)) {
      related = true;
    }
  });
  return {
    indexPath, limit, members, related,
  };
}

/**
 * Builds one "related" list item (title link + date, no image) — matches the
 * source article sidebar "SHARE THIS STORY" list.
 * @param {object} item
 * @returns {HTMLLIElement}
 */
function buildRelatedItem(item) {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = item.path;
  const title = document.createElement('span');
  title.className = 'article-list-related-title';
  title.textContent = item.title || item.path;
  a.append(title);
  if (item.publicationDate) {
    const date = document.createElement('span');
    date.className = 'article-list-related-date';
    date.textContent = item.publicationDate;
    a.append(date);
  }
  li.append(a);
  return li;
}

/**
 * Builds one locked "Members Only" card <li> from a query-index entry.
 * Matches the source secure teaser: lock badge on the title, grey text,
 * a non-linking READ MORE affordance, and the image below the body.
 * @param {object} item
 * @returns {HTMLLIElement}
 */
function buildMemberCard(item) {
  const li = document.createElement('li');

  const body = document.createElement('div');
  body.className = 'article-list-card-body';
  const h3 = document.createElement('h3');
  h3.textContent = item.title || item.path;
  body.append(h3);
  if (item.description) {
    const p = document.createElement('p');
    p.textContent = item.description;
    body.append(p);
  }
  const cta = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = 'Read More';
  cta.append(strong);
  body.append(cta);

  const imageCell = document.createElement('div');
  imageCell.className = 'article-list-card-image';
  if (item.image) {
    const pic = createOptimizedPicture(item.image, item.title || '', false, [{ width: '750' }]);
    optimizeHigh(pic);
    imageCell.append(pic);
  }

  li.append(body, imageCell);
  return li;
}

/**
 * Builds one article card <li> from a query-index entry.
 * @param {object} item
 * @returns {HTMLLIElement}
 */
function buildCard(item) {
  const li = document.createElement('li');

  const imageCell = document.createElement('div');
  imageCell.className = 'article-list-card-image';
  if (item.image) {
    const link = document.createElement('a');
    link.href = item.path;
    const pic = createOptimizedPicture(item.image, item.title || '', false, [{ width: '750' }]);
    optimizeHigh(pic);
    link.append(pic);
    imageCell.append(link);
  }

  const body = document.createElement('div');
  body.className = 'article-list-card-body';
  const h3 = document.createElement('h3');
  const titleLink = document.createElement('a');
  titleLink.href = item.path;
  titleLink.textContent = item.title || item.path;
  h3.append(titleLink);
  body.append(h3);
  if (item.description) {
    const p = document.createElement('p');
    p.textContent = item.description;
    body.append(p);
  }

  li.append(imageCell, body);
  return li;
}

/**
 * loads and decorates the article-list block.
 *
 * Dynamic listing block: fetches the collection query index (helix-query.yaml
 * target) and renders one card per entry, so the author only places a single
 * `article-list` block carrying the index path (and optional limit). The plain
 * listing is query-index driven ONLY — no static fallback. On a collection's
 * own landing page it lists everything; as a teaser on another page (homepage
 * grids) it caps at 4, matching the source.
 *
 * @param {Element} block The block element
 */
// Curated feature order per collection (matches the source homepage). Entries
// listed here lead in this exact sequence; anything else falls back to
// newest-first so newly published pages still appear automatically. Keyed by
// the collection segment derived from the index path (e.g. "magazine").
const CURATED_ORDER = {
  magazine: ['guide-la-skateparks', 'ski-touring', 'arctic-surfing', 'san-diego-surf'],
  adventures: ['yosemite-backpacking', 'whistler-mountain-biking', 'west-coast-cycling', 'tahoe-skiing'],
};

export default async function decorate(block) {
  const {
    indexPath, limit, members, related,
  } = readConfig(block);
  const landingPath = indexPath.replace(/\/query-index\.json$/, '');
  // Collection segment (last path part of the landing path) drives both the
  // "direct child" filter and the curated order — so the same block is reusable
  // for magazine, adventures, or any future index.
  const collection = landingPath.split('/').pop();
  const childRe = new RegExp(`/${collection}/[^/]+$`);

  // Parse a human date like "Wednesday, 30 Sep 2020" into a sortable timestamp.
  const parseDate = (s) => {
    if (!s) return 0;
    const t = Date.parse(s.replace(/^[A-Za-z]+,\s*/, ''));
    return Number.isNaN(t) ? 0 : t;
  };

  const curated = CURATED_ORDER[collection] || [];
  const slug = (p) => (p || '').split('/').pop();
  const rank = (p) => {
    const i = curated.indexOf(slug(p));
    return i === -1 ? curated.length : i;
  };

  // Normalize the current page path so an article never lists itself (related-articles
  // use). Query-index paths look like "/us/en/magazine/arctic-surfing"; the rendered
  // URL is "/content/us/en/..." locally or "/us/en/..." when published.
  const currentPath = window.location.pathname
    .replace(/^\/content(?=\/)/, '')
    .replace(/\.html$/, '')
    .replace(/\/$/, '');

  // Truthy test for the index `members` flag (string "true"/"yes"/"1" or boolean).
  const isMember = (it) => /^(true|yes|1)$/i.test(String(it.members || '').trim());

  // Effective card cap. When no explicit limit is authored, a plain listing
  // shows EVERYTHING on the collection's own landing page (e.g. /us/en/adventures)
  // but caps at 4 when it appears as a teaser on another page (the homepage
  // "Recent Articles" / "Where do you want to go?" grids show 4, matching the
  // source). Members/related lists keep their own configured limit.
  const HOMEPAGE_TEASER_LIMIT = 4;
  let effectiveLimit = limit;
  if (effectiveLimit === 0 && !members && !related && currentPath !== landingPath) {
    effectiveLimit = HOMEPAGE_TEASER_LIMIT;
  }

  let items = [];
  try {
    const resp = await fetch(indexPath);
    if (resp.ok) {
      const json = await resp.json();
      if (members) {
        // Members Only mode: pick just the flagged entries, sorted by path so the
        // order is stable. These live deeper than the "All Articles" listing.
        items = (json.data || [])
          .filter((it) => it.path && it.path !== landingPath && isMember(it))
          .sort((a, b) => (a.path || '').localeCompare(b.path || ''));
      } else {
        items = (json.data || [])
          // only real entries nested one level under the collection; exclude the
          // landing page, the current page, and any members-only entries
          .filter((it) => it.path && it.path !== landingPath && it.path !== currentPath
            && childRe.test(it.path) && !isMember(it))
          // curated order first; then newest-first; then stable path tiebreak
          .sort((a, b) => (rank(a.path) - rank(b.path))
            || (parseDate(b.publicationDate) - parseDate(a.publicationDate))
            || (a.path || '').localeCompare(b.path || ''));
      }
      if (effectiveLimit > 0) items = items.slice(0, effectiveLimit);
    }
  } catch (e) {
    // network/index unavailable — fall back to static rows below
  }

  const ul = document.createElement('ul');

  // Related mode: title + date list (no images), for the article sidebar.
  if (related) {
    block.classList.add('related');
    items.forEach((item) => ul.append(buildRelatedItem(item)));
    block.textContent = '';
    block.append(ul);
    return;
  }

  // Members Only mode: render locked secure cards (title + desc + READ MORE,
  // image below), reusing the cards-teaser "secure" visual. No tabs.
  if (members) {
    block.classList.add('secure');
    if (items.length) {
      // Dynamic: flagged members from the query index.
      items.forEach((item) => ul.append(buildMemberCard(item)));
    } else {
      // Fallback: the query index has no members yet (e.g. helix-query.yaml not
      // on main). Decorate the statically authored card rows (those carrying an
      // image) so the section is never empty; config-only rows are skipped.
      [...block.children]
        .filter((row) => row.querySelector('picture, img'))
        .forEach((row) => {
          const li = document.createElement('li');
          moveInstrumentation(row, li);
          while (row.firstElementChild) li.append(row.firstElementChild);
          [...li.children].forEach((div) => {
            if (div.children.length === 1 && div.querySelector('picture, img')) div.className = 'article-list-card-image';
            else div.className = 'article-list-card-body';
          });
          ul.append(li);
        });
      ul.querySelectorAll('picture > img').forEach((img) => {
        const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
        optimizeHigh(optimizedPic);
        moveInstrumentation(img, optimizedPic.querySelector('img'));
        img.closest('picture').replaceWith(optimizedPic);
      });
    }
    block.textContent = '';
    block.append(ul);
    return;
  }

  // Plain card list straight from the query index — no category tabs (the
  // source listings have none) and no static fallback: this listing is
  // query-index driven only.
  items.forEach((item) => ul.append(buildCard(item)));

  block.textContent = '';
  block.append(ul);
}

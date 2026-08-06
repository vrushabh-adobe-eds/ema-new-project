import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULT_INDEX = '/us/en/magazine/query-index.json';

/**
 * Reads block config from single-cell rows (an index path and/or a limit).
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
 * Dynamic listing block: fetches the magazine query index (helix-query.yaml
 * target) and renders one card per magazine article, so the author only
 * places a single `article-list` block. Falls back to statically authored
 * rows when the index is unavailable.
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
  const { indexPath, limit } = readConfig(block);
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

  let items = [];
  try {
    const resp = await fetch(indexPath);
    if (resp.ok) {
      const json = await resp.json();
      items = (json.data || [])
        // only real entries nested one level under the collection; exclude the landing page itself
        .filter((it) => it.path && it.path !== landingPath && childRe.test(it.path))
        // curated order first; then newest-first; then stable path tiebreak
        .sort((a, b) => (rank(a.path) - rank(b.path))
          || (parseDate(b.publicationDate) - parseDate(a.publicationDate))
          || (a.path || '').localeCompare(b.path || ''));
      if (limit > 0) items = items.slice(0, limit);
    }
  } catch (e) {
    // network/index unavailable — fall back to static rows below
  }

  const ul = document.createElement('ul');

  if (items.length) {
    items.forEach((item) => ul.append(buildCard(item)));
  } else {
    // Fallback: decorate any statically authored rows as cards. Only rows that
    // actually carry an image are real cards — config-only rows (a bare limit
    // or an index path) are skipped so they never render as empty cards.
    [...block.children]
      .filter((row) => row.querySelector('picture, img'))
      .forEach((row) => {
        const li = document.createElement('li');
        moveInstrumentation(row, li);
        while (row.firstElementChild) li.append(row.firstElementChild);
        [...li.children].forEach((div) => {
          if (div.children.length === 1 && div.querySelector('picture')) div.className = 'article-list-card-image';
          else div.className = 'article-list-card-body';
        });
        ul.append(li);
      });
    ul.querySelectorAll('picture > img').forEach((img) => {
      const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
    });
  }

  block.textContent = '';
  block.append(ul);
}

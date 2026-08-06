import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const DEFAULT_INDEX = '/us/en/contributors/query-index.json';

/**
 * Reads block config from single-cell rows: an optional query-index path and an
 * optional `type` filter (contributor | guide). Falls back to the default
 * contributors index when no path is authored.
 * @param {Element} block
 * @returns {{ indexPath: string, type: string|null }}
 */
function readConfig(block) {
  let indexPath = DEFAULT_INDEX;
  let type = null;
  block.querySelectorAll(':scope > div').forEach((row) => {
    const text = row.textContent.trim();
    const link = row.querySelector('a');
    if (link && /query-index\.json/.test(link.getAttribute('href') || '')) {
      indexPath = new URL(link.getAttribute('href'), window.location.origin).pathname;
    } else if (/query-index\.json$/.test(text)) {
      indexPath = new URL(text, window.location.origin).pathname;
    } else if (/^(contributor|guide)s?$/i.test(text)) {
      type = text.toLowerCase().replace(/s$/, '');
    }
  });
  return { indexPath, type };
}

const NETWORKS = ['facebook', 'twitter', 'instagram', 'youtube', 'linkedin', 'pinterest'];

/** Builds one profile <li> from a query-index entry. */
function buildCard(item) {
  const li = document.createElement('li');

  const imageCell = document.createElement('div');
  imageCell.className = 'contributors-card-image';
  if (item.image) {
    const pic = createOptimizedPicture(item.image, item.title || '', false, [{ width: '400' }]);
    imageCell.append(pic);
  }

  const body = document.createElement('div');
  body.className = 'contributors-card-body';
  const h3 = document.createElement('h3');
  h3.textContent = item.title || '';
  body.append(h3);
  if (item.role) {
    const role = document.createElement('p');
    role.textContent = item.role;
    body.append(role);
  }

  const socials = NETWORKS.filter((n) => item[n]);
  if (socials.length) {
    const ul = document.createElement('ul');
    ul.className = 'contributors-card-social';
    socials.forEach((n) => {
      const it = document.createElement('li');
      const a = document.createElement('a');
      a.className = `contributors-card-social-link social-${n}`;
      a.href = item[n];
      a.setAttribute('aria-label', n.charAt(0).toUpperCase() + n.slice(1));
      it.append(a);
      ul.append(it);
    });
    body.append(ul);
  }

  li.append(imageCell, body);
  return li;
}

/** Decorates the authored (static) rows as cards — used as a fallback. */
function decorateStatic(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.querySelector('picture, img')) return; // skip config-only rows
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'contributors-card-image';
      else div.className = 'contributors-card-body';
    });

    const body = li.querySelector('.contributors-card-body');
    if (body) {
      const links = [...body.querySelectorAll('a')];
      if (links.length) {
        const social = document.createElement('ul');
        social.className = 'contributors-card-social';
        links.forEach((a) => {
          const item = document.createElement('li');
          a.classList.add('contributors-card-social-link');
          const hint = `${a.textContent} ${a.getAttribute('href') || ''}`.toLowerCase();
          const net = NETWORKS.find((n) => hint.includes(n));
          if (!a.getAttribute('aria-label') && a.textContent.trim()) {
            a.setAttribute('aria-label', a.textContent.trim());
          }
          if (net) a.classList.add(`social-${net}`);
          a.textContent = '';
          item.append(a);
          social.append(item);
        });
        body.append(social);
      }
    }
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}

/**
 * contributors — person-profile grid.
 *
 * DYNAMIC: reads the contributors query index and renders one card per person,
 * optionally filtered by `type` (contributor | guide) so a single index powers
 * both the "Our Contributors" and "WKND Guides" grids. Falls back to statically
 * authored rows when the index is unavailable.
 *
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const { indexPath, type } = readConfig(block);
  const hasImageRows = !!block.querySelector('picture, img');

  let items = [];
  try {
    const resp = await fetch(indexPath);
    if (resp.ok) {
      const json = await resp.json();
      items = (json.data || [])
        .filter((it) => it.path && /\/contributors\/[^/]+$/.test(it.path))
        .filter((it) => !type || (it.type || '').toLowerCase() === type)
        .sort((a, b) => (a.path || '').localeCompare(b.path || ''));
    }
  } catch (e) {
    // index unavailable — fall back to authored rows
  }

  if (items.length) {
    const ul = document.createElement('ul');
    items.forEach((item) => ul.append(buildCard(item)));
    block.textContent = '';
    block.append(ul);
    return;
  }

  // No index data: use authored rows if present, else leave empty.
  if (hasImageRows) decorateStatic(block);
  else block.textContent = '';
}

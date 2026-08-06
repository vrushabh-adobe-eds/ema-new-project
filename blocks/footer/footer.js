import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment — local dev / DA content tree keeps it at
  // /content/footer; fall back to the metadata-configured path (production EDS).
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  let loadedFooterPath = '/content/footer';
  let fragment = await loadFragment(loadedFooterPath);
  if (!fragment || !fragment.firstElementChild) {
    loadedFooterPath = footerPath;
    fragment = await loadFragment(footerPath);
  }

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer-inner';
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Resolve fragment-relative image paths (e.g. "images/logo.svg") against the
  // footer directory so they load regardless of the current page's depth.
  const footerDir = loadedFooterPath.replace(/\/[^/]*$/, '') || '';
  footer.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:)?\/\//.test(src) && !src.startsWith('/')) {
      img.setAttribute('src', `${footerDir}/${src}`);
    }
  });

  // Assign semantic roles to the flat sections: brand, nav, social, legal.
  const roles = ['brand', 'nav', 'social', 'legal'];
  roles.forEach((role, i) => {
    const section = footer.children[i];
    if (section) section.classList.add(`footer-${role}`);
  });

  block.append(footer);
}

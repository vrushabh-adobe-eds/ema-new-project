// eslint-disable-next-line import/no-unresolved
import { toClassName } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/*
 * Tabs — base block with an `adventure` variant:
 *   Tabs (adventure) → Overview / Itinerary / What to Bring switcher on the
 *                      adventure-detail page. Was tabs-adventure.
 *
 * The adventure path re-applies the legacy `tabs-adventure` root/wrapper/
 * container classes. The section class in particular matters: the sibling
 * `adventure-details` block's CSS keys its two-column layout off
 * `.section.adventure-details-container.tabs-adventure-container`, so that
 * exact class must be present for the layout to match byte-for-byte.
 */

export default async function decorate(block) {
  const adventure = block.classList.contains('adventure');
  const prefix = adventure ? 'tabs-adventure' : 'tabs';

  if (adventure) {
    block.classList.add('tabs-adventure');
    block.classList.remove('tabs', 'adventure');
    if (block.parentElement) block.parentElement.classList.add('tabs-adventure-wrapper');
    const section = block.closest('.section');
    if (section) section.classList.add('tabs-adventure-container');
  }

  // build tablist
  const tablist = document.createElement('div');
  tablist.className = `${prefix}-list`;
  tablist.setAttribute('role', 'tablist');

  // decorate tabs and tabpanels
  const tabs = [...block.children].map((child) => child.firstElementChild);
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = `${prefix}-panel`;
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // build tab button
    const button = document.createElement('button');
    button.className = `${prefix}-tab`;
    button.id = `tab-${id}`;

    moveInstrumentation(tab.parentElement, tabpanel.lastElementChild);
    button.innerHTML = tab.innerHTML;

    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
    tab.remove();
    moveInstrumentation(button.querySelector('p'), null);
  });

  block.prepend(tablist);
}

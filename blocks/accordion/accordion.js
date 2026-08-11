/*
 * Accordion — base block with a `faq` variant:
 *   Accordion        → generic accordion (boilerplate details/summary).
 *   Accordion (faq)  → WKND FAQ accordion. Sheet-driven: a single config row
 *                      points at a FAQ data sheet (…/faq-data.json) and the
 *                      questions/answers are fetched at render time (query/
 *                      sheet-driven only, no static fallback). Was accordion-faq.
 *
 * The faq path re-applies the legacy `accordion-faq` root/wrapper/container
 * classes (the FAQ page's two-column layout CSS keys off
 * `.section.accordion-faq-container`), so all existing styling matches
 * byte-for-byte. The base `accordion`/`faq` classes are removed so any generic
 * accordion rules don't apply.
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

/** Reads a FAQ data-sheet path from a single-cell config row, if present. */
function readSheetPath(block) {
  let sheetPath = null;
  block.querySelectorAll(':scope > div').forEach((row) => {
    const text = row.textContent.trim();
    const link = row.querySelector('a');
    const href = link ? link.getAttribute('href') : '';
    if (href && /\.json(\?|$)/.test(href)) {
      sheetPath = new URL(href, window.location.origin).pathname;
    } else if (/^\/\S*\.json$/.test(text)) {
      sheetPath = new URL(text, window.location.origin).pathname;
    }
  });
  return sheetPath;
}

/** Builds one <details> accordion item. */
function buildItem(prefix, question, answer) {
  const details = document.createElement('details');
  details.className = `${prefix}-item`;

  const summary = document.createElement('summary');
  summary.className = `${prefix}-item-label`;
  const q = document.createElement('p');
  q.textContent = question;
  summary.append(q);

  const body = document.createElement('div');
  body.className = `${prefix}-item-body`;
  const answerP = document.createElement('p');
  answerP.innerHTML = answer;
  body.append(answerP);

  details.append(summary, body);
  return details;
}

/** Decorates inline authored Q&A rows into <details> items. */
function decorateInlineRows(block, prefix) {
  [...block.children].forEach((row) => {
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = `${prefix}-item-label`;
    summary.append(...label.childNodes);
    const body = row.children[1];
    body.className = `${prefix}-item-body`;
    const details = document.createElement('details');
    moveInstrumentation(row, details);
    details.className = `${prefix}-item`;
    details.append(summary, body);
    row.replaceWith(details);
  });
}

export default async function decorate(block) {
  const isFaq = block.classList.contains('faq');
  const prefix = isFaq ? 'accordion-faq' : 'accordion';

  if (isFaq) {
    // Re-apply legacy identity so the FAQ page layout CSS matches.
    block.classList.add('accordion-faq');
    block.classList.remove('accordion', 'faq');
    if (block.parentElement) block.parentElement.classList.add('accordion-faq-wrapper');
    const section = block.closest('.section');
    if (section) section.classList.add('accordion-faq-container');
  }

  const sheetPath = readSheetPath(block);
  if (sheetPath) {
    // Sheet-driven only — no static fallback.
    let rows = [];
    try {
      const resp = await fetch(sheetPath);
      if (resp.ok) {
        const json = await resp.json();
        rows = (json.data || [])
          .filter((r) => (r.question || '').trim() && (r.answer || '').trim());
      }
    } catch (e) {
      // sheet unavailable — render nothing rather than authored fallback
    }
    block.textContent = '';
    rows.forEach((r) => block.append(buildItem(prefix, r.question.trim(), r.answer.trim())));
    return;
  }

  decorateInlineRows(block, prefix);
}

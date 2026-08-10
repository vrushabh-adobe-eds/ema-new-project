/*
 * Accordion Block (accordion-faq variant)
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 *
 * Data-driven: when the block is authored with a single config row pointing at
 * a FAQ data sheet (…/faq-data.json), the questions/answers are fetched from
 * that sheet at render time and the accordion is built from them — sheet-driven
 * only, no static fallback. (If no sheet path is present the block still
 * decorates inline authored Q&A rows, e.g. for local drafts.)
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Reads a FAQ data-sheet path from a single-cell config row, if present.
 * @param {Element} block
 * @returns {string|null} the sheet path (site-absolute) or null
 */
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

/**
 * Builds one <details> accordion item.
 * @param {string} question plain-text question
 * @param {string} answer answer HTML (may contain inline markup like <strong>)
 * @returns {HTMLDetailsElement}
 */
function buildItem(question, answer) {
  const details = document.createElement('details');
  details.className = 'accordion-faq-item';

  const summary = document.createElement('summary');
  summary.className = 'accordion-faq-item-label';
  const q = document.createElement('p');
  q.textContent = question;
  summary.append(q);

  const body = document.createElement('div');
  body.className = 'accordion-faq-item-body';
  const answerP = document.createElement('p');
  answerP.innerHTML = answer;
  body.append(answerP);

  details.append(summary, body);
  return details;
}

export default async function decorate(block) {
  const sheetPath = readSheetPath(block);

  if (sheetPath) {
    // Sheet-driven: fetch the FAQ data sheet and build the accordion from it.
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
    rows.forEach((r) => block.append(buildItem(r.question.trim(), r.answer.trim())));
    return;
  }

  // Inline authored Q&A rows (used for local drafts / when no sheet is set).
  [...block.children].forEach((row) => {
    // decorate accordion item label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    summary.append(...label.childNodes);
    // decorate accordion item body
    const body = row.children[1];
    body.className = 'accordion-faq-item-body';
    // decorate accordion item
    const details = document.createElement('details');
    moveInstrumentation(row, details);
    details.className = 'accordion-faq-item';
    details.append(summary, body);
    row.replaceWith(details);
  });
}

/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import contributorsParser from "./parsers/contributors.js";

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from "./transformers/wknd-cleanup.js";
import wkndSectionsTransformer from "./transformers/wknd-sections.js";

// PARSER REGISTRY
const parsers = {
  "contributors": contributorsParser,
};

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {
    "name": "about-us",
    "description": "About Us: heading plus contributor/guide profile cards with avatar, name, title and social links",
    "urls": [
      "https://wknd.site/us/en/about-us.html"
    ],
    "blocks": [
      {
        "name": "contributors",
        "instances": [
          "section.experiencefragment.cmp-experience-fragment--contributor",
          ".cmp-experience-fragment--contributor"
        ]
      }
    ],
    "sections": [
      {
        "id": "ab1",
        "name": "About intro",
        "selector": [
          "#title-9b21773b1d"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "h1",
          "h2",
          "p"
        ]
      },
      {
        "id": "ab2",
        "name": "Our Contributors grid",
        "selector": [
          "#container-5b0414191a"
        ],
        "style": null,
        "blocks": [
          "contributors"
        ],
        "defaultContent": []
      },
      {
        "id": "ab3",
        "name": "WKND Guides intro",
        "selector": [
          "#title-439468b079"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "h2",
          "p"
        ]
      },
      {
        "id": "ab4",
        "name": "WKND Guides grid",
        "selector": [
          "#container-5b0414191a"
        ],
        "style": null,
        "blocks": [
          "contributors"
        ],
        "defaultContent": []
      }
    ]
  };

// TRANSFORMER REGISTRY (section transformer runs last, only if 2+ sections)
const transformers = [
  wkndCleanupTransformer,
  wkndSectionsTransformer,
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.filter((b) => !b.name.startsWith("section-")).forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      elements.forEach((element) => pageBlocks.push({ name: blockDef.name, selector, element }));
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers("beforeTransform", main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    const seen = new Set();
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      if (seen.has(block.element)) return;
      seen.add(block.element);
      const parser = parsers[block.name];
      if (parser) {
        try { parser(block.element, { document, url, params }); }
        catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    executeTransformers("afterTransform", main, payload);

    const hr = document.createElement("hr");
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
    );

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};

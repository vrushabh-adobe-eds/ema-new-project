/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsFeaturedParser from "./parsers/columns-featured.js";
import articleListParser from "./parsers/article-list.js";
import articleListMembersParser from "./parsers/article-list-members.js";

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from "./transformers/wknd-cleanup.js";
import wkndSectionsTransformer from "./transformers/wknd-sections.js";

// PARSER REGISTRY
// Two distinct block keys route to two article-list modes:
//   "article-list"          → All Articles listing (m2)
//   "article-list-members"  → Members Only, dynamic members mode (m3)
const parsers = {
  "columns-featured": columnsFeaturedParser,
  "article-list": articleListParser,
  "article-list-members": articleListMembersParser,
};

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {
    "name": "magazine-landing",
    "description": "Magazine landing: intro heading, featured article, and a grid of article teaser cards (to become dynamic article-list)",
    "urls": [
      "https://wknd.site/us/en/magazine.html"
    ],
    "blocks": [
      {
        "name": "columns-featured",
        "instances": [
          "#featured-article-magazine",
          ".cmp-teaser--featured"
        ]
      },
      {
        "name": "article-list",
        "instances": [
          ".image-list .cmp-image-list"
        ]
      },
      {
        "name": "article-list-members",
        "instances": [
          ".cmp-teaser--secure"
        ]
      }
    ],
    "sections": [
      {
        "id": "m1",
        "name": "Magazine intro + featured",
        "selector": [
          "#title-e83f9afeef"
        ],
        "style": null,
        "blocks": [
          "columns-featured"
        ],
        "defaultContent": [
          "h1"
        ]
      },
      {
        "id": "m2",
        "name": "All Articles listing",
        "selector": [
          "#title-0f80375ce9"
        ],
        "style": null,
        "blocks": [
          "article-list"
        ],
        "defaultContent": [
          "h2"
        ]
      },
      {
        "id": "m3",
        "name": "Members Only",
        "selector": [
          "#title-59d441f861"
        ],
        "style": null,
        "blocks": [
          "article-list-members"
        ],
        "defaultContent": [
          "h2",
          "p"
        ]
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

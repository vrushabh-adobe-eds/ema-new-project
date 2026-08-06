/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselHeroParser from "./parsers/carousel-hero.js";
import columnsFeaturedParser from "./parsers/columns-featured.js";
import cardsTeaserParser from "./parsers/cards-teaser.js";
import heroPromoParser from "./parsers/hero-promo.js";

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from "./transformers/wknd-cleanup.js";
import wkndSectionsTransformer from "./transformers/wknd-sections.js";

// PARSER REGISTRY
const parsers = {
  "carousel-hero": carouselHeroParser,
  "columns-featured": columnsFeaturedParser,
  "cards-teaser": cardsTeaserParser,
  "hero-promo": heroPromoParser,
};

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {
    "name": "homepage",
    "description": "Landing page with hero carousel, featured article, article grid and adventure cards",
    "urls": [
      "https://wknd.site/us/en.html"
    ],
    "blocks": [
      {
        "name": "carousel-hero",
        "instances": [
          ".cmp-carousel--hero"
        ]
      },
      {
        "name": "columns-featured",
        "instances": [
          ".cmp-teaser--featured",
          "#featured-teaser-home"
        ]
      },
      {
        "name": "cards-teaser",
        "instances": [
          "#container-9c4899b718 .cmp-image-list",
          "#container-4d3fed64ff .cmp-image-list"
        ]
      },
      {
        "name": "hero-promo",
        "instances": [
          ".cmp-teaser--imagebottom",
          "#teaser-ef0ce278d1"
        ]
      }
    ],
    "sections": [
      {
        "id": "s1",
        "name": "Hero carousel",
        "selector": [
          ".cmp-carousel--hero"
        ],
        "style": null,
        "blocks": [
          "carousel-hero"
        ],
        "defaultContent": []
      },
      {
        "id": "s2",
        "name": "Featured article",
        "selector": [
          ".cmp-teaser--featured"
        ],
        "style": null,
        "blocks": [
          "columns-featured"
        ],
        "defaultContent": []
      },
      {
        "id": "s3",
        "name": "Recent Articles",
        "selector": [
          "#container-9c4899b718"
        ],
        "style": null,
        "blocks": [
          "cards-teaser"
        ],
        "defaultContent": [
          "#title-c2d2b28d00",
          "#button-2e6d32893a"
        ]
      },
      {
        "id": "s4",
        "name": "Next Adventures",
        "selector": [
          "#container-9c4899b718 .cmp-teaser--imagebottom",
          ".cmp-teaser--imagebottom"
        ],
        "style": null,
        "blocks": [
          "hero-promo"
        ],
        "defaultContent": [
          "#title-971080d74b"
        ]
      },
      {
        "id": "s5",
        "name": "Where do you want to go",
        "selector": [
          "#container-4d3fed64ff"
        ],
        "style": null,
        "blocks": [
          "cards-teaser"
        ],
        "defaultContent": [
          "#title-ca6ac0fe65",
          "#button-b6562c963d"
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

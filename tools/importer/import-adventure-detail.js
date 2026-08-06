/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselGalleryParser from "./parsers/carousel-gallery.js";
import adventureDetailsParser from "./parsers/adventure-details.js";
import tabsAdventureParser from "./parsers/tabs-adventure.js";

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from "./transformers/wknd-cleanup.js";
import wkndSectionsTransformer from "./transformers/wknd-sections.js";

// PARSER REGISTRY
const parsers = {
  "carousel-gallery": carouselGalleryParser,
  "adventure-details": adventureDetailsParser,
  "tabs-adventure": tabsAdventureParser,
};

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {
    "name": "adventure-detail",
    "description": "Adventure detail page with hero image, itinerary/details block and body content sections",
    "urls": [
      "https://wknd.site/us/en/adventures/bali-surf-camp.html",
      "https://wknd.site/us/en/adventures/beervana-portland.html",
      "https://wknd.site/us/en/adventures/climbing-new-zealand.html",
      "https://wknd.site/us/en/adventures/colorado-rock-climbing.html",
      "https://wknd.site/us/en/adventures/cycling-southern-utah.html",
      "https://wknd.site/us/en/adventures/cycling-tuscany.html",
      "https://wknd.site/us/en/adventures/downhill-skiing-wyoming.html",
      "https://wknd.site/us/en/adventures/gastronomic-marais-tour.html",
      "https://wknd.site/us/en/adventures/napa-wine-tasting.html",
      "https://wknd.site/us/en/adventures/riverside-camping-australia.html",
      "https://wknd.site/us/en/adventures/ski-touring-mont-blanc.html",
      "https://wknd.site/us/en/adventures/surf-camp-costa-rica.html",
      "https://wknd.site/us/en/adventures/tahoe-skiing.html",
      "https://wknd.site/us/en/adventures/west-coast-cycling.html",
      "https://wknd.site/us/en/adventures/whistler-mountain-biking.html",
      "https://wknd.site/us/en/adventures/yosemite-backpacking.html"
    ],
    "blocks": [
      {
        "name": "carousel-gallery",
        "instances": [
          ".cmp-carousel--mini"
        ]
      },
      {
        "name": "adventure-details",
        "instances": [
          ".cmp-contentfragment--elements .cmp-contentfragment__elements",
          ".cmp-contentfragment--elements"
        ]
      },
      {
        "name": "tabs-adventure",
        "instances": [
          ".cmp-tabs"
        ]
      }
    ],
    "sections": [
      {
        "id": "ad1",
        "name": "Hero gallery",
        "selector": [
          ".cmp-carousel--mini"
        ],
        "style": null,
        "blocks": [
          "carousel-gallery"
        ],
        "defaultContent": []
      },
      {
        "id": "ad2",
        "name": "Title",
        "selector": [
          ".cmp-title--underline"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "h1"
        ]
      },
      {
        "id": "ad3",
        "name": "Details panel",
        "selector": [
          ".cmp-contentfragment--elements"
        ],
        "style": null,
        "blocks": [
          "adventure-details"
        ],
        "defaultContent": []
      },
      {
        "id": "ad4",
        "name": "Tabs content",
        "selector": [
          ".cmp-tabs"
        ],
        "style": null,
        "blocks": [
          "tabs-adventure"
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

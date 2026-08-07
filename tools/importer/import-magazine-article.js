/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import articleAuthorParser from "./parsers/article-author.js";
import articleListParser from "./parsers/article-list.js";

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from "./transformers/wknd-cleanup.js";
import wkndSectionsTransformer from "./transformers/wknd-sections.js";

// PARSER REGISTRY
const parsers = {
  "article-author": articleAuthorParser,
  "article-list": articleListParser,
};

// PAGE TEMPLATE CONFIGURATION (embedded from page-templates.json)
const PAGE_TEMPLATE = {
    "name": "magazine-article",
    "description": "Editorial article page with hero image, title, byline, body sections with inline images and an author credit block",
    "urls": [
      "https://wknd.site/us/en/magazine/arctic-surfing.html",
      "https://wknd.site/us/en/magazine/guide-la-skateparks.html",
      "https://wknd.site/us/en/magazine/san-diego-surf.html",
      "https://wknd.site/us/en/magazine/ski-touring.html",
      "https://wknd.site/us/en/magazine/western-australia.html"
    ],
    "blocks": [
      {
        "name": "article-author",
        "instances": [
          ".cmp-byline",
          ".cmp-teaser--author"
        ]
      },
      {
        "name": "article-list",
        "instances": [
          ".cmp-layoutcontainer--sidebar .cmp-list",
          ".cmp-list--related"
        ]
      }
    ],
    "sections": [
      {
        "id": "a1",
        "name": "Lead image",
        "selector": [
          "#image-f205e2e1b8",
          ".cmp-image--lead"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "img"
        ]
      },
      {
        "id": "a2",
        "name": "Breadcrumb",
        "selector": [
          ".cmp-breadcrumb"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          ".cmp-breadcrumb__list"
        ]
      },
      {
        "id": "a3",
        "name": "Title + byline",
        "selector": [
          ".cmp-title"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "h1",
          "h4"
        ]
      },
      {
        "id": "a4",
        "name": "Article body",
        "selector": [
          ".cmp-contentfragment"
        ],
        "style": null,
        "blocks": [],
        "defaultContent": [
          "p",
          "blockquote",
          "h2"
        ]
      },
      {
        "id": "a5",
        "name": "Author credit",
        "selector": [
          ".cmp-byline",
          ".cmp-teaser--author"
        ],
        "style": null,
        "blocks": [
          "article-author"
        ],
        "defaultContent": []
      },
      {
        "id": "a6",
        "name": "Related articles",
        "selector": [
          ".cmp-layoutcontainer--sidebar"
        ],
        "style": null,
        "blocks": [
          "article-list"
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

// Extract author name from a byline element like "By Jacob Wester"
function extractAuthor(document) {
  const nodes = document.querySelectorAll("h1, h2, h3, h4, h5, h6, p");
  for (const n of nodes) {
    const t = (n.textContent || "").trim();
    const m = t.match(/^By\s+(.+)$/i);
    if (m && m[1].length < 60) return m[1].trim();
  }
  return "";
}

// Extract a publication date like "Thursday, 9 Jul 2020" and normalize to YYYY-MM-DD
function extractPublicationDate(document) {
  const re = /((?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day),\s*(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/;
  const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const nodes = document.querySelectorAll("p, span, time, div");
  for (const n of nodes) {
    const m = (n.textContent || "").match(re);
    if (m) {
      const mon = months[m[3].slice(0, 3).toLowerCase()];
      if (mon !== undefined) {
        const d = new Date(Date.UTC(parseInt(m[4], 10), mon, parseInt(m[2], 10)));
        return { display: m[0], iso: d.toISOString().slice(0, 10) };
      }
    }
  }
  return { display: "", iso: "" };
}

// Read a <meta> content value by name or property
function metaContent(document, key) {
  const el = document.querySelector(`meta[name="${key}" i], meta[property="${key}" i]`);
  return el ? (el.getAttribute("content") || "").trim() : "";
}

// Build a self-contained Metadata block (title/description/image + author/date/template)
function buildMetadataBlock(main, document, extra) {
  const title = metaContent(document, "og:title") || metaContent(document, "title") || document.title || "";
  const description = metaContent(document, "og:description") || metaContent(document, "description") || "";
  const imageUrl = metaContent(document, "og:image") || metaContent(document, "image") || "";

  const rows = [];
  if (title) rows.push(["Title", title]);
  if (description) rows.push(["Description", description]);
  if (imageUrl) {
    const img = document.createElement("img");
    img.setAttribute("src", imageUrl);
    rows.push(["Image", img]);
  }
  extra.forEach(([k, v]) => { if (v) rows.push([k, v]); });

  const cells = rows.map(([k, v]) => {
    const valCell = typeof v === "string" ? v : v;
    return [k, valCell];
  });
  const block = WebImporter.Blocks.createBlock(document, { name: "Metadata", cells });
  main.appendChild(block);
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // Capture author/date from the ORIGINAL source DOM before transforms mutate it
    const author = extractAuthor(document);
    const pubDate = extractPublicationDate(document);

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

    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // Build an enriched Metadata block (title/description/image + author/date/template)
    // in place of WebImporter.rules.createMetadata so the query index can expose these fields.
    const hr = document.createElement("hr");
    main.appendChild(hr);
    buildMetadataBlock(main, document, [
      ["Template", PAGE_TEMPLATE.name],
      ["Author", author],
      ["Publication Date", pubDate.display],
    ]);

    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        author,
        publicationDate: pubDate.iso,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};

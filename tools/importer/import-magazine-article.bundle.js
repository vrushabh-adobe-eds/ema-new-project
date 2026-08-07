/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-magazine-article.js
  var import_magazine_article_exports = {};
  __export(import_magazine_article_exports, {
    default: () => import_magazine_article_default
  });

  // tools/importer/parsers/article-author.js
  function parse(element, { document }) {
    const image = element.querySelector(".cmp-byline__image img, .cmp-image__image, img");
    const name = element.querySelector(".cmp-byline__name, .cmp-teaser__title, h1, h2, h3, h4");
    const role = element.querySelector(
      '.cmp-byline__occupations, .cmp-teaser__description, [class*="occupation"], [class*="role"], p'
    );
    const socialLinks = Array.from(element.querySelectorAll(
      '.cmp-byline__social a[href], [class*="social"] a[href], a[href*="facebook"], a[href*="twitter"], a[href*="instagram"]'
    ));
    const contentCell = [];
    if (image) contentCell.push(image);
    if (name) contentCell.push(name);
    if (role) contentCell.push(role);
    contentCell.push(...socialLinks);
    if (!image && !name && !role && socialLinks.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[contentCell]];
    const block = WebImporter.Blocks.createBlock(document, { name: "article-author", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/article-list.js
  function parse2(element, { document }) {
    const firstLink = element.querySelector("a[href]");
    const href = firstLink ? firstLink.getAttribute("href") : "";
    let indexPath = "/us/en/magazine/query-index.json";
    if (/\/adventures\//.test(href)) indexPath = "/us/en/adventures/query-index.json";
    const isLanding = !!element.closest(".image-list");
    const cells = isLanding ? [[indexPath]] : [["4"], [indexPath]];
    const block = WebImporter.Blocks.createBlock(document, { name: "article-list", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var EMPTY_WRAPPER_SELECTOR = [
    ".cmp-container",
    ".responsivegrid",
    ".aem-Grid",
    ".aem-GridColumn",
    ".container",
    ".xf-content-height",
    ".separator"
  ].join(", ");
  function removeEmptyWrappers(root) {
    let removedInPass = true;
    while (removedInPass) {
      removedInPass = false;
      root.querySelectorAll(EMPTY_WRAPPER_SELECTOR).forEach((el) => {
        if (!el.isConnected) return;
        if (el.matches("main, body, header, footer")) return;
        const hasText = el.textContent && el.textContent.trim().length > 0;
        const hasContent = el.querySelector(
          "img, picture, source, svg, video, audio, iframe, input, button, table, hr, a, h1, h2, h3, h4, h5, h6, p, li, blockquote"
        );
        if (!hasText && !hasContent) {
          el.remove();
          removedInPass = true;
        }
      });
    }
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#toggleNav",
        // cleaned.html:454 — mobile nav toggle button
        "#mobileNav",
        // cleaned.html:460 — mobile nav overlay
        ".cmp-navigation--mobile",
        // cleaned.html:460 — mobile nav overlay
        'iframe[src*="demdex"]',
        // cleaned.html:452 — Adobe ID syncing / tracking iframe
        'iframe[title*="Adobe ID Syncing"]'
        // cleaned.html:452 — same tracking iframe (id varies per page)
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Header experience fragment and its parts
        "header",
        // cleaned.html:5 — header XF wrapper (semantic tag)
        ".cmp-experiencefragment--header",
        // cleaned.html:5-6 — header XF
        ".cmp-navigation--header",
        // cleaned.html:111-112 — main navigation
        ".cmp-search--header",
        // cleaned.html:134-135 — header search widget
        ".cmp-languagenavigation--header",
        // cleaned.html:21 — language switcher
        ".sign-in-buttons",
        // cleaned.html:14 — sign in/out utility bar column
        ".wknd-sign-in-buttons",
        // cleaned.html:15 — sign in/out widget
        // Footer experience fragment and its parts
        "footer",
        // cleaned.html:357 — footer XF wrapper (semantic tag)
        ".cmp-experiencefragment--footer",
        // cleaned.html:357-358 — footer XF
        ".cmp-navigation--footer",
        // cleaned.html:373-374 — footer navigation
        // Breadcrumb (not on FAQ page; documented in page-templates.json →
        // magazine-article section "a2" selector ".cmp-breadcrumb")
        ".cmp-breadcrumb",
        // Hidden decorative separators (non-authorable visual dividers)
        ".cmp-separator--hidden",
        // cleaned.html:334, 428
        // Non-authorable leftover / malformed elements
        "meta",
        // cleaned.html:176 — stray <meta> inside content image
        "link",
        "noscript",
        "script",
        "style"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const name = attr.name;
          if (name.startsWith("on") || name.startsWith("data-cmp-") || name.startsWith("data-track")) {
            el.removeAttribute(name);
          }
        });
      });
      removeEmptyWrappers(element);
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function findSectionElement(root, selectors) {
    if (!selectors) return null;
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (let i = 0; i < list.length; i += 1) {
      const sel = list[i];
      if (!sel) continue;
      let el = null;
      try {
        el = root.querySelector(sel);
      } catch (e) {
        el = null;
      }
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const template = payload && payload.template;
    const sections = template && template.sections;
    if (!sections || sections.length < 2) return;
    const doc = element.ownerDocument;
    const firstInMain = element.querySelector("*");
    const resolved = sections.map((section) => ({
      section,
      el: findSectionElement(element, section.selector)
    }));
    for (let i = resolved.length - 1; i >= 0; i -= 1) {
      const { section, el } = resolved[i];
      if (!el || !el.parentNode) continue;
      if (section.style) {
        const block = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        el.parentNode.insertBefore(block, el.nextSibling);
      }
      if (i > 0 && el !== firstInMain) {
        const hr = doc.createElement("hr");
        el.parentNode.insertBefore(hr, el);
      }
    }
  }

  // tools/importer/import-magazine-article.js
  var parsers = {
    "article-author": parse,
    "article-list": parse2
  };
  var PAGE_TEMPLATE = {
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
  var transformers = [
    transform,
    transform2
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
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
  function extractAuthor(document) {
    const nodes = document.querySelectorAll("h1, h2, h3, h4, h5, h6, p");
    for (const n of nodes) {
      const t = (n.textContent || "").trim();
      const m = t.match(/^By\s+(.+)$/i);
      if (m && m[1].length < 60) return m[1].trim();
    }
    return "";
  }
  function extractPublicationDate(document) {
    const re = /((?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day),\s*(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/;
    const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
    const nodes = document.querySelectorAll("p, span, time, div");
    for (const n of nodes) {
      const m = (n.textContent || "").match(re);
      if (m) {
        const mon = months[m[3].slice(0, 3).toLowerCase()];
        if (mon !== void 0) {
          const d = new Date(Date.UTC(parseInt(m[4], 10), mon, parseInt(m[2], 10)));
          return { display: m[0], iso: d.toISOString().slice(0, 10) };
        }
      }
    }
    return { display: "", iso: "" };
  }
  function metaContent(document, key) {
    const el = document.querySelector(`meta[name="${key}" i], meta[property="${key}" i]`);
    return el ? (el.getAttribute("content") || "").trim() : "";
  }
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
    extra.forEach(([k, v]) => {
      if (v) rows.push([k, v]);
    });
    const cells = rows.map(([k, v]) => {
      const valCell = typeof v === "string" ? v : v;
      return [k, valCell];
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Metadata", cells });
    main.appendChild(block);
  }
  var import_magazine_article_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      const author = extractAuthor(document);
      const pubDate = extractPublicationDate(document);
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      const seen = /* @__PURE__ */ new Set();
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        if (seen.has(block.element)) return;
        seen.add(block.element);
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      buildMetadataBlock(main, document, [
        ["Template", PAGE_TEMPLATE.name],
        ["Author", author],
        ["Publication Date", pubDate.display]
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
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_magazine_article_exports);
})();

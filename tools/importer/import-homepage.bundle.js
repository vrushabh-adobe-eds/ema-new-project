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

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel-hero.js
  function parse(element, { document }) {
    const slides = Array.from(element.querySelectorAll(
      ':scope .cmp-carousel__item, :scope [class*="carousel__item"]'
    ));
    const cells = [];
    slides.forEach((slide) => {
      const image = slide.querySelector(".cmp-teaser__image img, .cmp-image__image, img");
      const titleEl = slide.querySelector(".cmp-teaser__title, .cmp-carousel__title, h1, h2, h3");
      const descEl = slide.querySelector('.cmp-teaser__description, [class*="description"]');
      const ctas = Array.from(slide.querySelectorAll(
        ".cmp-teaser__action-link, a.cmp-button, a.button"
      ));
      if (!image && !titleEl && !descEl && ctas.length === 0) return;
      const textCell = [];
      if (titleEl) {
        const heading = document.createElement("h2");
        heading.textContent = titleEl.textContent.trim();
        textCell.push(heading);
      }
      if (descEl && descEl.textContent.trim()) textCell.push(descEl);
      textCell.push(...ctas);
      cells.push([image || "", textCell.length ? textCell : ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-featured.js
  function parse2(element, { document }) {
    const pretitle = element.querySelector('.cmp-teaser__pretitle, [class*="pretitle"]');
    const titleEl = element.querySelector('.cmp-teaser__title, [class*="title"] h2, h1, h2, h3');
    const descEl = element.querySelector('.cmp-teaser__description, [class*="description"]');
    const ctas = Array.from(element.querySelectorAll(
      ".cmp-teaser__action-link, a.cmp-button, a.button"
    ));
    const image = element.querySelector(".cmp-teaser__image img, .cmp-image__image, img");
    if (!titleEl && !descEl && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const textCell = [];
    if (pretitle && pretitle.textContent.trim()) textCell.push(pretitle);
    if (titleEl) {
      const heading = document.createElement("h2");
      heading.textContent = titleEl.textContent.trim();
      textCell.push(heading);
    }
    if (descEl && descEl.textContent.trim()) textCell.push(descEl);
    textCell.push(...ctas);
    const cells = [[
      textCell.length ? textCell : "",
      image || ""
    ]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-featured", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-teaser.js
  function parse3(element, { document }) {
    const items = Array.from(element.querySelectorAll(
      ":scope .cmp-image-list__item, :scope .cmp-list__item, :scope li"
    ));
    const cells = [];
    items.forEach((item) => {
      const image = item.querySelector("img");
      const titleEl = item.querySelector(
        '.cmp-image-list__item-title, .cmp-list__item-title, [class*="title"]'
      );
      const titleLink = item.querySelector(
        ".cmp-image-list__item-title-link, .cmp-image-list__item-image-link, a[href]"
      );
      const descEl = item.querySelector(
        '.cmp-image-list__item-description, .cmp-list__item-description, [class*="description"]'
      );
      if (!image && !titleEl && !descEl) return;
      const textCell = [];
      if (titleEl) {
        const titleText = titleEl.textContent.trim();
        const heading = document.createElement("h3");
        const href = titleLink ? titleLink.getAttribute("href") : null;
        if (href) {
          const a = document.createElement("a");
          a.setAttribute("href", href);
          a.textContent = titleText;
          heading.appendChild(a);
        } else {
          heading.textContent = titleText;
        }
        textCell.push(heading);
      }
      if (descEl && descEl.textContent.trim()) textCell.push(descEl);
      cells.push([image || "", textCell.length ? textCell : ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-teaser", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-promo.js
  function parse4(element, { document }) {
    const image = element.querySelector(".cmp-teaser__image img, .cmp-image__image, img");
    const titleEl = element.querySelector(".cmp-teaser__title, .cmp-title__text, h1, h2, h3");
    const descEl = element.querySelector('.cmp-teaser__description, [class*="description"], p');
    const ctas = Array.from(element.querySelectorAll(
      ".cmp-teaser__action-link, a.cmp-button, a.button"
    ));
    if (!image && !titleEl && !descEl && ctas.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (image) cells.push([image]);
    const contentCell = [];
    if (titleEl) {
      const heading = document.createElement("h1");
      heading.textContent = titleEl.textContent.trim();
      contentCell.push(heading);
    }
    if (descEl && descEl.textContent.trim()) contentCell.push(descEl);
    contentCell.push(...ctas);
    cells.push([contentCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-promo", cells });
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

  // tools/importer/import-homepage.js
  var parsers = {
    "carousel-hero": parse,
    "columns-featured": parse2,
    "cards-teaser": parse3,
    "hero-promo": parse4
  };
  var PAGE_TEMPLATE = {
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
  var import_homepage_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
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
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();

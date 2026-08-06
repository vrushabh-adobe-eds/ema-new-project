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

  // tools/importer/import-adventure-detail.js
  var import_adventure_detail_exports = {};
  __export(import_adventure_detail_exports, {
    default: () => import_adventure_detail_default
  });

  // tools/importer/parsers/carousel-gallery.js
  function parse(element, { document }) {
    const slides = Array.from(element.querySelectorAll(
      ':scope .cmp-carousel__item, :scope [class*="carousel__item"]'
    ));
    const parsed = slides.map((slide) => {
      const image = slide.querySelector("img");
      const titleEl = slide.querySelector(
        '.cmp-carousel__title, .cmp-title, [class*="title"] h1, [class*="title"] h2, h2, h3'
      );
      const descEl = slide.querySelector(
        '.cmp-carousel__description, .cmp-text p, [class*="description"]'
      );
      const ctas = Array.from(slide.querySelectorAll("a.cmp-button, .cmp-teaser__action-link, a.button"));
      const textParts = [];
      if (titleEl) textParts.push(titleEl);
      if (descEl) textParts.push(descEl);
      textParts.push(...ctas);
      return { image, textParts };
    }).filter((p) => p.image || p.textParts.length);
    const hasText = parsed.some((p) => p.textParts.length > 0);
    const cells = [];
    parsed.forEach((p) => {
      if (hasText) {
        cells.push([p.image || "", p.textParts.length ? p.textParts : ""]);
      } else {
        cells.push([p.image || ""]);
      }
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-gallery", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/adventure-details.js
  function parse2(element, { document }) {
    const cells = [];
    const specEls = Array.from(element.querySelectorAll(
      ".cmp-contentfragment__element, dl > div"
    ));
    specEls.forEach((spec) => {
      const labelEl = spec.querySelector(".cmp-contentfragment__element-title, dt");
      const valueEl = spec.querySelector(".cmp-contentfragment__element-value, dd");
      const label = labelEl ? labelEl.textContent.trim() : "";
      const value = valueEl ? valueEl.textContent.trim() : "";
      if (!label && !value) return;
      cells.push([label, value]);
    });
    if (cells.length === 0) {
      const dts = Array.from(element.querySelectorAll("dt"));
      dts.forEach((dt) => {
        const dd = dt.nextElementSibling && dt.nextElementSibling.tagName === "DD" ? dt.nextElementSibling : null;
        const label = dt.textContent.trim();
        const value = dd ? dd.textContent.trim() : "";
        if (!label && !value) return;
        cells.push([label, value]);
      });
    }
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "adventure-details", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-adventure.js
  function parse3(element, { document }) {
    const labels = Array.from(element.querySelectorAll(
      ":scope .cmp-tabs__tablist .cmp-tabs__tab, :scope .cmp-tabs__tab"
    ));
    const panels = Array.from(element.querySelectorAll(
      ':scope .cmp-tabs__tabpanel, :scope [class*="tabpanel"]'
    ));
    const cells = [];
    labels.forEach((label, i) => {
      const labelText = label.textContent.trim();
      const panel = panels[i];
      const contentEls = [];
      if (panel) {
        const nodes = Array.from(panel.querySelectorAll(
          ":scope h2, :scope h3, :scope h4, :scope h5, :scope h6, :scope p, :scope ul, :scope ol, :scope blockquote, :scope img"
        )).filter((n) => n.textContent.trim() || n.tagName === "IMG" || n.querySelector("img"));
        contentEls.push(...nodes);
      }
      if (!labelText && contentEls.length === 0) return;
      cells.push([labelText, contentEls.length ? contentEls : ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "tabs-adventure", cells });
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

  // tools/importer/import-adventure-detail.js
  var parsers = {
    "carousel-gallery": parse,
    "adventure-details": parse2,
    "tabs-adventure": parse3
  };
  var PAGE_TEMPLATE = {
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
  var import_adventure_detail_default = {
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
  return __toCommonJS(import_adventure_detail_exports);
})();

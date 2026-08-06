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

  // tools/importer/import-about-us.js
  var import_about_us_exports = {};
  __export(import_about_us_exports, {
    default: () => import_about_us_default
  });

  // tools/importer/parsers/contributors.js
  function parse(element, { document }) {
    let personUnits = Array.from(element.querySelectorAll(
      '.cmp-experiencefragment[class*="cmp-experiencefragment--"]'
    ));
    if (personUnits.length === 0) personUnits = [element];
    const cells = [];
    personUnits.forEach((person) => {
      const image = person.querySelector(".cmp-image__image, .image img, img");
      const titleEls = Array.from(person.querySelectorAll(
        ".cmp-title__text, .cmp-title h1, .cmp-title h2, .cmp-title h3, .cmp-title h4, .cmp-title h5"
      ));
      const nameEl = titleEls[0] || null;
      const roleEl = titleEls[1] || null;
      const socialAnchors = Array.from(person.querySelectorAll(
        'a.cmp-button[href], [class*="btn-list"] a[href], [class*="social"] a[href]'
      )).map((a) => {
        const href = a.getAttribute("href");
        const labelEl = a.querySelector(".cmp-button__text");
        const label = (labelEl ? labelEl.textContent : a.textContent).trim();
        if (!href) return null;
        const link = document.createElement("a");
        link.setAttribute("href", href);
        link.textContent = label || href;
        return link;
      }).filter(Boolean);
      if (!image && !nameEl && !roleEl && socialAnchors.length === 0) return;
      const contentCell = [];
      if (image) contentCell.push(image);
      if (nameEl) {
        const heading = document.createElement("h3");
        heading.textContent = nameEl.textContent.trim();
        contentCell.push(heading);
      }
      if (roleEl && roleEl.textContent.trim()) {
        const role = document.createElement("p");
        role.textContent = roleEl.textContent.trim();
        contentCell.push(role);
      }
      contentCell.push(...socialAnchors);
      cells.push([contentCell]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "contributors", cells });
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

  // tools/importer/import-about-us.js
  var parsers = {
    "contributors": parse
  };
  var PAGE_TEMPLATE = {
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
  var import_about_us_default = {
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
  return __toCommonJS(import_about_us_exports);
})();

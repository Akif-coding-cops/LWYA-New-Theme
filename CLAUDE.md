# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the **Love Who You Are (LWYA)** Shopify theme — a beauty/cosmetics and jewelry brand. It is built on the **Prestige theme v10.0.2** by Maestrooo, heavily customized with brand-specific sections, a custom product detail page (PDP), and Tailwind CSS integration.

## Development Commands

Theme development requires the [Shopify CLI](https://shopify.dev/docs/themes/tools/cli) (v3.91.0 installed):

```bash
# Start local dev server (hot-reloads on file save, proxies to a development theme)
shopify theme dev --store=<store-handle>.myshopify.com

# Push local changes to a theme
shopify theme push --store=<store-handle>.myshopify.com

# Pull theme from Shopify to local
shopify theme pull --store=<store-handle>.myshopify.com

# List available themes on the store
shopify theme list --store=<store-handle>.myshopify.com
```

**Tailwind CSS**: `assets/output.css` is the compiled Tailwind output. `assets/input.css` is the source (components + utilities only — preflight is disabled to avoid conflicts with Prestige base styles). Recompile after adding new Tailwind classes:

```bash
npx tailwindcss -i ./assets/input.css -o ./assets/output.css --watch
```

There is no `package.json` in this directory; Tailwind is invoked via `npx` or a globally installed CLI.

## Architecture

### Directory Structure

Standard Shopify theme layout: `layout/`, `sections/`, `snippets/`, `templates/`, `assets/`, `config/`, `locales/`.

- **`config/settings_schema.json`** — Shopify theme editor settings (typography, color schemes, spacing)
- **`config/settings_data.json`** — Saved values for those settings
- **`locales/en.default.json`** — Default translation strings; other locales follow the same shape
- **`.shopify/metafields.json`** — Registered metafield definitions (product, collection, page)

### JavaScript Architecture

`assets/theme.js` is a **minified, bundled file** of Web Components (classes extending `HTMLElement`). Do not edit it directly — it's built from source outside this directory. It is loaded as an ES module via importmap.

`assets/vendor.min.js` provides third-party utilities (also loaded via importmap).

`assets/newpdp.js` is **hand-written, unminified JS** for the custom new PDP. This is the file to edit for new PDP interactivity. It reads product/variant data from a `<script type="application/json" id="lwya-product-variants">` tag rendered server-side in `snippets/newpdp-add-to-cart.liquid`.

jQuery 3.7.1 and Swiper are loaded globally in `layout/theme.liquid` (via `<script>` tags, available as `$` and `Swiper` globals).

### CSS Architecture

Four stylesheets are loaded on every page:
1. `theme.css` — Prestige base styles
2. `product.css` — Original PDP styles
3. `newpdp.css` — Custom new PDP styles
4. `output.css` — Compiled Tailwind CSS

Tailwind classes use the `tw-` prefix (configured to avoid collisions with Prestige). Template-specific overrides use body classes: `var__{{ template.suffix }}` and `name__{{ template.name }}`. Custom fonts (Gotham Bold, FoundersGrotesk-Bold, Didot, Inria Sans) are loaded via `@font-face` in `layout/theme.liquid`.

### Section Naming Conventions

| Prefix | Origin |
|--------|--------|
| `AI-` | Custom sections built for LWYA (e.g., `AI-FeaturedProduct`, `AI-NEWHeader`, `AI-Accordion`) |
| `ss-` | Third-party sections from an external app/library |
| `BFF-` | Sections specific to BFF loyalty/rewards pages |
| *(no prefix)* | Sections from the base Prestige theme |
| `newpdp-` | Snippet prefix for new PDP components |

### Product Templates & PDP Architecture

The store has two PDP implementations active simultaneously:

1. **Original Prestige PDP** (`sections/main-product.liquid` + `snippets/product-gallery.liquid` + `snippets/product-info.liquid`): The base theme PDP, used as a fallback. Still referenced in `templates/product.json` but disabled in that template's section order.

2. **Custom New PDP** (`sections/newmain-product.liquid`): A Tailwind-first, block-based product page. Layout is a two-column CSS Grid (gallery left, info right sticky). All info-column blocks are defined in the section schema and rendered via `{% case block.type %}`. Key snippets:
   - `newpdp-gallery.liquid` — Desktop 3-image grid + mobile Swiper carousel; reads `custom.variant_media` metafield for variant-specific image overrides
   - `newpdp-variants.liquid` — Color swatches + dropdowns; reads `custom.disable_variant` metafield to hide specific variants
   - `newpdp-add-to-cart.liquid` — Renders the ATC form and serializes all variant data to JSON for `newpdp.js`
   - `newpdp-price.liquid`, `newpdp-title.liquid`, `newpdp-key-features.liquid`, etc. — Individual info blocks

Many products use specialized templates (e.g., `templates/product.jewelry.json`, `templates/product.fb-ads-landing-page-v1.json`) that compose different section combinations.

### Header / Footer Groups

Header selection logic in `layout/theme.liquid`:
- Templates with suffix `vivacity`, `audacity`, `tenacity`, `flash-lash-3`, or `fragrance` → `sections/header-group-vivacity.json`
- All others → `sections/header-group-newpdp.json`

Footer group: `sections/footer-group-newpdp.json` (used on all non-password pages).

The `.json` group files are **auto-generated by Shopify** — avoid manual edits; use the theme editor instead.

### Third-Party App Integrations

- **Rebuy SmartCart**: All add-to-cart form submissions are intercepted globally in `layout/theme.liquid`. The handler calls `/cart/add.js`, then fires `variant:add` and `cart:change` custom events, and opens the Rebuy drawer. Do not add native cart-drawer logic — it will conflict.
- **Loox Reviews**: Loaded via app blocks in section JSON; `loox-rating` and `loox-dynamic-section` block types. Empty iframe suppression script in `layout/theme.liquid`.
- **Recharge Subscriptions**: `subscription-widget-v2` app block rendered inside the new PDP via the `add_to_cart` block.
- **GLightbox**: Loaded via CDN in `sections/newmain-product.liquid` for image zoom on the new PDP.

### Custom Metafields (Product)

The most important `custom` namespace metafields used in theme code:

| Key | Usage |
|-----|-------|
| `highlight_icons` / `highlights` | Icon+label pairs shown below gallery |
| `custom_product_videos` | Videos shown in new PDP video block |
| `variant_media` | Per-variant image list (overrides default gallery) |
| `disable_variant` | Boolean to hide a variant from selectors |
| `variant_title` | Display name override for a variant |
| `ingredient_paragraph` / `ingredients_image` | Ingredients accordion + image |
| `how_to_use_description` / `benefit_paragraph` | Additional accordion content |
| `pair_it_with` / `save_with_sets` | Product reference lists for upsell blocks |
| `faq_question_1`–`question_8` + `question_N_description` | FAQ entries for AI-Accordion |
| `icons_shipping_bundle_moneyback` / `shipping_bundle_moneyback` | Icon+label pairs for trust badges |

### Collection Templates

Multiple collection templates exist for different product lines: `beauty`, `bling`, `chameleon`, `fragrance`, `jewelry`, `skintastic`, `vivacity`. Each composes different sections in its JSON template file.

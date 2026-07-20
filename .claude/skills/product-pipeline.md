# LWYA Product Pipeline

Automated product creation pipeline for LWYA (Love Who You Are) beauty/skincare brand on Shopify.

## What This Does
Takes a product detail document (.docx) + Figma design file and:
1. Downloads all product images from Figma (3x JPG)
2. Parses the document into structured metafield data
3. Creates a **draft** product in Shopify with all media + metafields set

## Project Structure
```
.claude/agents/
  figma-image-fetcher.md      # Agent 1: downloads images from Figma
  document-parser.md           # Agent 2: parses .docx → metafield JSON
  shopify-product-creator.md   # Agent 3: creates product in Shopify

scripts/
  create-product.ts            # Orchestrator — generates agent input files
  types.ts                     # Shared TypeScript types + metafield key maps

products/
  liptastic-luxline-simple.json    # Example: simple product config
  liptastic-luxline-variant.json   # Example: variant product config

docs/
  [product detail .docx files go here]
```

## How To Run

### Quick Start (simple product)
```bash
ts-node scripts/create-product.ts \
  --type simple \
  --slug "product-handle-here" \
  --figma "https://www.figma.com/design/FILE_KEY/..." \
  --doc "./docs/ProductName_Internal_CC.docx"
```

### Using a config file
```bash
ts-node scripts/create-product.ts --config ./products/liptastic-luxline-simple.json
```

This generates input files in `/tmp/product-assets/[slug]/`. Then run agents in order.

### Running Agents in Claude Code
After running the orchestrator script:

```
> Run the Figma image fetcher using the input at /tmp/product-assets/[slug]/figma-input.json

> Run the document parser using the input at /tmp/product-assets/[slug]/parser-input.json

> Run the Shopify product creator using the input at /tmp/product-assets/[slug]/shopify-input.json
```

## Product Types

### Simple Product
- One document, one Figma URL
- Variants listed IN the document (e.g. "2 Shades: Nude Beige, Golden Rose")
- All variants share the same content/images
- Product-level metafields are used

### Variant Product  
- One document + one Figma URL PER VARIANT
- Each variant has its own images, content, FAQs
- Variant-level metafields are used (prefixed with `variant_`)

## Metafield Namespace
All metafields use namespace: `custom`

## Important Rules
- Products are ALWAYS created as `draft` — never published
- Shopify MCP: uses `shopify-mcp` (GeLi2001) configured in `~/.claude/settings.json`
- Figma MCP: configured in `~/.claude/settings.json`
- Rich text fields use Shopify's JSON schema (not raw HTML)
- FAQ keys: first is `faq_question_1` / `question_1_description`, then `question_2` / `question_2_description` up to 8

## MCP Servers Required
- `figma` — for image exports
- `shopify` — for product/metafield/media creation

## Store
- Store: lwya.com
- Configured in Shopify MCP settings

## Safety Rules
- NEVER update, edit, or delete any existing Shopify product
- NEVER change the status of any existing product
- Only CREATE new products, always as draft
- Only set metafields on products created in the current session
- NEVER publish a product — status must always be "draft"
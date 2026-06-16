// ─── Pipeline Input Types ───────────────────────────────────────────────────

export type ProductType = "simple" | "variant";

export interface SimpleProductInput {
  type: "simple";
  figma_url: string;
  document_path: string;
}

export interface VariantInput {
  name: string;
  figma_url: string;
  document_path: string;
}

export interface VariantProductInput {
  type: "variant";
  title: string;
  price: string;
  shared_figma_url?: string;
  variants: VariantInput[];
}

export type ProductInput = SimpleProductInput | VariantProductInput;

// ─── Parsed Document Data ───────────────────────────────────────────────────

/**
 * Product-level parsed data.
 * NOTE: "Why We Love It" content from the doc goes into `description` (Shopify body_html).
 * There is no separate why_we_love_it metafield.
 */
export interface ParsedProductData {
  title: string;
  price: string;

  variants?: Array<{ name: string; price: string }>;

  // Single-line text metafields
  weight: string; // e.g. ".28 g / 0.0098 oz" — multi-line joined with <br>

  // Rich text metafields
  key_features: string;     // → custom.key_features
  how_to_use: string;       // → custom.how_to_use_description (caution appended)
  benefits: string;         // → custom.benefit_paragraph
  key_ingredients: string;  // → custom.key_ingredients  ⚠️ verify exact key
  lwya_pro_tips: string;    // → custom.lwya_pro_tips

  // Single line text metafields
  full_ingredients: string; // → custom.ingredient_paragraph

  // Ingredient spotlights (single line text)
  ingredient_1_title: string;   // → custom.ingredient_1_title
  ingredient_1_details: string; // → custom.ingredient_1_details  ⚠️ verify
  ingredient_2_title: string;
  ingredient_2_details: string;
  ingredient_3_title: string;
  ingredient_3_details: string;
  ingredient_4_title: string;
  ingredient_4_details: string;

  // FAQ — flat keys matching Shopify metafield keys exactly
  faq_question_1: string;
  question_1_description: string;
  question_2: string;
  question_2_description: string;
  question_3: string;
  question_3_description: string;
  question_4: string;
  question_4_description: string;
  question_5: string;
  question_5_description: string;
  question_6: string;
  question_6_description: string;
  question_7: string;
  question_7_description: string;
  question_8: string;
  question_8_description: string;

  // "Why We Love It" body + anything else → Shopify product description (body_html)
  description: string;
}

/** Per-variant parsed data (variant products only) */
export interface ParsedVariantData {
  variant_name: string;

  variant_title: string;
  variant_weight: string;
  variant_full_ingredients: string;

  variant_description: string;
  variant_key_features: string;
  variant_how_to_use: string;
  variant_benefits: string;
  variant_lwya_pro_tips: string;

  variant_ingredient_1_title: string;
  variant_ingredient_1_details: string;
  variant_ingredient_2_title: string;
  variant_ingredient_2_details: string;
  variant_ingredient_3_title: string;
  variant_ingredient_3_details: string;
  variant_ingredient_4_title: string;
  variant_ingredient_4_details: string;

  // Variant FAQ — flat keys
  variant_question_1: string;
  variant_answer_1: string;
  variant_question_2: string;
  variant_answer_2: string;
  variant_question_3: string;
  variant_answer_3: string;
  variant_question_4: string;
  variant_answer_4: string;
  variant_question_5: string;
  variant_answer_5: string;
  variant_question_6: string;
  variant_answer_6: string;
  variant_question_7: string;
  variant_answer_7: string;
  variant_question_8: string;
  variant_answer_8: string;
}

// ─── Asset Types ─────────────────────────────────────────────────────────────

export interface ProductAssets {
  gallery_images: string[];
  variant_assets: Record<
    string,
    {
      media_images: string[];
      ingredient_image: string;
    }
  >;
  product_ingredient_image?: string; // → custom.ingredients_image
}

// ─── Shopify Metafield Types ─────────────────────────────────────────────────

export type MetafieldType =
  | "single_line_text_field"
  | "multi_line_text_field"
  | "rich_text_field"
  | "file_reference"
  | "list.file_reference";

export interface ShopifyMetafield {
  namespace: string;
  key: string;
  value: string;
  type: MetafieldType;
}

// ─── PRODUCT Metafield Key Map ────────────────────────────────────────────────
// All confirmed from Shopify Admin → Settings → Custom Data → Products
// ⚠️ = needs verification — check in Shopify Admin and update if wrong

export const PRODUCT_METAFIELD_MAP: Record<
  string,
  { key: string; type: MetafieldType }
> = {
  // ✅ Confirmed from screenshots
  weight:           { key: "weight",                  type: "single_line_text_field" },
  how_to_use:       { key: "how_to_use_description",  type: "rich_text_field" },
  benefits:         { key: "benefit_paragraph",       type: "rich_text_field" },
  lwya_pro_tips:    { key: "lwya_pro_tips",           type: "rich_text_field" },
  full_ingredients: { key: "ingredient_paragraph",    type: "single_line_text_field" },
  ingredients_image:{ key: "ingredients_image",       type: "file_reference" },

  ingredient_1_title:   { key: "ingredient_1_title",   type: "single_line_text_field" },
  ingredient_1_details: { key: "ingredient_1_details", type: "single_line_text_field" }, // ⚠️ verify key

  // ⚠️ Verify these keys in Shopify Admin
  key_features:     { key: "key_features",            type: "rich_text_field" },
  key_ingredients:  { key: "key_ingredients",         type: "rich_text_field" },

  ingredient_2_title:   { key: "ingredient_2_title",   type: "single_line_text_field" },
  ingredient_2_details: { key: "ingredient_2_details", type: "single_line_text_field" },
  ingredient_3_title:   { key: "ingredient_3_title",   type: "single_line_text_field" },
  ingredient_3_details: { key: "ingredient_3_details", type: "single_line_text_field" },
  ingredient_4_title:   { key: "ingredient_4_title",   type: "single_line_text_field" },
  ingredient_4_details: { key: "ingredient_4_details", type: "single_line_text_field" },
};

// ─── VARIANT Metafield Key Map ────────────────────────────────────────────────
// ⚠️ All variant keys need verification in Shopify Admin → Custom Data → Product variants

export const VARIANT_METAFIELD_MAP: Record<
  string,
  { key: string; type: MetafieldType }
> = {
  variant_title:            { key: "variant_title",           type: "single_line_text_field" },
  variant_weight:           { key: "variant_weight",          type: "single_line_text_field" },
  variant_full_ingredients: { key: "variant_ingredient_paragraph", type: "single_line_text_field" },
  variant_description:      { key: "variant_description",     type: "rich_text_field" },
  variant_key_features:     { key: "variant_key_features",    type: "rich_text_field" },
  variant_how_to_use:       { key: "variant_how_to_use_description", type: "rich_text_field" },
  variant_benefits:         { key: "variant_benefit_paragraph",     type: "rich_text_field" },
  variant_lwya_pro_tips:    { key: "variant_lwya_pro_tips",         type: "rich_text_field" },

  variant_ingredient_1_title:   { key: "variant_ingredient_1_title",   type: "single_line_text_field" },
  variant_ingredient_1_details: { key: "variant_ingredient_1_details", type: "single_line_text_field" },
  variant_ingredient_2_title:   { key: "variant_ingredient_2_title",   type: "single_line_text_field" },
  variant_ingredient_2_details: { key: "variant_ingredient_2_details", type: "single_line_text_field" },
  variant_ingredient_3_title:   { key: "variant_ingredient_3_title",   type: "single_line_text_field" },
  variant_ingredient_3_details: { key: "variant_ingredient_3_details", type: "single_line_text_field" },
  variant_ingredient_4_title:   { key: "variant_ingredient_4_title",   type: "single_line_text_field" },
  variant_ingredient_4_details: { key: "variant_ingredient_4_details", type: "single_line_text_field" },
};
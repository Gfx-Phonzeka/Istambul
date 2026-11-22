// Content types managed in the backoffice. One generic editor drives all of them.
// Labels are i18n keys. A "bilingual" field maps to two columns: <name>_en and <name>_tr.

export type FieldKind = "text" | "textarea" | "richtext" | "select" | "number" | "datetime" | "date" | "reference" | "slug" | "email";

export interface Field {
  name: string;
  label: string;
  kind: FieldKind;
  bilingual?: boolean;
  required?: boolean;
  options?: { value: string; label: string }[];
  ref?: ContentTypeKey;
  help?: string;
}

export interface ContentType {
  key: ContentTypeKey;
  table: string;
  label: string; // plural i18n key
  singular: string;
  titleColumn: string; // column used as title in lists
  fields: Field[];
  order: { column: string; ascending: boolean }[];
  parent?: { column: string; type: ContentTypeKey };
  publicPath: string; // where the content appears on the site
}

export type ContentTypeKey =
  | "handbook_chapter" | "handbook_section" | "announcement" | "deadline" | "faq_category" | "faq"
  | "glossary_term" | "contact_area" | "contact" | "legal_page" | "briefing_video" | "media_asset"
  | "cluster" | "sport" | "venue" | "venue_sport" | "camera_plan";

export const FIELD_SHAPES = ["generic", "track", "pool", "pitch", "court", "ring", "mat", "piste", "circle"] as const;

export const BRIEFING_CATEGORIES = ["welcome", "ibc", "signal", "graphics", "operations", "venues"] as const;
export const MEDIA_CATEGORIES = ["graphics", "bumpers", "curtains", "promos", "music"] as const;

const visibility: Field = {
  name: "visibility",
  label: "cms.fields.visibility",
  kind: "select",
  required: true,
  options: [
    { value: "all", label: "cms.visibility.all" },
    { value: "partners", label: "cms.visibility.partners" },
    { value: "internal", label: "cms.visibility.internal" },
  ],
};
const position: Field = { name: "position", label: "cms.fields.position", kind: "number", help: "cms.help.position" };
const title: Field = { name: "title", label: "cms.fields.title", kind: "text", bilingual: true, required: true };
const slug: Field = { name: "slug", label: "cms.fields.slug", kind: "slug", required: true, help: "cms.help.slug" };

export const CONTENT_TYPES = {
  handbook_chapter: {
    key: "handbook_chapter", table: "handbook_chapters", label: "cms.types.handbook_chapter", singular: "cms.single.handbook_chapter",
    titleColumn: "title_en", publicPath: "/handbook",
    fields: [title, slug, { name: "summary", label: "cms.fields.summary", kind: "textarea", bilingual: true }, position, visibility],
    order: [{ column: "position", ascending: true }],
  },
  handbook_section: {
    key: "handbook_section", table: "handbook_sections", label: "cms.types.handbook_section", singular: "cms.single.handbook_section",
    titleColumn: "title_en", publicPath: "/handbook", parent: { column: "chapter_id", type: "handbook_chapter" },
    fields: [
      { name: "chapter_id", label: "cms.fields.chapter", kind: "reference", ref: "handbook_chapter", required: true },
      title, slug, position, visibility,
      { name: "body", label: "cms.fields.body", kind: "richtext", bilingual: true, required: true },
    ],
    order: [{ column: "chapter_id", ascending: true }, { column: "position", ascending: true }],
  },
  announcement: {
    key: "announcement", table: "announcements", label: "cms.types.announcement", singular: "cms.single.announcement",
    titleColumn: "title_en", publicPath: "/news",
    fields: [
      title,
      {
        name: "priority", label: "cms.fields.priority", kind: "select", required: true,
        options: [{ value: "normal", label: "cms.priority.normal" }, { value: "urgent", label: "cms.priority.urgent" }],
      },
      visibility,
      { name: "body", label: "cms.fields.body", kind: "richtext", bilingual: true, required: true },
    ],
    order: [{ column: "created_at", ascending: false }],
  },
  deadline: {
    key: "deadline", table: "deadlines", label: "cms.types.deadline", singular: "cms.single.deadline",
    titleColumn: "title_en", publicPath: "/",
    fields: [title, { name: "due_at", label: "cms.fields.dueAt", kind: "datetime", required: true }, { name: "link", label: "cms.fields.link", kind: "text", help: "cms.help.link" }, visibility],
    order: [{ column: "due_at", ascending: true }],
  },
  faq_category: {
    key: "faq_category", table: "faq_categories", label: "cms.types.faq_category", singular: "cms.single.faq_category",
    titleColumn: "title_en", publicPath: "/faq",
    fields: [title, position, visibility],
    order: [{ column: "position", ascending: true }],
  },
  faq: {
    key: "faq", table: "faqs", label: "cms.types.faq", singular: "cms.single.faq",
    titleColumn: "question_en", publicPath: "/faq", parent: { column: "category_id", type: "faq_category" },
    fields: [
      { name: "category_id", label: "cms.fields.category", kind: "reference", ref: "faq_category", required: true },
      { name: "question", label: "cms.fields.question", kind: "text", bilingual: true, required: true },
      { name: "answer", label: "cms.fields.answer", kind: "richtext", bilingual: true, required: true },
      position, visibility,
    ],
    order: [{ column: "category_id", ascending: true }, { column: "position", ascending: true }],
  },
  glossary_term: {
    key: "glossary_term", table: "glossary_terms", label: "cms.types.glossary_term", singular: "cms.single.glossary_term",
    titleColumn: "term_en", publicPath: "/glossary",
    fields: [
      { name: "term", label: "cms.fields.term", kind: "text", bilingual: true, required: true },
      { name: "definition", label: "cms.fields.definition", kind: "textarea", bilingual: true, required: true },
      visibility,
    ],
    order: [{ column: "term_en", ascending: true }],
  },
  contact_area: {
    key: "contact_area", table: "contact_areas", label: "cms.types.contact_area", singular: "cms.single.contact_area",
    titleColumn: "title_en", publicPath: "/contacts",
    fields: [title, position, visibility],
    order: [{ column: "position", ascending: true }],
  },
  contact: {
    key: "contact", table: "contacts", label: "cms.types.contact", singular: "cms.single.contact",
    titleColumn: "name", publicPath: "/contacts", parent: { column: "area_id", type: "contact_area" },
    fields: [
      { name: "area_id", label: "cms.fields.area", kind: "reference", ref: "contact_area", required: true },
      { name: "name", label: "cms.fields.name", kind: "text", required: true },
      { name: "role", label: "cms.fields.role", kind: "text", bilingual: true, required: true },
      { name: "email", label: "cms.fields.email", kind: "email" },
      { name: "phone", label: "cms.fields.phone", kind: "text" },
      position, visibility,
    ],
    order: [{ column: "area_id", ascending: true }, { column: "position", ascending: true }],
  },
  legal_page: {
    key: "legal_page", table: "legal_pages", label: "cms.types.legal_page", singular: "cms.single.legal_page",
    titleColumn: "title_en", publicPath: "/legal",
    fields: [title, slug, position, { name: "body", label: "cms.fields.body", kind: "richtext", bilingual: true, required: true }],
    order: [{ column: "position", ascending: true }],
  },
} as Record<ContentTypeKey, ContentType>;

CONTENT_TYPES.briefing_video = {
  key: "briefing_video", table: "briefing_videos", label: "cms.types.briefing_video", singular: "cms.single.briefing_video",
  titleColumn: "title_en", publicPath: "/briefings",
  fields: [
    {
      name: "category", label: "cms.fields.category", kind: "select", required: true,
      options: BRIEFING_CATEGORIES.map((c) => ({ value: c, label: `briefings.categories.${c}` })),
    },
    title,
    { name: "description", label: "cms.fields.description", kind: "textarea", bilingual: true },
    { name: "recorded_on", label: "cms.fields.recordedOn", kind: "date" },
    position, visibility,
  ],
  order: [{ column: "category", ascending: true }, { column: "position", ascending: true }],
};

CONTENT_TYPES.media_asset = {
  key: "media_asset", table: "media_assets", label: "cms.types.media_asset", singular: "cms.single.media_asset",
  titleColumn: "title_en", publicPath: "/media-hub",
  fields: [
    {
      name: "category", label: "cms.fields.category", kind: "select", required: true,
      options: MEDIA_CATEGORIES.map((c) => ({ value: c, label: `mediaHub.categories.${c}` })),
    },
    { name: "subtype", label: "cms.fields.subtype", kind: "text", help: "cms.help.subtype" },
    title,
    { name: "description", label: "cms.fields.description", kind: "textarea", bilingual: true },
    position, visibility,
  ],
  order: [{ column: "category", ascending: true }, { column: "position", ascending: true }],
};

const shapeOptions = FIELD_SHAPES.map((v) => ({ value: v, label: `fields.${v}` }));

CONTENT_TYPES.cluster = {
  key: "cluster", table: "clusters", label: "cms.types.cluster", singular: "cms.single.cluster",
  titleColumn: "title_en", publicPath: "/venues",
  fields: [title, slug, position, visibility],
  order: [{ column: "position", ascending: true }],
};

CONTENT_TYPES.sport = {
  key: "sport", table: "sports", label: "cms.types.sport", singular: "cms.single.sport",
  titleColumn: "title_en", publicPath: "/venues",
  fields: [title, slug, { name: "field_shape", label: "cms.fields.fieldShape", kind: "select", required: true, options: shapeOptions, help: "cms.help.fieldShape" }, position, visibility],
  order: [{ column: "position", ascending: true }],
};

CONTENT_TYPES.venue = {
  key: "venue", table: "venues", label: "cms.types.venue", singular: "cms.single.venue",
  titleColumn: "title_en", publicPath: "/venues", parent: { column: "cluster_id", type: "cluster" },
  fields: [
    { name: "cluster_id", label: "cms.fields.cluster", kind: "reference", ref: "cluster", required: true },
    title, slug,
    { name: "address", label: "cms.fields.address", kind: "text" },
    {
      name: "production_level", label: "cms.fields.productionLevel", kind: "select", required: true,
      options: [{ value: "1", label: "venues.levels.1" }, { value: "2", label: "venues.levels.2" }, { value: "3", label: "venues.levels.3" }],
    },
    { name: "capacity", label: "cms.fields.capacity", kind: "number" },
    { name: "map_x", label: "cms.fields.mapX", kind: "number", help: "cms.help.mapXY" },
    { name: "map_y", label: "cms.fields.mapY", kind: "number", help: "cms.help.mapXY" },
    { name: "commentary", label: "venues.sections.commentary", kind: "richtext", bilingual: true },
    { name: "unilaterals", label: "venues.sections.unilaterals", kind: "richtext", bilingual: true },
    { name: "access", label: "venues.sections.access", kind: "richtext", bilingual: true },
    { name: "contacts", label: "venues.sections.contacts", kind: "richtext", bilingual: true },
    position, visibility,
  ],
  order: [{ column: "cluster_id", ascending: true }, { column: "position", ascending: true }, { column: "title_en", ascending: true }],
};

CONTENT_TYPES.venue_sport = {
  key: "venue_sport", table: "venue_sports", label: "cms.types.venue_sport", singular: "cms.single.venue_sport",
  titleColumn: "start_date", publicPath: "/venues", parent: { column: "venue_id", type: "venue" },
  fields: [
    { name: "venue_id", label: "cms.fields.venue", kind: "reference", ref: "venue", required: true },
    { name: "sport_id", label: "cms.fields.sport", kind: "reference", ref: "sport", required: true },
    { name: "start_date", label: "cms.fields.startDate", kind: "date" },
    { name: "end_date", label: "cms.fields.endDate", kind: "date" },
    { name: "notes", label: "cms.fields.notes", kind: "text", bilingual: true },
    position, visibility,
  ],
  order: [{ column: "venue_id", ascending: true }, { column: "start_date", ascending: true }],
};

CONTENT_TYPES.camera_plan = {
  key: "camera_plan", table: "camera_plans", label: "cms.types.camera_plan", singular: "cms.single.camera_plan",
  titleColumn: "title_en", publicPath: "/camera-maps", parent: { column: "venue_id", type: "venue" },
  fields: [
    { name: "venue_id", label: "cms.fields.venue", kind: "reference", ref: "venue", required: true },
    { name: "sport_id", label: "cms.fields.sport", kind: "reference", ref: "sport", required: true },
    { name: "title", label: "cms.fields.configuration", kind: "text", bilingual: true, required: true, help: "cms.help.configuration" },
    { name: "field_shape", label: "cms.fields.fieldShape", kind: "select", options: [{ value: "", label: "cms.fields.fieldShapeDefault" }, ...shapeOptions] },
    position, visibility,
  ],
  order: [{ column: "venue_id", ascending: true }, { column: "position", ascending: true }],
};

export const CONTENT_GROUPS: { label: string; types: ContentTypeKey[] }[] = [
  { label: "nav.handbook", types: ["handbook_chapter", "handbook_section"] },
  { label: "cms.groupMedia", types: ["briefing_video", "media_asset"] },
  { label: "cms.groupVenues", types: ["cluster", "venue", "sport", "venue_sport", "camera_plan"] },
  { label: "nav.news", types: ["announcement", "deadline"] },
  { label: "nav.faq", types: ["faq_category", "faq"] },
  { label: "nav.glossary", types: ["glossary_term"] },
  { label: "nav.contacts", types: ["contact_area", "contact"] },
  { label: "nav.legal", types: ["legal_page"] },
];

export function isContentType(v: string): v is ContentTypeKey {
  return v in CONTENT_TYPES;
}

/** Database columns that a type's fields write to. */
export function columnsOf(type: ContentType): string[] {
  return type.fields.flatMap((f) => (f.bilingual ? [`${f.name}_en`, `${f.name}_tr`] : [f.name]));
}

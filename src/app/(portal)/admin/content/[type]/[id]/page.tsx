import { notFound } from "next/navigation";
import { requireStaff, isAdmin } from "@/lib/auth";
import { signPaths } from "@/lib/media";
import { MediaVersionsPanel, type VersionRow } from "@/components/media/MediaVersionsPanel";
import { BriefingFilesPanel } from "@/components/media/BriefingFilesPanel";
import { CameraEditor } from "@/components/venues/CameraEditor";
import { DrawingPanel, type DrawingRow } from "@/components/venues/DrawingPanel";
import { VenueFilesPanel, type VenueFileRow } from "@/components/venues/VenueFilesPanel";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { GuideNotesPanel } from "@/components/cms/GuideNotesPanel";
import { CONTENT_TYPES, columnsOf, fieldLangs, isContentType, type ContentType } from "@/lib/content/registry";
import { ContentEditor } from "@/components/cms/ContentEditor";
import { PageHeader } from "@/components/ui";

const UUID = /^[0-9a-f-]{36}$/;

function toIstanbulLocal(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() + 3 * 3600000).toISOString().slice(0, 16);
}

function toFormValues(type: ContentType, row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of type.fields) {
    for (const col of fieldLangs(f)?.map((l) => `${f.name}_${l}`) ?? [f.name]) {
      const v = row[col];
      out[col] = v == null ? "" : f.kind === "datetime" ? toIstanbulLocal(String(v)) : String(v);
    }
  }
  return out;
}

function defaults(type: ContentType): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  for (const f of type.fields) {
    if (f.kind === "select") d[f.name] = f.options![0].value;
    if (f.kind === "number") d[f.name] = 0;
  }
  return d;
}

export default async function EditContent({ params, searchParams }: { params: Promise<{ type: string; id: string }>; searchParams: Promise<{ m?: string }> }) {
  const me = await requireStaff();
  const { type: key, id } = await params;
  const { m } = await searchParams;
  if (!isContentType(key)) notFound();
  const type = CONTENT_TYPES[key];
  const { t } = await getT();
  const supabase = await createClient();

  let row: Record<string, unknown> | null = null;
  if (id !== "new") {
    if (!UUID.test(id)) notFound();
    const { data } = await supabase.from(type.table).select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    row = data;
  }

  // Options for reference fields (e.g. the chapter of a section)
  const refOptions: Record<string, { value: string; label: string }[]> = {};
  for (const f of type.fields.filter((x) => x.kind === "reference")) {
    const rt = CONTENT_TYPES[f.ref!];
    let q = supabase.from(rt.table).select(`id, ${rt.titleColumn}`);
    for (const o of rt.order) q = q.order(o.column, { ascending: o.ascending });
    const { data } = await q;
    refOptions[f.name] = ((data ?? []) as unknown as Record<string, string>[]).map((r) => ({ value: r.id, label: r[rt.titleColumn] }));
  }

  const draft = (row?.draft ?? null) as Record<string, unknown> | null;
  const source = row ? { ...row, ...(draft ?? {}) } : defaults(type);
  const allowed = new Set(columnsOf(type));
  const initial = Object.fromEntries(Object.entries(toFormValues(type, source)).filter(([k]) => allowed.has(k)));

  let previewUrl: string | null = null;
  if (row) {
    const merged = source as Record<string, string>;
    switch (key) {
      case "handbook_section": {
        const { data: ch } = await supabase.from("handbook_chapters").select("slug").eq("id", merged.chapter_id).maybeSingle();
        previewUrl = ch ? `/handbook/${ch.slug}/${row.slug}?preview=1` : null;
        break;
      }
      case "handbook_chapter": previewUrl = `/handbook/${row.slug}?preview=1`; break;
      case "guide_section": {
        const { data: ch } = await supabase.from("guide_chapters").select("slug").eq("id", merged.chapter_id).maybeSingle();
        previewUrl = ch ? `/team/guidelines/${ch.slug}/${row.slug}?preview=1` : null;
        break;
      }
      case "guide_chapter": previewUrl = `/team/guidelines/${row.slug}?preview=1`; break;
      case "announcement": previewUrl = `/news/${row.id}?preview=1`; break;
      case "legal_page": previewUrl = `/legal/${row.slug}?preview=1`; break;
      case "deadline": previewUrl = null; break;
      case "media_asset": previewUrl = `/media-hub?preview=1&item=${row.id}`; break;
      case "briefing_video": previewUrl = `/briefings/${row.id}?preview=1`; break;
      case "venue": previewUrl = `/venues/${row.slug}?preview=1`; break;
      case "camera_plan": previewUrl = `/camera-maps/${row.id}?preview=1`; break;
      case "cluster": case "sport": case "venue_sport": previewUrl = `/venues?preview=1`; break;
      case "schedule_session": previewUrl = `/schedule?preview=1`; break;
      case "broadcast_feed": case "distribution_channel": case "tech_parameter": case "info_block": previewUrl = `/broadcast?preview=1`; break;
      default: previewUrl = `${type.publicPath}?preview=1`;
    }
  }

  let extra: React.ReactNode = null;
  if (row && key === "media_asset") {
    const { data: versions } = await supabase.from("media_versions").select("*").eq("asset_id", row.id).order("version_number", { ascending: false });
    const pv = row.preview_path as string | null;
    const signed = await signPaths(supabase, "media-previews", [pv]);
    extra = <MediaVersionsPanel assetId={String(row.id)} versions={(versions ?? []) as VersionRow[]} previewUrl={pv ? signed[pv] ?? null : null}
      previewKind={(row.preview_kind as string | null) ?? null} isAdmin={isAdmin(me)} />;
  }
  if (row && key === "guide_section") {
    const { data: note } = await supabase.from("guide_notes").select("notes").eq("section_id", row.id).maybeSingle();
    extra = <GuideNotesPanel sectionId={String(row.id)} notes={note?.notes ?? ""} />;
  }
  if (row && key === "briefing_video") {
    extra = <BriefingFilesPanel videoId={String(row.id)} files={{
      video: (row.video_path as string | null) ?? null, poster: (row.poster_path as string | null) ?? null,
      subtitles_en: (row.subtitles_en_path as string | null) ?? null, subtitles_tr: (row.subtitles_tr_path as string | null) ?? null,
    }} />;
  }

  if (row && key === "venue") {
    const { data: files } = await supabase.from("venue_files").select("*").eq("venue_id", row.id).order("kind").order("position");
    const signed = await signPaths(supabase, "venues", (files ?? []).filter((f) => f.kind === "photo").map((f) => f.file_path));
    extra = <VenueFilesPanel venueId={String(row.id)} files={(files ?? []).map((f) => ({ ...f, url: signed[f.file_path] ?? null })) as VenueFileRow[]} />;
  }
  if (row && key === "camera_plan") {
    const [{ data: cams }, { data: drawings }, { data: sport }, { data: others }, { data: venues }, { data: sports }] = await Promise.all([
      supabase.from("cameras").select("*").eq("plan_id", row.id).order("position"),
      supabase.from("camera_drawings").select("*").eq("plan_id", row.id).order("version_number", { ascending: false }),
      supabase.from("sports").select("field_shape").eq("id", row.sport_id as string).maybeSingle(),
      supabase.from("camera_plans").select("id,title_en,venue_id,sport_id").neq("id", row.id as string),
      supabase.from("venues").select("id,title_en"),
      supabase.from("sports").select("id,title_en"),
    ]);
    const vn = new Map((venues ?? []).map((v) => [v.id, v.title_en]));
    const sn = new Map((sports ?? []).map((v) => [v.id, v.title_en]));
    const shape = (row.field_shape as string) || sport?.field_shape || "generic";
    extra = (
      <>
        <CameraEditor
          key={String(row.id)}
          planId={String(row.id)}
          shape={shape}
          initial={(cams ?? []).map((c) => ({
            key: c.id, id: c.id, number: c.number, type: c.type, lens: c.lens ?? "", function_en: c.function_en ?? "", function_tr: c.function_tr ?? "",
            level: c.level, is_special: c.is_special, x: Number(c.x), y: Number(c.y), angle: c.angle == null ? "" : String(c.angle),
          }))}
          otherPlans={(others ?? []).map((p) => ({ id: p.id, label: `${vn.get(p.venue_id) ?? ""} · ${sn.get(p.sport_id) ?? ""} · ${p.title_en}` }))}
        />
        <DrawingPanel planId={String(row.id)} drawings={(drawings ?? []) as DrawingRow[]} cameras={(cams ?? []).map((c) => ({ number: c.number, type: c.type }))} isAdmin={isAdmin(me)} />
      </>
    );
  }

  const title = row ? String(row[type.titleColumn] ?? "") : `${t("cms.new")} ${t(type.singular)}`;
  return (
    <div className="stack">
      <PageHeader title={title} subtitle={t(type.label)} />
      {m === "saved" && <div className="alert alert-success">{t("cms.saved")}</div>}
      {m === "published" && <div className="alert alert-success">{t("cms.published")}</div>}
      <ContentEditor
        key={String(row?.updated_at ?? "new")}
        typeKey={key}
        id={row ? String(row.id) : null}
        initial={initial}
        status={row ? (row.status as "draft" | "published") : null}
        hasDraft={Boolean(draft)}
        refOptions={refOptions}
        previewUrl={previewUrl}
      />
      {extra}
      {!row && ["media_asset", "briefing_video", "venue", "camera_plan"].includes(key) && <p className="muted small">{t("mediaHub.admin.saveFirst")}</p>}
    </div>
  );
}

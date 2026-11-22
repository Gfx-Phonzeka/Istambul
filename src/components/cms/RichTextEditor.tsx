"use client";
import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Youtube from "@tiptap/extension-youtube";
import Underline from "@tiptap/extension-underline";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/client";

function Btn({ on, active, label, children, disabled }: { on: () => void; active?: boolean; label: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="button" className={`rte-btn${active ? " is-active" : ""}`} onClick={on} title={label} aria-label={label} aria-pressed={active} disabled={disabled}>
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const inTable = editor.isActive("table");

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `rich/${crypto.randomUUID()}.${ext}`;
      const { error } = await createClient().storage.from("content-media").upload(path, file, { contentType: file.type });
      if (error) throw error;
      editor.chain().focus().setImage({ src: `/media/${path}`, alt: file.name }).run();
    } catch {
      alert(t("cms.editor.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rte-toolbar">
      <Btn on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} label={t("cms.editor.bold")}><b>B</b></Btn>
      <Btn on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} label={t("cms.editor.italic")}><i>I</i></Btn>
      <Btn on={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} label={t("cms.editor.underline")}><u>U</u></Btn>
      <span className="rte-sep" />
      <Btn on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} label={t("cms.editor.h2")}>H2</Btn>
      <Btn on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} label={t("cms.editor.h3")}>H3</Btn>
      <Btn on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} label={t("cms.editor.bullet")}>• —</Btn>
      <Btn on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} label={t("cms.editor.ordered")}>1.</Btn>
      <Btn on={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} label={t("cms.editor.quote")}>❝</Btn>
      <span className="rte-sep" />
      <Btn
        label={t("cms.editor.link")}
        active={editor.isActive("link")}
        on={() => {
          const prev = editor.getAttributes("link").href ?? "";
          const url = window.prompt(t("cms.editor.linkPrompt"), prev);
          if (url === null) return;
          if (url.trim() === "") editor.chain().focus().extendMarkRange("link").unsetLink().run();
          else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
        }}
      >
        🔗
      </Btn>
      <Btn label={t("cms.editor.image")} on={() => fileRef.current?.click()} disabled={uploading}>{uploading ? "…" : "🖼"}</Btn>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
      <Btn
        label={t("cms.editor.video")}
        on={() => {
          const url = window.prompt(t("cms.editor.videoPrompt"));
          if (url) editor.commands.setYoutubeVideo({ src: url.trim() });
        }}
      >
        ▶
      </Btn>
      <Btn label={t("cms.editor.table")} on={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>▦</Btn>
      {inTable && (
        <>
          <Btn label={t("cms.editor.addRow")} on={() => editor.chain().focus().addRowAfter().run()}>{t("cms.editor.addRow")}</Btn>
          <Btn label={t("cms.editor.addCol")} on={() => editor.chain().focus().addColumnAfter().run()}>{t("cms.editor.addCol")}</Btn>
          <Btn label={t("cms.editor.delRow")} on={() => editor.chain().focus().deleteRow().run()}>{t("cms.editor.delRow")}</Btn>
          <Btn label={t("cms.editor.delCol")} on={() => editor.chain().focus().deleteColumn().run()}>{t("cms.editor.delCol")}</Btn>
          <Btn label={t("cms.editor.delTable")} on={() => editor.chain().focus().deleteTable().run()}>✕ ▦</Btn>
        </>
      )}
      <span className="rte-sep" />
      <Btn label={t("cms.editor.undo")} on={() => editor.chain().focus().undo().run()}>↶</Btn>
      <Btn label={t("cms.editor.redo")} on={() => editor.chain().focus().redo().run()}>↷</Btn>
    </div>
  );
}

export function RichTextEditor({ value, onChange, id }: { value: string; onChange: (html: string) => void; id?: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({ nocookie: true, width: 640, height: 360 }),
    ],
    content: value || "",
    editorProps: { attributes: { class: "prose rte-content", ...(id ? { id } : {}) } },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Keep the editor in sync if the value is reset from outside (e.g. discard changes).
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !(value === "" && editor.isEmpty)) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) return <div className="rte"><div className="rte-content prose muted">…</div></div>;
  return (
    <div className="rte">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

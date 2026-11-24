"use client";
import { useEffect, useRef, useState } from "react";
import * as tus from "tus-js-client";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/client";
import { fmtBytes } from "@/lib/bytes";

export interface UploadedFile { path: string; name: string; size: number; mime: string; duration?: number; width?: number; height?: number }

const CHUNK = 6 * 1024 * 1024; // Supabase resumable uploads use 6 MB chunks

function safeName(name: string) {
  return name.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._\-() ]/g, "_").slice(0, 150) || "file";
}

async function fingerprint(file: File) {
  const data = new TextEncoder().encode(`${file.name}|${file.size}|${file.lastModified}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].slice(0, 10).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Reads duration / resolution of audio and video files when the browser can decode them. */
function probe(file: File): Promise<{ duration?: number; width?: number; height?: number }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) return resolve({});
    const el = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
    const url = URL.createObjectURL(file);
    const done = (r: { duration?: number; width?: number; height?: number }) => { URL.revokeObjectURL(url); resolve(r); };
    el.preload = "metadata";
    el.onloadedmetadata = () => done({
      duration: Number.isFinite(el.duration) ? el.duration : undefined,
      width: (el as HTMLVideoElement).videoWidth || undefined,
      height: (el as HTMLVideoElement).videoHeight || undefined,
    });
    el.onerror = () => done({});
    setTimeout(() => done({}), 8000);
    el.src = url;
  });
}


/**
 * Resumable upload straight from the browser to Supabase Storage (TUS protocol).
 * If the connection drops or the page is reloaded, choosing the same file again resumes where it stopped.
 */
export function ResumableUpload({ bucket, prefix, accept, label, onUploaded, onBusy }: {
  bucket: string; prefix: string; accept?: string; label: string; onUploaded: (f: UploadedFile) => Promise<void> | void;
  /** Told when an upload starts or ends (forms can wait for the file before saving). */
  onBusy?: (busy: boolean) => void;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<tus.Upload | null>(null);
  const [state, setState] = useState<"idle" | "uploading" | "paused" | "done" | "error">("idle");
  useEffect(() => { onBusy?.(state === "uploading" || state === "paused"); }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const [progress, setProgress] = useState({ sent: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [resumed, setResumed] = useState(false);

  const start = async (file: File) => {
    setError(null);
    setResumed(false);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError(t("media.upload.sessionExpired")); return; }
    const fp = await fingerprint(file);
    // A random folder per upload, remembered until it completes: an interrupted upload of the same file
    // resumes into the same place, while uploading the same file again later creates a new object.
    const key = `upl-${bucket}-${prefix}-${fp}`;
    let nonce: string | null = null;
    try { nonce = localStorage.getItem(key); } catch {}
    if (!nonce) { nonce = crypto.randomUUID().slice(0, 8); try { localStorage.setItem(key, nonce); } catch {} }
    const objectName = `${prefix}/${fp}-${nonce}/${safeName(file.name)}`;
    const meta = await probe(file);
    const finish = async () => {
      try { localStorage.removeItem(key); } catch {}
      setState("done");
      await onUploaded({ path: objectName, name: file.name, size: file.size, mime: file.type || "application/octet-stream", ...meta });
    };

    const upload = new tus.Upload(file, {
      endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000, 30000, 60000],
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, "x-upsert": "false" },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: CHUNK,
      metadata: { bucketName: bucket, objectName, contentType: file.type || "application/octet-stream", cacheControl: "3600" },
      fingerprint: async () => `sb-${bucket}-${objectName}`,
      onBeforeRequest: async (req) => {
        // Long uploads can outlive the session token: always send a fresh one.
        const { data } = await supabase.auth.getSession();
        req.setHeader("authorization", `Bearer ${data.session?.access_token ?? session.access_token}`);
      },
      onProgress: (sent, total) => setProgress({ sent, total }),
      onShouldRetry: (err, _attempt, options) => {
        const status = (err as tus.DetailedError).originalResponse?.getStatus?.() ?? 0;
        if (status >= 400 && status < 500 && status !== 423 && status !== 429) return false; // client errors: don't retry
        return Boolean(options.retryDelays);
      },
      onError: async (err) => {
        const msg = String((err as { originalResponse?: { getBody(): string } }).originalResponse?.getBody?.() ?? err.message ?? err);
        if (/already exists|Duplicate|409/i.test(msg)) { await finish(); return; } // same file was already fully uploaded
        if (/maximum allowed size|Payload too large|413/i.test(msg)) setError(t("media.upload.tooLarge"));
        else setError(`${t("media.upload.failed")} (${msg.slice(0, 160)})`);
        setState("error");
      },
      onSuccess: () => { void finish(); },
    });
    uploadRef.current = upload;
    const previous = await upload.findPreviousUploads();
    if (previous.length) { upload.resumeFromPreviousUpload(previous[0]); setResumed(true); }
    setProgress({ sent: 0, total: file.size });
    setState("uploading");
    upload.start();
  };

  const pct = progress.total ? Math.floor((progress.sent / progress.total) * 100) : 0;
  return (
    <div className="upload">
      <input ref={inputRef} type="file" aria-label="File" tabIndex={-1} accept={accept} hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void start(f); e.target.value = ""; }} />
      {(state === "idle" || state === "done" || state === "error") && (
        <button type="button" className="btn btn-sm" onClick={() => inputRef.current?.click()}>{label}</button>
      )}
      {(state === "uploading" || state === "paused") && (
        <div className="stack-sm">
          <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><span style={{ transform: `scaleX(${pct / 100})` }} /></div>
          <div className="row small">
            <span>{pct}% · {fmtBytes(progress.sent)} / {fmtBytes(progress.total)}</span>
            {resumed && <span className="badge badge-info">{t("media.upload.resumed")}</span>}
            {state === "uploading" ? (
              <button type="button" className="btn btn-sm" onClick={() => { void uploadRef.current?.abort(); setState("paused"); }}>{t("media.upload.pause")}</button>
            ) : (
              <button type="button" className="btn btn-sm btn-primary" onClick={() => { uploadRef.current?.start(); setState("uploading"); }}>{t("media.upload.resume")}</button>
            )}
          </div>
        </div>
      )}
      {state === "done" && <span className="small" style={{ color: "var(--color-success)" }}> ✓ {t("media.upload.done")}</span>}
      {error && <div className="alert alert-danger small" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}

export { fmtBytes };

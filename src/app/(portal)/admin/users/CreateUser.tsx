"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { LOCALES } from "@/lib/i18n";
import { LANG_NAMES } from "@/lib/event";
import { createUser, type NewUserInput } from "@/lib/actions/admin";
import { Modal } from "@/components/ui/Modal";

const ROLES = ["right_holder", "partner", "production", "editor", "admin"];

/** Strong random password (10+ chars, upper, lower, digit) for test or hand-made accounts. */
function generate() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ", b = "abcdefghijkmnopqrstuvwxyz", d = "23456789";
  const pick = (s: string) => s[crypto.getRandomValues(new Uint32Array(1))[0] % s.length];
  const chars = [pick(a), pick(b), pick(d), ...Array.from({ length: 11 }, () => pick(a + b + d))];
  return chars.sort(() => crypto.getRandomValues(new Uint8Array(1))[0] - 128).join("");
}

export function CreateUser() {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const blank: NewUserInput = { email: "", password: generate(), first_name: "", last_name: "", organization: "", country: "", job_title: "", role: "right_holder", lang: LOCALES[0] };
  const [f, setF] = useState<NewUserInput>(blank);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof NewUserInput, v: string) => setF((x) => ({ ...x, [k]: v }));
  const field = (k: keyof NewUserInput, label: string, type = "text", required = true) => (
    <div className="field">
      <label htmlFor={`nu-${k}`}>{label}</label>
      <input id={`nu-${k}`} className="input" type={type} required={required} value={f[k]} onChange={(e) => set(k, e.target.value)} autoComplete="off" />
    </div>
  );
  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => { setF({ ...blank, password: generate() }); setError(null); setDone(null); setOpen(true); }}>+ {t("admin.createUser.button")}</button>
      {open && (
        <Modal title={t("admin.createUser.title")} onClose={() => setOpen(false)}>
          {done ? (
            <div className="stack-sm">
              <div className="alert alert-success">{t("admin.createUser.done")}</div>
              <p className="small" style={{ margin: 0 }}>{t("admin.createUser.copyHint")}</p>
              <code style={{ userSelect: "all", padding: 8, background: "var(--color-surface-muted)", borderRadius: 6 }}>{done}</code>
              <div className="row"><button type="button" className="btn" onClick={() => setOpen(false)}>{t("common.close")}</button></div>
            </div>
          ) : (
            <form className="stack-sm" onSubmit={(e) => { e.preventDefault(); setError(null); start(async () => {
              const r = await createUser(f);
              if (r.ok) { setDone(`${f.email} · ${f.password}`); router.refresh(); }
              else setError(t(`auth.errors.${r.error}`) === `auth.errors.${r.error}` ? `${t("common.error")} (${r.error})` : t(`auth.errors.${r.error}`));
            }); }}>
              <p className="small muted" style={{ margin: 0 }}>{t("admin.createUser.help")}</p>
              {error && <div className="alert alert-danger small">{error}</div>}
              <div className="grid grid-2">
                {field("first_name", t("auth.firstName"))}
                {field("last_name", t("auth.lastName"))}
              </div>
              {field("email", t("auth.email"), "email")}
              <div className="grid grid-2">
                {field("organization", t("auth.organization"))}
                {field("country", t("auth.country"), "text", false)}
              </div>
              <div className="grid grid-2">
                <div className="field">
                  <label htmlFor="nu-role">{t("admin.createUser.role")}</label>
                  <select id="nu-role" className="select" value={f.role} onChange={(e) => set("role", e.target.value)}>
                    {ROLES.map((r) => <option key={r} value={r}>{t(`admin.roles.${r}`)}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="nu-lang">{t("admin.createUser.language")}</label>
                  <select id="nu-lang" className="select" value={f.lang} onChange={(e) => set("lang", e.target.value)}>
                    {LOCALES.map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="nu-password">{t("auth.password")}</label>
                <div className="row">
                  <input id="nu-password" className="input" style={{ flex: 1 }} required value={f.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" />
                  <button type="button" className="btn btn-sm" onClick={() => set("password", generate())}>{t("admin.createUser.generate")}</button>
                </div>
              </div>
              <div className="row">
                <button type="submit" className="btn btn-primary" disabled={pending}>{t("admin.createUser.submit")}</button>
                <button type="button" className="btn" onClick={() => setOpen(false)}>{t("common.cancel")}</button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}

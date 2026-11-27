"use client";
/** Ticks or unticks every person checkbox of the bulk form. */
export function SelectAll({ label }: { label: string }) {
  return <input type="checkbox" aria-label={label} title={label} onChange={(e) => {
    const form = e.currentTarget.form;
    form?.querySelectorAll<HTMLInputElement>('input[name="ids"]').forEach((i) => { i.checked = e.currentTarget.checked; });
  }} />;
}

"""Builds guidelines.json from pt.md / en.md / tr.md (same structure, heading for heading).

Run:  python3 scripts/guidelines/build.py      → scripts/guidelines/guidelines.json
Then: node scripts/guidelines/load.mjs          (signed in as an admin, see load.mjs)
"""
import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
LANGS = ["pt", "en", "tr"]


def parse(lang):
    text = open(os.path.join(HERE, f"{lang}.md"), encoding="utf-8").read()
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    chapters = []
    for line in text.split("\n"):
        m = re.match(r"^## (\d+)\. (.+?)(?:\s+\{#([a-z0-9-]+)\})?\s*$", line)
        if m:
            chapters.append({"n": int(m.group(1)), "title": m.group(2), "slug": m.group(3), "intro": [], "sections": []})
            continue
        m = re.match(r"^### (.+?)(?:\s+\{#([a-z0-9-]+)\})?\s*$", line)
        if m and chapters:
            chapters[-1]["sections"].append({"title": m.group(1), "slug": m.group(2), "lines": []})
            continue
        if not chapters or line.startswith("# "):
            continue
        target = chapters[-1]["sections"][-1]["lines"] if chapters[-1]["sections"] else chapters[-1]["intro"]
        target.append(line)
    return chapters


def inline(s, chapter_slugs):
    s = html.escape(s, quote=False)
    s = re.sub(r"\[\[(\d+)\|([^\]]+)\]\]", lambda m: f'<a href="/team/guidelines/{chapter_slugs[int(m.group(1))]}">{m.group(2)}</a>', s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    return s


def plain(s):
    s = re.sub(r"\[\[(\d+)\|([^\]]+)\]\]", r"\2", s)
    return s.replace("**", "")


def to_html(lines, chapter_slugs):
    """Small Markdown subset: paragraphs, - lists, 1. lists, - [ ] checklists, | tables |, > NOTA notes."""
    out, notes, i = [], [], 0
    lines = lines + [""]
    while i < len(lines):
        line = lines[i].rstrip()
        if not line.strip():
            i += 1
            continue
        if line.startswith("> "):
            notes.append(re.sub(r"^>\s*(NOTA|NOTE):\s*", "", line))
            i += 1
            continue
        if line.startswith("|"):
            rows = []
            while lines[i].startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-{3,}:?", c) for c in cells):
                    rows.append(cells)
                i += 1
            body = [f"<tr>{''.join(f'<th>{inline(c, chapter_slugs)}</th>' for c in rows[0])}</tr>"]
            body += [f"<tr>{''.join(f'<td>{inline(c, chapter_slugs)}</td>' for c in r)}</tr>" for r in rows[1:]]
            out.append("<table><tbody>" + "".join(body) + "</tbody></table>")
            continue
        if re.match(r"^- ", line):
            items = []
            while re.match(r"^- ", lines[i]):
                t = lines[i][2:].strip()
                t = re.sub(r"^\[ \]\s*", "☐ ", t)
                items.append(f"<li>{inline(t, chapter_slugs)}</li>")
                i += 1
            out.append("<ul>" + "".join(items) + "</ul>")
            continue
        if re.match(r"^\d+\. ", line):
            items = []
            while re.match(r"^\d+\. ", lines[i]):
                items.append(f"<li>{inline(re.sub(r'^\d+\. ', '', lines[i]).strip(), chapter_slugs)}</li>")
                i += 1
            out.append("<ol>" + "".join(items) + "</ol>")
            continue
        para = []
        while lines[i].strip() and not re.match(r"^(\||- |\d+\. |> )", lines[i]):
            para.append(lines[i].strip())
            i += 1
        out.append(f"<p>{inline(' '.join(para), chapter_slugs)}</p>")
    return "\n".join(out), notes


def main():
    data = {lang: parse(lang) for lang in LANGS}
    en = data["en"]
    slugs = {c["n"]: c["slug"] for c in en}
    for lang in LANGS:
        assert [c["n"] for c in data[lang]] == [c["n"] for c in en], f"{lang}: chapter numbering differs"
        for a, b in zip(data[lang], en):
            assert len(a["sections"]) == len(b["sections"]), f"{lang} chapter {a['n']}: {len(a['sections'])} vs {len(b['sections'])} sections"
    chapters = []
    for ci, c in enumerate(en):
        ch = {"slug": c["slug"], "position": c["n"], "sections": []}
        for lang in LANGS:
            src = data[lang][ci]
            ch[f"title_{lang}"] = src["title"]
            ch[f"summary_{lang}"] = "\n\n".join(plain(p) for p in "\n".join(src["intro"]).strip().split("\n\n") if p.strip() and not p.startswith(">"))
        for si, s in enumerate(c["sections"]):
            sec = {"slug": s["slug"], "position": si + 1, "notes": []}
            for lang in LANGS:
                src = data[lang][ci]["sections"][si]
                body, notes = to_html(src["lines"], slugs)
                sec[f"title_{lang}"] = src["title"]
                sec[f"body_{lang}"] = body
                if lang == "pt":
                    sec["notes"] = notes
            ch["sections"].append(sec)
        chapters.append(ch)
    out = os.path.join(HERE, "guidelines.json")
    json.dump(chapters, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    n = sum(len(c["sections"]) for c in chapters)
    tbc = sum(len(re.findall(r"\[(A CONFIRMAR|TBC)", s["body_pt"])) for c in chapters for s in c["sections"])
    print(f"{len(chapters)} chapters, {n} sections, {sum(len(s['notes']) for c in chapters for s in c['sections'])} internal notes, {tbc} open points (PT)")


main()

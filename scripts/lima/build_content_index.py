"""Builds Lima's search view (content_index) from Istanbul's one.

Istanbul's view exposes title_en/title_tr/text_en/text_tr. Lima's exposes title_es/title_en/title_pt and
text_es/text_en/text_pt: each comes from the English expression with every "<col>_en" replaced by a
coalesce over the target language first (Spanish is the fallback).

Usage: python3 scripts/lima/build_content_index.py <istanbul view definition file> > out.sql
"""
import re, sys

src = open(sys.argv[1]).read().strip().rstrip(";")
branches = re.split(r"\nUNION ALL\n", src)

def split_top(s):
    out, depth, cur, q = [], 0, "", False
    for ch in s:
        if ch == "'" : q = not q
        if not q:
            if ch == "(": depth += 1
            elif ch == ")": depth -= 1
            elif ch == "," and depth == 0:
                out.append(cur); cur = ""; continue
        cur += ch
    out.append(cur)
    return [x.strip() for x in out]

COL = re.compile(r"\b([a-z]+\.[a-z_]+?)_en\b")

def lang_expr(expr, lang):
    order = {"es": ["es", "en", "pt"], "en": ["en", "es", "pt"], "pt": ["pt", "es", "en"]}[lang]
    return COL.sub(lambda m: "coalesce(" + ", ".join(f"{m.group(1)}_{l}" for l in order) + ")", expr)

out = []
for b in branches:
    m = re.match(r"\s*SELECT\s+(.*?)\n\s+FROM\s(.*)", b, re.S)
    sel, rest = m.group(1), m.group(2)
    items = split_top(sel)
    named = {}
    order = []
    for it in items:
        mm = re.match(r"(.*)\s+AS\s+(\w+)$", it, re.S)
        if mm: expr, name = mm.group(1).strip(), mm.group(2)
        else: expr, name = it, it.split(".")[-1]
        named[name] = expr; order.append(name)
    cols = []
    for name in order:
        if name in ("title_tr", "text_tr"): continue
        if name in ("title_en", "text_en"):
            base = name[:-3]
            for l in ("es", "en", "pt"):
                cols.append(f"{lang_expr(named[name], l)} AS {base}_{l}")
        else:
            cols.append(f"{named[name]} AS {name}" if named[name].split('.')[-1] != name else named[name])
    out.append(" SELECT " + ",\n    ".join(cols) + "\n   FROM " + rest)

print("drop view if exists public.content_index;")
print("create view public.content_index with (security_invoker = true) as\n" + "\nUNION ALL\n".join(out) + ";")
print("grant select on public.content_index to authenticated;")

"""slides.json + fops.py -> fopLayouts.ts (canvas primitives) + cams.json (camera x,y) + preview SVGs."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from fops import LAYOUTS

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_TS = os.path.join(HERE, "..", "..", "src", "components", "fields", "fopLayouts.ts")
SW, SH = 16.0, 9.0  # slide aspect units
W, H, PAD = 1000.0, 600.0, 34.0

SLIDES = {1: "athletics", 3: "fencing", 4: "3x3", 5: "rugby", 6: "table-tennis", 7: "judo", 8: "wrestling", 9: "archery",
          10: "coastal-rowing", 11: "volleyball", 12: "climbing", 13: "badminton", 14: "padel", 15: "triathlon", 16: "swimming",
          17: "artistic-swimming", 18: "gym-artistic", 19: "gym-rhythmic", 20: "gym-trampoline", 21: "gym-aerobic",
          22: "weightlifting", 23: "taekwondo", 24: "squash", 25: "boxing", 26: "muaythai", 27: "shooting", 28: "pentathlon", 29: "canoe"}

slides = {s["slide"]: s for s in json.load(open(os.path.join(HERE, "slides.json")))}
ts, cams, previews = {}, {}, []

for sno, key in SLIDES.items():
    s = slides[sno]
    pics = [p for p in s["pictures"] if p["box"][2] / 12192000 > 0.2]
    if sno == 1:  # full-slide stadium image: use the visible slide area
        l, t, r, b = 0.0, 0.0, 1.0, 1.0
    else:
        l = min(p["box"][0] for p in pics) / 12192000; t = min(p["box"][1] for p in pics) / 6858000
        r = max((p["box"][0] + p["box"][2]) for p in pics) / 12192000; b = max((p["box"][1] + p["box"][3]) for p in pics) / 6858000
    # picture in slide aspect units
    px0, py0, pw, ph = l * SW, t * SH, (r - l) * SW, (b - t) * SH
    from collections import Counter
    spot = Counter((round(m["cx"], 3), round(m["cy"], 3)) for m in s["markers"])
    stacked = [m["n"] for m in s["markers"] if spot[(round(m["cx"], 3), round(m["cy"], 3))] >= 3]
    stacked = sorted(set(stacked), key=int)
    seen, marks = set(stacked), []
    for m in s["markers"]:
        if m["n"] in seen:
            continue
        seen.add(m["n"]); marks.append((m["n"], m["cx"] * SW, m["cy"] * SH))
    xs = [px0, px0 + pw] + [x for _, x, _ in marks]; ys = [py0, py0 + ph] + [y for _, _, y in marks]
    fx0, fx1, fy0, fy1 = min(xs), max(xs), min(ys), max(ys)
    sc = min((W - 2 * PAD) / (fx1 - fx0), (H - 2 * PAD) / (fy1 - fy0))
    ox = (W - (fx1 - fx0) * sc) / 2 - fx0 * sc; oy = (H - (fy1 - fy0) * sc) / 2 - fy0 * sc
    PX, PY, PW, PH = px0 * sc + ox, py0 * sc + oy, pw * sc, ph * sc
    X = lambda u: round(PX + u * PW, 1)
    Y = lambda v: round(PY + v * PH, 1)
    cams[key] = {n: [round((x * sc + ox) / W, 4), round((y * sc + oy) / H, 4)] for n, x, y in marks}
    items = []
    if stacked and key != "athletics":
        # cameras the plan does not place (roving, RF, aerial...): lined up in a labelled strip at the top
        x0 = 0.03
        first = 0.965 - (len(stacked) - 1) * 0.042
        items.append(["t", round(first * W - 85, 1), 22.0, "NOT FIXED ON PLAN:", 10, "#5b6676", 700, 0])
        for i, n in enumerate(stacked):
            cams[key][n] = [round(first + i * 0.042, 4), 0.037]
    for it in LAYOUTS[key]:  # noqa
        t_ = it["t"]
        if t_ == "r":
            u0, v0, u1, v1 = it["a"]; w_, h_ = X(u1) - X(u0), Y(v1) - Y(v0)
            rx = it["rx"] if not it.get("rxh") else round(min(w_, h_) * it["rxh"], 1)
            items.append(["r", X(u0), Y(v0), round(w_, 1), round(h_, 1), it["f"], it["s"], it["w"], 1 if it["d"] else 0, rx])
        elif t_ == "l":
            u0, v0, u1, v1 = it["a"]
            items.append(["l", X(u0), Y(v0), X(u1), Y(v1), it["s"], it["w"], 1 if it["d"] else 0])
        elif t_ == "c":
            u, v, rr = it["a"]
            items.append(["c", X(u), Y(v), round(rr * PW, 1), it["f"], it["s"], it["w"], 1 if it["d"] else 0])
        elif t_ == "a":
            u, v, rr, a0, a1 = it["a"]
            items.append(["a", X(u), Y(v), round(rr * PW, 1), a0, a1, it["s"], it["w"], 1 if it["d"] else 0])
        elif t_ == "p":
            items.append(["p", " ".join(f"{X(u)},{Y(v)}" for u, v in it["a"]), it["f"], it["s"], it["w"]])
        elif t_ == "t":
            u, v = it["a"]
            items.append(["t", X(u), Y(v), it["x"], it["z"], it["c"], it["wt"], it["rot"]])
    ts[key] = items

with open(OUT_TS, "w") as f:
    f.write("// Generated from the Host Broadcaster camera plans (Planos.pptx): field-of-play drawings per sport,\n")
    f.write("// redrawn in the portal's style on the 1000 x 600 camera-map canvas. Edit scripts/field-of-play/fops.py and run gen.py, not this file.\n")
    f.write("// r: rect x y w h fill stroke width dashed rx | l: line x1 y1 x2 y2 stroke width dashed\n")
    f.write("// c: circle cx cy r fill stroke width dashed | a: arc cx cy r fromDeg toDeg stroke width dashed\n")
    f.write("// p: polygon points fill stroke width | t: text x y label size colour weight rotation\n")
    f.write("export type FopItem = (string | number)[];\n\n")
    f.write("export const FOP_LAYOUTS: Record<string, FopItem[]> = {\n")
    for k, v in ts.items():
        f.write(f"  {json.dumps(k)}: [\n")
        for it in v:
            f.write("    " + json.dumps(it, ensure_ascii=False) + ",\n")
        f.write("  ],\n")
    f.write("};\n")
cams.pop("athletics", None)  # pptx athletics markers are stacked, not placed: keep current positions
json.dump(cams, open(os.path.join(HERE, "cams.json"), "w"), indent=0)
print("layouts", len(ts), "cameras", sum(len(v) for v in cams.values()))

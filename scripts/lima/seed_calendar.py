# Lima 2027 · competition calendar by day (no times) → supabase/lima/1003_calendar.sql
# Sources: Pan American Games sports calendar v3 (26 Oct 2026, PDF image) and Parapan American Games calendar v1.3 (20 Aug 2026, xlsx).
# Usage: python3 scripts/lima/seed_calendar.py <pan calendar rendered at 150 dpi .png> <parapan .xlsx> > supabase/lima/1003_calendar.sql
#        (render the PDF with: pdftoppm -r 150 -png calendar.pdf pan)
import json, sys
from PIL import Image
import openpyxl

PAN_COLS = {"L": [254, 281, 307, 333, 359, 384, 411, 437, 462, 488, 515, 540, 567, 592, 619, 644, 671, 698, 723],
            "R": [959, 985, 1011, 1037, 1063, 1089, 1115, 1141, 1166, 1193, 1219, 1245, 1271, 1297, 1323, 1348, 1375, 1402, 1427]}
PAN_DAYS = [f"2027-07-{d}" for d in range(21, 32)] + [f"2027-08-0{d}" for d in range(1, 9)]
# rows of the Pan calendar, top to bottom: (column, sport slug, venue slug, label es/en/pt or None)
PAN = [
    ("L", None, "estadio-nacional", ("Ceremonia de apertura", "Opening ceremony", "Cerimônia de abertura")),
    ("L", "natacion-artistica", "centro-acuatico", None), ("L", "clavados", "centro-acuatico", None),
    ("L", "aguas-abiertas", "bujama-lacus", None), ("L", "natacion", "centro-acuatico", None), ("L", "polo-acuatico", "centro-acuatico", None),
    ("L", "tiro-arco", "estadio-rugby", None), ("L", "maraton", "circuito-ciudad", None),
    ("L", "marcha", "circuito-ciudad", ("Atletismo · Media maratón de marcha", "Athletics · Half marathon race walk", "Atletismo · Meia maratona de marcha")),
    ("L", "atletismo", "estadio-atletico", None), ("L", "badminton", "polideportivo-3", None), ("L", "beisbol", "estadio-beisbol", None),
    ("L", "pelota-vasca", "complejo-pelota-vasca", None), ("L", "bowling", "bowling-center", None), ("L", "boxeo", "coliseo-miguel-grau", None),
    ("L", "escalada", "muros-escalada", None), ("L", "ciclismo-mtb", "circuito-mtb-pachacamac", None), ("L", "bmx-racing", "pista-bmx-racing", None),
    ("L", "bmx-freestyle", "pista-bmx-freestyle", None), ("L", "ciclismo-ruta", "circuito-ciudad", None), ("L", "ciclismo-pista", "velodromo", None),
    ("L", "criquet", "campos-cricket", None),
    ("L", "ecuestre", "escuela-equitacion-ejercito", ("Ecuestre · Adiestramiento", "Equestrian · Dressage", "Hipismo · Adestramento")),
    ("L", "ecuestre", "escuela-equitacion-ejercito", ("Ecuestre · Concurso completo", "Equestrian · Eventing", "Hipismo · CCE")),
    ("L", "ecuestre", "escuela-equitacion-ejercito", ("Ecuestre · Salto", "Equestrian · Jumping", "Hipismo · Saltos")),
    ("L", "esgrima", "polideportivo-2", None), ("L", "futbol", "estadio-san-marcos", None), ("L", "golf", "lima-golf-club", None),
    ("L", "gimnasia-artistica", "polideportivo-villa-el-salvador", None), ("L", "gimnasia-ritmica", "polideportivo-villa-el-salvador", None),
    ("L", "trampolin", "polideportivo-villa-el-salvador", None),
    ("R", "balonmano", "polideportivo-1", None), ("R", "hockey", "estadio-hockey", None), ("R", "judo", "coliseo-eduardo-dibos", None),
    ("R", "karate", "coliseo-eduardo-dibos", None), ("R", "pentatlon", "estadio-atletico", None), ("R", "canotaje-slalom", "rio-lunahuana", None),
    ("R", "canotaje-velocidad", "albufera-medio-mundo", None), ("R", "raquetbol", "canchas-raquetbol", None), ("R", "remo", "albufera-medio-mundo", None),
    ("R", "remo-coastal", "playa-los-yuyos", None), ("R", "rugby", "estadio-rugby", None), ("R", "vela", "yacht-club-paracas", None),
    ("R", "tiro-deportivo", "poligono-tiro", None), ("R", "patinaje-artistico", "velodromo", None), ("R", "skateboarding", "skate-park", None),
    ("R", "patinaje-velocidad", "pista-patinaje-velocidad", None), ("R", "softbol", "estadio-softbol", None), ("R", "squash", "canchas-squash", None),
    ("R", "surf", "punta-rocas", None), ("R", "tenis-mesa", "polideportivo-3", None), ("R", "taekwondo", "coliseo-eduardo-dibos", None),
    ("R", "tenis", "centro-tenis", None), ("R", "triatlon", "playa-agua-dulce", None), ("R", "voleibol", "polideportivo-callao", None),
    ("R", "voley-playa", "canchas-voley-playa", None), ("R", "esqui-acuatico", "bujama-lacus", None),
    ("R", "levantamiento-pesas", "coliseo-mariscal-caceres", None),
    ("R", "lucha", "coliseo-miguel-grau", ("Lucha · Libre", "Wrestling · Freestyle", "Luta · Livre")),
    ("R", "lucha", "coliseo-miguel-grau", ("Lucha · Grecorromana", "Wrestling · Greco-Roman", "Luta · Greco-romana")),
    ("R", None, "estadio-nacional", ("Ceremonia de clausura", "Closing ceremony", "Cerimônia de encerramento")),
]
PARA = {  # spreadsheet acronym → (sport slug, venue slug)
    "ARC": ("para-tiro-arco", "estadio-rugby"), "FB5": ("futbol-ciegos", "estadio-rugby"), "BOC": ("boccia", "polideportivo-villa-el-salvador"),
    "WRU": ("rugby-silla", "polideportivo-villa-el-salvador"), "WTE": ("tenis-silla", "centro-tenis"), "CRD": ("para-ciclismo-ruta", "circuito-costa-verde"),
    "CTR": ("para-ciclismo-pista", "velodromo"), "PWL": ("para-powerlifting", "velodromo"), "ATH": ("para-atletismo", "estadio-atletico"),
    "SWM": ("para-natacion", "centro-acuatico"), "WBK": ("baloncesto-silla", "polideportivo-1"), "GBL": ("golbol", "polideportivo-2"),
    "BDM": ("para-badminton", "polideportivo-3"), "TTE": ("para-tenis-mesa", "polideportivo-3"), "JUD": ("para-judo", "coliseo-eduardo-dibos"),
    "TKW": ("para-taekwondo", "coliseo-eduardo-dibos"), "SVB": ("voleibol-sentado", "polideportivo-callao"), "SHO": ("tiro-para-deportivo", "poligono-tiro"),
}


def pan_code(p):
    r, g, b = p
    if r > 200 and g > 200 and b > 200: return None
    if r > 200 and g < 100: return "F"
    if g > 150 and r < 120: return "M"
    if r < 160 and b > 120 and g < 100: return "X"
    if b > 150 and g > 140 and r < 150: return "C"
    raise ValueError(p)


def pan_rows(png):
    im = Image.open(png).convert("RGB")
    out, idx = [], {"L": 0, "R": 0}
    for col, sport, venue, label in PAN:
        y = int(177 + idx[col] * 24.9); idx[col] += 1
        days = {}
        for d, x in zip(PAN_DAYS, PAN_COLS[col]):
            c = pan_code(im.getpixel((x, y)))
            if c: days[d] = c
        out.append(("pan", sport, venue, label, days))
    return out


def para_rows(xlsx):
    ws = openpyxl.load_workbook(xlsx)["Lima 2027 v1.3"]
    cols = {c.column: f"2027-08-{c.value:02d}" for c in ws[7] if isinstance(c.value, int)}
    out = []
    for row in ws.iter_rows(min_row=8, max_row=25):
        acr = row[3].value
        days = {}
        for c in row:
            if c.column not in cols or not (c.fill and c.fill.fill_type): continue
            rgb, v = c.fill.fgColor.rgb, (c.value or "").strip() if isinstance(c.value, str) else c.value
            if rgb == "FF0096C8": days[cols[c.column]] = "P" if v in (None, "") else "X"  # blue: competition; blank blue = medal ceremonies
            elif rgb == "FFC4018E": days[cols[c.column]] = "T"                              # classification / training
        out.append(("para", *PARA[acr], None, days))
    for c in ws[26]:
        if c.column in cols and c.value in ("O", "C"):
            label = ("Ceremonia de apertura", "Opening ceremony", "Cerimônia de abertura") if c.value == "O" else ("Ceremonia de clausura", "Closing ceremony", "Cerimônia de encerramento")
            out.insert(0 if c.value == "O" else len(out), ("para", None, "estadio-nacional", label, {cols[c.column]: "C"}))
    return out


def q(s): return "null" if s is None else "'" + s.replace("'", "''") + "'"


rows = pan_rows(sys.argv[1]) + para_rows(sys.argv[2])
print("-- Lima 2027 · competition calendar by day (no times). Generated by scripts/lima/seed_calendar.py from the official calendars:")
print("-- Pan American Games sports calendar v3 (26 Oct 2026) · Parapan American Games sports calendar v1.3 (20 Aug 2026).")
print("alter table public.calendar_rows add column if not exists label_es text, add column if not exists label_pt text;")
print("delete from public.calendar_rows;")
print("insert into public.calendar_rows (games, position, sport_id, venue_id, label_es, label_en, label_pt, days) values")
vals = []
for i, (games, sport, venue, label, days) in enumerate(rows):
    es, en, pt = label or (None, None, None)
    vals.append(f"  ({q(games)}, {i + 1}, (select id from public.sports where slug = {q(sport)}), (select id from public.venues where slug = {q(venue)}), "
                f"{q(es)}, {q(en)}, {q(pt)}, {q(json.dumps(days, separators=(',', ':')))}::jsonb)")
print(",\n".join(vals) + ";")
print("""
-- Venue pages: first and last competition day of each sport at each venue
update public.venue_sports vs set start_date = d.first_day, end_date = d.last_day
  from (select r.sport_id, r.venue_id, min(k)::date first_day, max(k)::date last_day
          from public.calendar_rows r, jsonb_each_text(r.days) e(k, v)
         where r.sport_id is not null and v <> 'T' group by 1, 2) d
 where vs.sport_id = d.sport_id and vs.venue_id = d.venue_id;""")

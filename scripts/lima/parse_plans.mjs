// Lima 2027 · converts the HTML camera plans (one per sport, made by the production team) into portal camera plans.
// Each plan keeps its own drawing ("svg:<w>x<h>:<markup>" in camera_plans.field_shape) and its cameras.
// Plans with REMI and OB-van phases become two plans: preliminaries (REMI cameras) and finals (all cameras).
//
// Usage: node scripts/lima/parse_plans.mjs <folder with the .html files> > plans.json
// The source files are internal production documents: keep them and the JSON out of the repository.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const dir = process.argv[2];
const W = 1000, H = 600;

// file name (without the upload prefix) → sports (slug) and venues (slug)
const MAP = {
  "Boxe": [["boxeo"], ["coliseo-miguel-grau"]],
  "Futbol": [["futbol"], ["estadio-miguel-grau", "estadio-alberto-gallardo"]],
  "Ciclismo_Bmxtrack": [["bmx-racing"], ["pista-bmx-racing"]],
  "Ciclismo_MTB": [["ciclismo-mtb"], ["santuario-amancay"]],
  "Ciclismo_Ruta": [["ciclismo-ruta"], ["circuito-ciudad"]],
  "Cricket": [["criquet"], ["campos-cricket"]],
  "Beisbol": [["beisbol"], ["estadio-beisbol"]],
  "Canotaje_Slalom": [["canotaje-slalom"], ["rio-lunahuana"]],
  "Escalada_deportiva": [["escalada"], ["muros-escalada"]],
  "BMX_Free": [["bmx-freestyle"], ["pista-bmx-freestyle"]],
  "Bowling": [["bowling"], ["bowling-center"]],
  "Ciclismo_Pista": [["ciclismo-pista"], ["velodromo"]],
  "Esgrima": [["esgrima"], ["polideportivo-2"]],
  "Canotaje_Remo": [["canotaje-velocidad", "remo"], ["laguna-yarinacocha"]],
  "Esqui_wakeboard": [["esqui-acuatico"], ["bujama-lacus"]],
  "Gimnasia__Ritmica": [["gimnasia-ritmica"], ["polideportivo-villa-el-salvador"]],
  "Atletismo_Marcha": [["marcha"], ["circuito-ciudad"]],
  "Acuaticos_natacion": [["natacion", "para-natacion"], ["centro-acuatico"]],
  "Acuaticos_artistica": [["natacion-artistica"], ["centro-acuatico"]],
  "Balonmano": [["balonmano"], ["polideportivo-1"]],
  "Atletismo_Maraton": [["maraton"], ["circuito-ciudad"]],
  "Acuaticos_Aguas_abiertas": [["aguas-abiertas"], ["playa-agua-dulce"]],
  "Badminton": [["badminton"], ["polideportivo-3"]],
  "Atletismo": [["atletismo", "para-atletismo"], ["estadio-atletico"]],
  "Acuaticos_clavados": [["clavados"], ["centro-acuatico"]],
};

const cssBlocks = (css) => [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2].trim() }));

function cssVars(css) {
  const vars = {};
  for (const b of cssBlocks(css)) {
    if (b.sel === ":root" || /light-(theme|mode)/.test(b.sel)) {
      for (const m of b.body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
    }
  }
  return { "--equip-yellow": "#facc15", ...vars };
}

function extractSvg(html) {
  const css = (html.match(/<style>([\s\S]*?)<\/style>/) ?? ["", ""])[1];
  const vars = cssVars(css);
  const classStyle = {};
  for (const b of cssBlocks(css)) {
    const m = /^\.([\w-]+)$/.exec(b.sel);
    if (m) classStyle[m[1]] = b.body;
  }
  const svgs = [...html.matchAll(/<svg viewBox="0 0 (\d+) (\d+)"[^>]*>([\s\S]*?)<\/svg>/g)].filter((m) => Number(m[1]) >= 700);
  const [, w, h, inner] = svgs[0];
  let s = inner
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<g id="(fov-group|cameras-group|camera-nodes-group)"><\/g>/g, "")
    .replace(/<rect[^>]*id="svg-(base-)?bg"[^>]*\/>/g, "")
    .replace(/\$(\d+)\\text\{m\}\$/g, "$1m")
    .replace(/\s(marker-end|id)="[^"]*"/g, "")
    .replace(/style="italic"/g, 'font-style="italic"')
    .replace(/class="([\w\s-]+)"/g, (_, cls) => `style="${cls.split(/\s+/).map((c) => classStyle[c] ?? "").join(" ").replace(/\s+/g, " ").trim()}"`);
  const resolve = (t) => t.replace(/var\((--[\w-]+)\)/g, (_, v) => vars[v] ?? "#94a3b8");
  s = resolve(resolve(s));
  return { w: Number(w), h: Number(h), markup: s.replace(/\n\s*/g, "\n").trim() };
}

function extractCameras(html) {
  const m = /const (cameras|CAMERA_DATABASE) = (\[[\s\S]*?\]);/.exec(html);
  return vm.runInNewContext(`(${m[2]})`);
}

function camType(t) {
  const s = t.toLowerCase();
  if (/drone|dron|skycam|omnicam|4sky|cablecam|aérea|aereo|aéreo|suspendid/.test(s)) return "aerial";
  if (/underwater|subacu|sumergible|polecam/.test(s)) return /polecam|brazo sumergible/.test(s) ? "polecam" : "underwater";
  if (/steadicam|gimbal|estabilizada de flujo/.test(s)) return "steadicam";
  if (/jib|grúa|grua/.test(s)) return "crane";
  if (/trackcam|riel|rail/.test(s)) return "rail";
  if (/beauty|atmosf/.test(s)) return "beauty";
  if (/minicam|periscop|brazo mágico/.test(s)) return "minicam";
  if (/ptz|robótica|robotica|robotizada|autónoma|autonoma|hothead/.test(s)) return "ptz";
  if (/moto|barco|catamar|embarcaci|5g/.test(s)) return "rf";
  if (/handheld|hombro|portátil|portatil|rf|móvil|movil|itinerante/.test(s)) return "handheld";
  return "hard";
}

const SPECIAL = /ssm|usm|super|slo ?mo|drone|dron|skycam|omnicam|jib|grúa|underwater|subacu|trackcam|riel|polecam|periscop|brazo|ptz|robótic|robotiz|overhead|minicam|hothead|cablecam|moto|barco|catamar|steadicam/i;

function angleFrom(c, fov) {
  if (!fov) return null;
  const pts = [...fov.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  if (pts.length < 3) return null;
  const rest = pts.slice(1);
  const mx = rest.reduce((a, p) => a + p[0], 0) / rest.length, my = rest.reduce((a, p) => a + p[1], 0) / rest.length;
  const dx = mx - pts[0][0], dy = my - pts[0][1];
  if (Math.hypot(dx, dy) < 5) return null;
  return Math.round(((Math.atan2(-dy, dx) * 180) / Math.PI + 360) % 360);
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".html"))
  .map((f) => ({ f, key: f.replace(/^[0-9a-f]{8}-/, "").replace(/\.html$/, ""), t: fs.statSync(path.join(dir, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t);
const seen = new Set();
const plans = [];
for (const { f, key } of files) {
  if (seen.has(key) || !MAP[key]) continue;
  seen.add(key);
  const html = fs.readFileSync(path.join(dir, f), "utf8");
  const svg = extractSvg(html);
  const s = Math.min(W / svg.w, H / svg.h), tx = (W - svg.w * s) / 2, ty = (H - svg.h * s) / 2;
  const raw = extractCameras(html);
  const cams = raw.map((c, i) => {
    const name = c.name ?? `C${c.id}`;
    const num = /^C(\d+)/.exec(name)?.[1] ?? String(c.id);
    const label = (c.name ? name.replace(/^C\d+\s*/, "") : c.config) ?? "";
    const where = c.loc ?? c.pos ?? "";
    const kind = [c.type, c.name, c.mount, c.config].filter(Boolean).join(" ");
    const x = c.cx ?? c.x, y = c.cy ?? c.y;
    return {
      position: i + 1, number: num, type: camType(kind),
      lens: [c.mount && !/trípode/i.test(c.mount) ? c.mount : null, c.lens].filter(Boolean).join(" · ").slice(0, 100) || null,
      function_es: [label, where].filter(Boolean).join(" — ").slice(0, 300),
      level: c.phase === "OB" && raw.some((r) => r.phase === "REMI") ? "2" : "1",
      is_special: SPECIAL.test(kind),
      x: Math.round(((tx + x * s) / W) * 1000) / 1000,
      y: Math.round(((ty + y * s) / H) * 1000) / 1000,
      angle: angleFrom(c, c.fov),
      phase: c.phase ?? null,
    };
  });
  const mixed = cams.some((c) => c.phase === "REMI") && cams.some((c) => c.phase === "OB");
  const shape = `svg:${svg.w}x${svg.h}:${svg.markup}`;
  const [sports, venues] = MAP[key];
  const variants = mixed
    ? [
        { title: ["Eliminatorias · REMI", "Preliminaries · REMI", "Eliminatórias · REMI"], cameras: cams.filter((c) => c.phase === "REMI") },
        { title: ["Finales · OB Van", "Finals · OB van", "Finais · OB Van"], cameras: cams },
      ]
    : [{ title: ["Todas las sesiones", "All sessions", "Todas as sessões"], cameras: cams }];
  for (const sport of sports) for (const venue of venues) variants.forEach((v, i) => {
    plans.push({ source: key, sport, venue, position: i + 1, title_es: v.title[0], title_en: v.title[1], title_pt: v.title[2], field_shape: shape,
      cameras: v.cameras.map(({ phase, ...c }, j) => ({ ...c, position: j + 1, level: mixed && i === 0 ? "1" : c.level })) });
  });
}
const missing = Object.keys(MAP).filter((k) => !seen.has(k));
if (missing.length) console.error("missing:", missing.join(", "));
console.log(JSON.stringify(plans, null, 1));

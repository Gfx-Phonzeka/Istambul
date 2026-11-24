// Lima 2027 · converts the HTML camera plans (one per sport, made by the production team) into portal camera plans.
// Each plan keeps its own drawing ("svg:<w>x<h>:<markup>" in camera_plans.field_shape) and its cameras.
// Plans with REMI and OB-van phases become two plans: preliminaries (REMI cameras) and finals (all cameras).
//
// Usage: node scripts/lima/parse_plans.mjs <folder with the .html files> > plans.json
// The source files are internal production documents: keep them and the JSON out of the repository.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

const dir = process.argv[2];
const W = 1000, H = 600;

// file name (without the upload prefix) → sports (slug) and venues (slug)
const MAP = {
  "Boxe": [["boxeo"], ["coliseo-miguel-grau"]],
  "Futbol": [["futbol"], ["estadio-san-marcos"]],
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
  "Canotaje_Remo": [["canotaje-velocidad", "remo"], ["albufera-medio-mundo"]],
  "Esqui_wakeboard": [["esqui-acuatico"], ["bujama-lacus"]],
  "Gimnasia__Ritmica": [["gimnasia-ritmica"], ["polideportivo-villa-el-salvador"]],
  "Atletismo_Marcha": [["marcha"], ["circuito-ciudad"]],
  "Acuaticos_natacion": [["natacion", "para-natacion"], ["centro-acuatico"]],
  "Acuaticos_artistica": [["natacion-artistica"], ["centro-acuatico"]],
  "Balonmano": [["balonmano"], ["polideportivo-1"]],
  "Atletismo_Maraton": [["maraton"], ["circuito-ciudad"]],
  "Acuaticos_Aguas_abiertas": [["aguas-abiertas"], ["bujama-lacus"]],
  "Badminton": [["badminton"], ["polideportivo-3"]],
  "Atletismo": [["atletismo", "para-atletismo"], ["estadio-atletico"]],
  "Acuaticos_clavados": [["clavados"], ["centro-acuatico"]],
  "Gimnasia_trampolin": [["trampolin"], ["polideportivo-villa-el-salvador"]],
  "Golf": [["golf"], ["lima-golf-club"]],
  "Hipica_Dressage": [["ecuestre"], ["escuela-equitacion-ejercito"], ["Adiestramiento", "Dressage", "Adestramento"], 1],
  "Hipica_Salto": [["ecuestre"], ["escuela-equitacion-ejercito"], ["Salto", "Jumping", "Saltos"], 3],
  "Hockey_Cesped": [["hockey"], ["estadio-hockey"]],
  "Judo": [["judo"], ["coliseo-eduardo-dibos"]],
  "Karate": [["karate"], ["coliseo-eduardo-dibos"]],
  "Lucha": [["lucha"], ["coliseo-miguel-grau"]],
  "Halterofilia": [["levantamiento-pesas"], ["coliseo-mariscal-caceres"]],
  "Patinaje_artistico": [["patinaje-artistico"], ["velodromo"]],
  "Pentatlon": [["pentatlon"], ["estadio-atletico"]],
  "Racquetball": [["raquetbol"], ["canchas-raquetbol"]],
  "Pelota_vasca": [["pelota-vasca"], ["complejo-pelota-vasca"]],
  "Rugby7": [["rugby"], ["estadio-rugby"]],
  "Skateboarding": [["skateboarding"], ["skate-park"]],
  "Skating_Velocidad": [["patinaje-velocidad"], ["pista-patinaje-velocidad"]],
  "Softbol": [["softbol"], ["estadio-softbol"]],
  "Remo_Coastal": [["remo-coastal"], ["playa-los-yuyos"]],
  "Squash": [["squash"], ["car-voley"]],
  "Surf": [["surf"], ["punta-rocas"]],
  "Taekwondo": [["taekwondo"], ["coliseo-eduardo-dibos"]],
  "Tenis": [["tenis"], ["centro-tenis"]],
  "Tenis_Mesa": [["tenis-mesa"], ["polideportivo-3"]],
  "Hipica_Cross_Coutry": [["ecuestre"], ["escuela-equitacion-ejercito"], ["Cross country (concurso completo)", "Cross-country (eventing)", "Cross-country (CCE)"], 2],
};

// One file holds the Para sports plans, drawn by script: fopType → [sport, venue]
const PARA = {
  parapowerlifting: ["para-powerlifting", "velodromo"],
  archery: ["para-tiro-arco", "estadio-rugby"],
  blind_football: ["futbol-ciegos", "estadio-rugby"],
  boccia: ["boccia", "polideportivo-villa-el-salvador"],
  wheelchair_rugby: ["rugby-silla", "polideportivo-villa-el-salvador"],
  wheelchair_tennis: ["tenis-silla", "centro-tenis"],
  track_cycling: ["para-ciclismo-pista", "velodromo"],
  wheelchair_basketball: ["baloncesto-silla", "polideportivo-1"],
  para_badminton: ["para-badminton", "polideportivo-3"],
  table_tennis: ["para-tenis-mesa", "polideportivo-3"],
  goalball: ["golbol", "polideportivo-2"],
  judo: ["para-judo", "coliseo-eduardo-dibos"],
  taekwondo: ["para-taekwondo", "coliseo-eduardo-dibos"],
  sitting_volleyball: ["voleibol-sentado", "polideportivo-callao"],
};

const cssBlocks = (css) => [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2].trim() }));

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
  return cleanSvg(inner, w, h, vars, classStyle);
}

function cleanSvg(inner, w, h, vars = {}, classStyle = {}) {
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
  const s = t.toLowerCase().replace(/no ptz/g, "");
  if (/ptz|robótica|robotica/.test(s) && !/drone|dron\b|riel|rail|trackcam/.test(s)) return "ptz";
  if (/drone|dron|skycam|omnicam|4sky|cablecam|aérea|aereo|aéreo|suspendid/.test(s)) return "aerial";
  if (/underwater|subacu|sumergible|polecam/.test(s)) return /polecam|brazo sumergible/.test(s) ? "polecam" : "underwater";
  if (/steadicam|gimbal|estabilizada de flujo/.test(s)) return "steadicam";
  if (/jib|grúa|grua/.test(s)) return "crane";
  if (/trackcam|riel|rail/.test(s)) return "rail";
  if (/beauty|atmosf/.test(s)) return "beauty";
  if (/ptz|robótica|robotica|robotizada|hothead/.test(s)) return "ptz";
  if (/minicam|minicámara|micro cámara|mini pared|periscop|brazo mágico|refcam|subjetiva de árbitro/.test(s)) return "minicam";
  if (/moto|barco|catamar|embarcaci/.test(s)) return "rf";
  if (/handheld|hombro|portátil|portatil|\brf\b|móvil|movil|itinerante|5g/.test(s)) return "handheld";
  return "hard";
}

const SPECIAL = /ssm|usm|super ?slo|súper|supersl|slo ?mo|drone|dron|skycam|omnicam|jib|grúa|underwater|subacu|trackcam|riel|polecam|periscop|brazo|ptz|robótic|robotiz|overhead|minicam|hothead|cablecam|moto|barco|catamar|steadicam/i;

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

async function renderPara(file) {
  const { chromium } = createRequire(import.meta.url)("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.route(/^https?:/, (r) => r.abort());
  await page.goto("file://" + path.resolve(file));
  const out = await page.evaluate(() => {
    isPPTWhiteTheme = true; // eslint-disable-line no-undef
    return SPORTS_DATABASE.map((sport, i) => { // eslint-disable-line no-undef
      selectSport(i); // eslint-disable-line no-undef
      const svg = document.getElementById("fop-svg");
      const [, , w, h] = svg.getAttribute("viewBox").split(/\s+/).map(Number);
      const inner = ["svg-defs", "fop-background-layer", "fop-markings-layer"].map((id) => document.getElementById(id).outerHTML).join("\n");
      return { fopType: sport.fopType, w, h, inner, cameras: sport.cameras };
    });
  });
  await browser.close();
  return out;
}

function toCamera(c, i, raw) {
  const name = c.name ?? `C${c.id}`;
  const num = /^C(?:ámara)?\s*(\d+)/i.exec(name)?.[1] ?? String(c.id).replace(/^C/, "");
  const label = (c.name ? name.replace(/^C\d+\s*/, "").replace(/^Cámara \d+\s*\((.*)\)$/, "$1") : c.config) ?? "";
  const mount = c.mount ?? c.montaje;
  const where = c.loc ?? c.pos ?? c.posicion ?? "";
  const kind = [c.type, label, mount, c.config].filter(Boolean).join(" ");
  const x = c.cx ?? c.x, y = c.cy ?? c.y;
  return {
    position: i + 1, number: num, type: camType(kind),
    lens: [mount && !/trípode/i.test(mount) ? mount : null, c.lens ?? c.optica].filter(Boolean).join(" · ").slice(0, 100) || null,
    function_es: [label, where].filter(Boolean).join(" — ").slice(0, 300),
    level: c.phase === "OB" && raw.some((r) => r.phase === "REMI") ? "2" : "1",
    is_special: SPECIAL.test(kind.replace(/no ptz/gi, "")),
    x, y, angle: angleFrom(c, c.fov ?? c.fovPath),
    phase: c.phase ?? null,
  };
}

function fit(cams, w, h) {
  const s = Math.min(W / w, H / h), tx = (W - w * s) / 2, ty = (H - h * s) / 2;
  return cams.map((c) => ({ ...c, x: Math.round(((tx + c.x * s) / W) * 1000) / 1000, y: Math.round(((ty + c.y * s) / H) * 1000) / 1000 }));
}

const ALL = ["Todas las sesiones", "All sessions", "Todas as sessões"];
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
  const raw = extractCameras(html);
  const cams = fit(raw.map((c, i) => toCamera(c, i, raw)), svg.w, svg.h);
  const mixed = cams.some((c) => c.phase === "REMI") && cams.some((c) => c.phase === "OB");
  const shape = `svg:${svg.w}x${svg.h}:${svg.markup}`;
  const [sports, venues, title, order] = MAP[key];
  const variants = mixed
    ? [
        { title: ["Eliminatorias · REMI", "Preliminaries · REMI", "Eliminatórias · REMI"], cameras: cams.filter((c) => c.phase === "REMI") },
        { title: ["Finales · OB Van", "Finals · OB van", "Finais · OB Van"], cameras: cams },
      ]
    : [{ title: title ?? ALL, cameras: cams }];
  for (const sport of sports) for (const venue of venues) variants.forEach((v, i) => {
    plans.push({ source: key, sport, venue, position: order ?? i + 1, title_es: v.title[0], title_en: v.title[1], title_pt: v.title[2], field_shape: shape,
      cameras: v.cameras.map(({ phase, ...c }, j) => ({ ...c, position: j + 1, level: mixed && i === 0 ? "1" : c.level })) });
  });
}
const paraFile = files.find((x) => x.key === "Parapan_Lima27");
if (paraFile) {
  for (const p of await renderPara(path.join(dir, paraFile.f))) {
    const [sport, venue] = PARA[p.fopType] ?? [];
    if (!sport) { console.error("unmapped para sport:", p.fopType); continue; }
    const svg = cleanSvg(p.inner.replace(/<g[^>]*>/g, "<g>").replace(/<defs[^>]*><\/defs>/g, ""), p.w, p.h);
    const cams = fit(p.cameras.map((c, i) => toCamera(c, i, p.cameras)), svg.w, svg.h);
    plans.push({ source: "Parapan_Lima27", sport, venue, position: 1, title_es: ALL[0], title_en: ALL[1], title_pt: ALL[2],
      field_shape: `svg:${svg.w}x${svg.h}:${svg.markup}`, cameras: cams.map(({ phase, ...c }) => c) });
  }
}
const missing = Object.keys(MAP).filter((k) => !seen.has(k));
if (missing.length) console.error("missing:", missing.join(", "));
console.log(JSON.stringify(plans, null, 1));

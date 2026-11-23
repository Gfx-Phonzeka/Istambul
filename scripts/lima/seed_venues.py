"""Lima 2027 · clusters, venues and sports (from the official venue lists SEDES PANAMERICANOS / PARAPANAMERICANOS,
04.05.2026). Writes SQL for Lima's database (idempotent: upserts by slug).

Usage: python3 scripts/lima/seed_venues.py > supabase/lima/1002_seed_venues_sports.sql
"""

def q(s):
    return "null" if s is None else "'" + str(s).replace("'", "''") + "'"

# cluster: slug, es, en, pt, map position of the cluster centre (schematic, 0-100)
CLUSTERS = [
    ("a", "Clúster A · Callao", "Cluster A · Callao", "Cluster A · Callao", (14, 38)),
    ("b", "Clúster B · Costa Verde y San Borja", "Cluster B · Costa Verde & San Borja", "Cluster B · Costa Verde e San Borja", (32, 52)),
    ("c", "Clúster C · VIDENA", "Cluster C · VIDENA", "Cluster C · VIDENA", (52, 44)),
    ("d", "Clúster D · Villa María del Triunfo", "Cluster D · Villa María del Triunfo", "Cluster D · Villa María del Triunfo", (60, 70)),
    ("e", "Clúster E · Villa El Salvador", "Cluster E · Villa El Salvador", "Cluster E · Villa El Salvador", (44, 80)),
    ("f", "Clúster F · Circuito Ciudad", "Cluster F · City circuit", "Cluster F · Circuito Cidade", (36, 30)),
    ("g", "Clúster G · Sedes fuera de Lima", "Cluster G · Venues outside Lima", "Cluster G · Sedes fora de Lima", (84, 84)),
    ("h", "Otras sedes", "Other venues", "Outras sedes", (24, 18)),
]

# Updated with the newest documents: Pan sports calendar v3 (26 Oct 2026) and Parapan calendar v1.3 (20 Aug 2026).
# venue: slug, cluster, title (official name, same in all languages), address/district
VENUES = [
    ("polideportivo-callao", "a", "Polideportivo Callao", "Villa Deportiva Regional del Callao"),
    ("canchas-raquetbol", "a", "Canchas de Ráquetbol", "Villa Deportiva Regional del Callao"),
    ("coliseo-miguel-grau", "a", "Coliseo Miguel Grau", "Villa Deportiva Regional del Callao"),
    ("pista-bmx-racing", "b", "Pista BMX Racing", "Complejo Panamericano Costa Verde · San Miguel"),
    ("pista-bmx-freestyle", "b", "Pista BMX Freestyle", "Complejo Panamericano Costa Verde · San Miguel"),
    ("skate-park", "b", "Skate Park", "Complejo Panamericano Costa Verde · San Miguel"),
    ("pista-patinaje-velocidad", "b", "Pista de Patinaje de Velocidad", "Complejo Panamericano Costa Verde · San Miguel"),
    ("canchas-voley-playa", "b", "Canchas de Vóley Playa", "Complejo Panamericano Costa Verde · San Miguel"),
    ("coliseo-eduardo-dibos", "b", "Coliseo Eduardo Dibós", "San Borja"),
    ("lima-golf-club", "b", "Lima Golf Club", "San Isidro"),
    ("centro-acuatico", "c", "Centro Acuático", "VIDENA · San Luis"),
    ("estadio-atletico", "c", "Estadio Atlético", "VIDENA · San Luis"),
    ("velodromo", "c", "Velódromo", "VIDENA · San Luis"),
    ("bowling-center", "c", "Bowling Center", "VIDENA · San Luis"),
    ("polideportivo-1", "c", "Polideportivo 1", "VIDENA · San Luis"),
    ("polideportivo-2", "c", "Polideportivo 2", "VIDENA · San Luis"),
    ("polideportivo-3", "c", "Polideportivo 3", "VIDENA · San Luis"),
    ("car-voley", "c", "CAR de Vóley", "VIDENA · San Luis"),
    ("escuela-equitacion-ejercito", "c", "Escuela de Equitación del Ejército", "La Molina"),
    ("playa-agua-dulce", "d", "Playa Agua Dulce", "Chorrillos"),
    ("coliseo-mariscal-caceres", "d", "Coliseo Mariscal Cáceres", "Chorrillos"),
    ("poligono-tiro", "d", "Polígono de Tiro · Base Aérea Las Palmas", "Santiago de Surco"),
    ("estadio-beisbol", "d", "Estadio de Béisbol", "Complejo Deportivo Villa María del Triunfo"),
    ("estadio-softbol", "d", "Estadio de Softbol", "Complejo Deportivo Villa María del Triunfo"),
    ("estadio-hockey", "d", "Estadio de Hockey", "Complejo Deportivo Villa María del Triunfo"),
    ("estadio-rugby", "d", "Estadio de Rugby", "Complejo Deportivo Villa María del Triunfo"),
    ("complejo-pelota-vasca", "d", "Complejo de Pelota Vasca", "Complejo Deportivo Villa María del Triunfo"),
    ("polideportivo-villa-el-salvador", "e", "Polideportivo Luisa Estela Fuentes Quijandría", "Complejo Deportivo Villa El Salvador"),
    ("muros-escalada", "e", "Muros de Escalada Villa El Salvador", "Complejo Deportivo Villa El Salvador"),
    ("centro-tenis", "e", "Centro Deportivo de Tenis", "Complejo Deportivo Villa El Salvador"),
    ("campos-cricket", "e", "Campos de Críquet Villa El Salvador", "Complejo Deportivo Villa El Salvador"),
    ("santuario-amancay", "e", "Santuario de Amancay", "Villa María del Triunfo"),
    ("circuito-ciudad", "f", "Circuito Ciudad", "Lima"),
    ("circuito-costa-verde", "b", "Circuito Costa Verde", "Costa Verde"),
    ("playa-los-yuyos", "d", "Playa Los Yuyos", "Barranco"),
    ("albufera-medio-mundo", "g", "Albufera de Medio Mundo", "Végueta · Huaura"),
    ("estadio-san-marcos", "h", "Estadio San Marcos", "Lima"),
    ("estadio-nacional", "h", "Estadio Nacional", "Lima"),
    ("punta-rocas", "g", "Centro de Alto Rendimiento Punta Rocas", "Punta Negra"),
    ("bujama-lacus", "g", "Laguna Bujama", "Mala"),
    ("rio-lunahuana", "g", "Río Lunahuaná", "Lunahuaná · Cañete"),
    ("yacht-club-paracas", "g", "Yacht Club Paracas", "Paracas · Ica"),
]

# sport (discipline level, as the camera plans): slug, es, en, pt, venues, para?
SPORTS = [
    ("atletismo", "Atletismo", "Athletics", "Atletismo", ["estadio-atletico"]),
    ("maraton", "Atletismo · Maratón", "Athletics · Marathon", "Atletismo · Maratona", ["circuito-ciudad"]),
    ("marcha", "Atletismo · Marcha atlética", "Athletics · Race walk", "Atletismo · Marcha atlética", ["circuito-ciudad"]),
    ("natacion", "Natación", "Swimming", "Natação", ["centro-acuatico"]),
    ("clavados", "Clavados", "Diving", "Saltos ornamentais", ["centro-acuatico"]),
    ("natacion-artistica", "Natación artística", "Artistic swimming", "Nado artístico", ["centro-acuatico"]),
    ("polo-acuatico", "Polo acuático", "Water polo", "Polo aquático", ["centro-acuatico"]),
    ("aguas-abiertas", "Aguas abiertas", "Open water swimming", "Maratona aquática", ["bujama-lacus"]),
    ("badminton", "Bádminton", "Badminton", "Badminton", ["polideportivo-3"]),
    ("balonmano", "Balonmano", "Handball", "Handebol", ["polideportivo-1"]),
    ("beisbol", "Béisbol", "Baseball", "Beisebol", ["estadio-beisbol"]),
    ("softbol", "Softbol", "Softball", "Softbol", ["estadio-softbol"]),
    ("bowling", "Bowling", "Bowling", "Boliche", ["bowling-center"]),
    ("boxeo", "Boxeo", "Boxing", "Boxe", ["coliseo-miguel-grau"]),
    ("canotaje-velocidad", "Canotaje de velocidad", "Canoe sprint", "Canoagem de velocidade", ["albufera-medio-mundo"]),
    ("canotaje-slalom", "Canotaje eslalon", "Canoe slalom", "Canoagem slalom", ["rio-lunahuana"]),
    ("ciclismo-pista", "Ciclismo de pista", "Track cycling", "Ciclismo de pista", ["velodromo"]),
    ("ciclismo-ruta", "Ciclismo de ruta", "Road cycling", "Ciclismo de estrada", ["circuito-ciudad"]),
    ("ciclismo-mtb", "Ciclismo de montaña", "Mountain bike", "Mountain bike", ["santuario-amancay"]),
    ("bmx-racing", "BMX racing", "BMX racing", "BMX racing", ["pista-bmx-racing"]),
    ("bmx-freestyle", "BMX freestyle", "BMX freestyle", "BMX freestyle", ["pista-bmx-freestyle"]),
    ("criquet", "Críquet", "Cricket", "Críquete", ["campos-cricket"]),
    ("ecuestre", "Ecuestre", "Equestrian", "Hipismo", ["escuela-equitacion-ejercito"]),
    ("escalada", "Escalada deportiva", "Sport climbing", "Escalada esportiva", ["muros-escalada"]),
    ("esgrima", "Esgrima", "Fencing", "Esgrima", ["polideportivo-2"]),
    ("esqui-acuatico", "Esquí acuático y wakeboard", "Water skiing & wakeboard", "Esqui aquático e wakeboard", ["bujama-lacus"]),
    ("futbol", "Fútbol", "Football", "Futebol", ["estadio-san-marcos"]),
    ("gimnasia-artistica", "Gimnasia artística", "Artistic gymnastics", "Ginástica artística", ["polideportivo-villa-el-salvador"]),
    ("gimnasia-ritmica", "Gimnasia rítmica", "Rhythmic gymnastics", "Ginástica rítmica", ["polideportivo-villa-el-salvador"]),
    ("trampolin", "Trampolín", "Trampoline", "Ginástica de trampolim", ["polideportivo-villa-el-salvador"]),
    ("golf", "Golf", "Golf", "Golfe", ["lima-golf-club"]),
    ("hockey", "Hockey", "Hockey", "Hóquei sobre grama", ["estadio-hockey"]),
    ("judo", "Judo", "Judo", "Judô", ["coliseo-eduardo-dibos"]),
    ("karate", "Karate", "Karate", "Caratê", ["coliseo-eduardo-dibos"]),
    ("levantamiento-pesas", "Levantamiento de pesas", "Weightlifting", "Levantamento de peso", ["coliseo-mariscal-caceres"]),
    ("lucha", "Lucha", "Wrestling", "Luta", ["coliseo-miguel-grau"]),
    ("patinaje-velocidad", "Patinaje de velocidad", "Speed skating", "Patinação de velocidade", ["pista-patinaje-velocidad"]),
    ("patinaje-artistico", "Patinaje artístico", "Artistic skating", "Patinação artística", ["velodromo"]),
    ("skateboarding", "Skateboarding", "Skateboarding", "Skate", ["skate-park"]),
    ("pelota-vasca", "Pelota vasca", "Basque pelota", "Pelota basca", ["complejo-pelota-vasca"]),
    ("pentatlon", "Pentatlón moderno", "Modern pentathlon", "Pentatlo moderno", ["estadio-atletico", "centro-acuatico"]),
    ("raquetbol", "Ráquetbol", "Racquetball", "Raquetebol", ["canchas-raquetbol"]),
    ("remo", "Remo", "Rowing", "Remo", ["albufera-medio-mundo"]),
    ("remo-coastal", "Remo coastal", "Coastal rowing", "Remo costeiro", ["playa-los-yuyos"]),
    ("rugby", "Rugby 7", "Rugby sevens", "Rúgbi de 7", ["estadio-rugby"]),
    ("squash", "Squash", "Squash", "Squash", ["car-voley"]),
    ("surf", "Surf", "Surfing", "Surfe", ["punta-rocas"]),
    ("taekwondo", "Taekwondo", "Taekwondo", "Taekwondo", ["coliseo-eduardo-dibos"]),
    ("tenis", "Tenis", "Tennis", "Tênis", ["centro-tenis"]),
    ("tenis-mesa", "Tenis de mesa", "Table tennis", "Tênis de mesa", ["polideportivo-3"]),
    ("tiro-arco", "Tiro con arco", "Archery", "Tiro com arco", ["estadio-rugby"]),
    ("tiro-deportivo", "Tiro deportivo", "Shooting", "Tiro esportivo", ["poligono-tiro"]),
    ("triatlon", "Triatlón", "Triathlon", "Triatlo", ["playa-agua-dulce"]),
    ("vela", "Vela", "Sailing", "Vela", ["yacht-club-paracas"]),
    ("voleibol", "Voleibol", "Volleyball", "Vôlei", ["polideportivo-callao"]),
    ("voley-playa", "Vóley playa", "Beach volleyball", "Vôlei de praia", ["canchas-voley-playa"]),
    # Parapanamericanos
    ("para-atletismo", "Para atletismo", "Para athletics", "Atletismo paralímpico", ["estadio-atletico"]),
    ("para-natacion", "Para natación", "Para swimming", "Natação paralímpica", ["centro-acuatico"]),
    ("para-badminton", "Para bádminton", "Para badminton", "Parabadminton", ["polideportivo-3"]),
    ("baloncesto-silla", "Baloncesto en silla de ruedas", "Wheelchair basketball", "Basquete em cadeira de rodas", ["polideportivo-1"]),
    ("boccia", "Boccia", "Boccia", "Bocha", ["polideportivo-villa-el-salvador"]),
    ("futbol-ciegos", "Fútbol para ciegos", "Blind football", "Futebol de cegos", ["estadio-rugby"]),
    ("golbol", "Golbol", "Goalball", "Goalball", ["polideportivo-2"]),
    ("para-judo", "Para judo", "Para judo", "Judô paralímpico", ["coliseo-eduardo-dibos"]),
    ("para-powerlifting", "Para powerlifting", "Para powerlifting", "Halterofilismo paralímpico", ["velodromo"]),
    ("rugby-silla", "Rugby en silla de ruedas", "Wheelchair rugby", "Rúgbi em cadeira de rodas", ["polideportivo-villa-el-salvador"]),
    ("para-taekwondo", "Para taekwondo", "Para taekwondo", "Parataekwondo", ["coliseo-eduardo-dibos"]),
    ("para-tenis-mesa", "Para tenis de mesa", "Para table tennis", "Tênis de mesa paralímpico", ["polideportivo-3"]),
    ("tenis-silla", "Tenis en silla de ruedas", "Wheelchair tennis", "Tênis em cadeira de rodas", ["centro-tenis"]),
    ("para-tiro-arco", "Para tiro con arco", "Para archery", "Tiro com arco paralímpico", ["estadio-rugby"]),
    ("tiro-para-deportivo", "Tiro para deportivo", "Shooting Para sport", "Tiro esportivo paralímpico", ["poligono-tiro"]),
    ("para-ciclismo-pista", "Para ciclismo de pista", "Para cycling track", "Paraciclismo de pista", ["velodromo"]),
    ("para-ciclismo-ruta", "Para ciclismo de ruta", "Para cycling road", "Paraciclismo de estrada", ["circuito-costa-verde"]),
    ("voleibol-sentado", "Voleibol sentado", "Sitting volleyball", "Vôlei sentado", ["polideportivo-callao"]),
]

out = ["-- Lima 2027 · clusters, venues and sports. Generated by scripts/lima/seed_venues.py. Lima database only."]
for i, (slug, es, en, pt, _) in enumerate(CLUSTERS):
    out.append(
        f"insert into public.clusters (slug, position, title_es, title_en, title_pt, visibility, status, published_at) values "
        f"({q(slug)}, {i + 1}, {q(es)}, {q(en)}, {q(pt)}, 'all', 'published', now()) "
        f"on conflict (slug) do update set position = excluded.position, title_es = excluded.title_es, title_en = excluded.title_en, title_pt = excluded.title_pt;")

per_cluster = {}
centre = {c[0]: c[4] for c in CLUSTERS}
for i, (slug, cl, title, addr) in enumerate(VENUES):
    k = per_cluster.get(cl, 0); per_cluster[cl] = k + 1
    cx, cy = centre[cl]
    x = max(3, min(97, cx + (k % 4) * 4 - 6)); y = max(3, min(97, cy + (k // 4) * 5 - 3))
    out.append(
        f"insert into public.venues (slug, cluster_id, position, title_es, title_en, title_pt, address, map_x, map_y, visibility, status, published_at) "
        f"select {q(slug)}, id, {i + 1}, {q(title)}, {q(title)}, {q(title)}, {q(addr)}, {x}, {y}, 'all', 'published', now() from public.clusters where slug = {q(cl)} "
        f"on conflict (slug) do update set cluster_id = excluded.cluster_id, position = excluded.position, title_es = excluded.title_es, title_en = excluded.title_en, title_pt = excluded.title_pt, address = excluded.address, map_x = excluded.map_x, map_y = excluded.map_y;")

for i, (slug, es, en, pt, venues) in enumerate(SPORTS):
    out.append(
        f"insert into public.sports (slug, position, title_es, title_en, title_pt, visibility, status, published_at) values "
        f"({q(slug)}, {i + 1}, {q(es)}, {q(en)}, {q(pt)}, 'all', 'published', now()) "
        f"on conflict (slug) do update set position = excluded.position, title_es = excluded.title_es, title_en = excluded.title_en, title_pt = excluded.title_pt;")
    for j, v in enumerate(venues):
        out.append(
            f"insert into public.venue_sports (venue_id, sport_id, position, visibility, status, published_at) "
            f"select v.id, s.id, {j + 1}, 'all', 'published', now() from public.venues v, public.sports s "
            f"where v.slug = {q(v)} and s.slug = {q(slug)} and not exists (select 1 from public.venue_sports x where x.venue_id = v.id and x.sport_id = s.id);")

# Links and venues replaced by the newer calendars
out.append("delete from public.venue_sports vs using public.sports s, public.venues v where vs.sport_id = s.id and vs.venue_id = v.id and not (" +
           " or ".join(f"(s.slug = {q(sl)} and v.slug = {q(vv)})" for sl, *_, vs in SPORTS for vv in vs) + ");")
out.append("delete from public.camera_plans cp using public.sports s, public.venues v where cp.sport_id = s.id and cp.venue_id = v.id and not (" +
           " or ".join(f"(s.slug = {q(sl)} and v.slug = {q(vv)})" for sl, *_, vs in SPORTS for vv in vs) + ");")
out.append("delete from public.venues where slug = 'laguna-yarinacocha';")
print("\n".join(out))

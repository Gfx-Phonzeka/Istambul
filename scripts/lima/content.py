# Lima 2027 · portal content adapted from the Istanbul portal and the WBM I presentation (21 Nov 2026):
# legal pages, FAQ, contacts, deadlines, technical parameters, additional production.
# Usage: python3 scripts/lima/content.py > supabase/lima/1007_content.sql
# Texts that are not confirmed are marked [EJEMPLO]/[EXAMPLE]/[EXEMPLO] or [POR CONFIRMAR]/[TBC]/[A CONFIRMAR].

def q(s):
    return "null" if s is None else "'" + s.replace("'", "''") + "'"

LEGAL = [
    ("terms", 1, ("[EJEMPLO] Términos de uso", "[EXAMPLE] Terms of use", "[EXEMPLO] Termos de uso"), (
        "<p>Estos términos de ejemplo regulan el acceso al Portal del Host Broadcaster de Lima 2027 (el «Portal»), operado por Imagina como Host Broadcaster de los Juegos Panamericanos y Parapanamericanos Lima 2027.</p><p>El acceso es personal y está limitado a usuarios aprobados. No comparta sus credenciales ni redistribuya información del Portal fuera de su organización sin autorización.</p><p>La información del Portal se ofrece para ayudar a los Right Holders y socios a preparar su cobertura. La responsabilidad del Host Broadcaster termina al poner la señal a disposición, por satélite y SRT.</p><p>Imagina puede suspender el acceso en caso de uso indebido del Portal o de sus materiales.</p>",
        "<p>These example terms govern access to the Lima 2027 Host Broadcaster Portal (the “Portal”), operated by Imagina as Host Broadcaster of the Lima 2027 Pan American and Parapan American Games.</p><p>Access is personal and limited to approved users. You must not share your credentials or redistribute information from the Portal outside your organisation without authorisation.</p><p>Information in the Portal is provided to help Right Holders and partners prepare their coverage. The Host Broadcaster’s responsibility ends with making the signal available, by satellite and SRT.</p><p>Imagina may suspend access in case of misuse of the Portal or of its materials.</p>",
        "<p>Estes termos de exemplo regem o acesso ao Portal do Host Broadcaster de Lima 2027 (o «Portal»), operado pela Imagina como Host Broadcaster dos Jogos Pan-Americanos e Parapan-Americanos Lima 2027.</p><p>O acesso é pessoal e limitado a usuários aprovados. Não compartilhe suas credenciais nem redistribua informações do Portal fora da sua organização sem autorização.</p><p>As informações do Portal são oferecidas para ajudar os Right Holders e parceiros a preparar sua cobertura. A responsabilidade do Host Broadcaster termina ao disponibilizar o sinal, por satélite e SRT.</p><p>A Imagina pode suspender o acesso em caso de uso indevido do Portal ou de seus materiais.</p>")),
    ("privacy", 2, ("[EJEMPLO] Política de privacidad", "[EXAMPLE] Privacy policy", "[EXEMPLO] Política de privacidade"), (
        "<p>Aviso de privacidad de ejemplo. Tratamos los datos personales que usted facilita al registrarse (nombre, correo profesional, organización, país, cargo, teléfono) para gestionar su acceso al Portal.</p><p>También registramos los inicios de sesión y las descargas por seguridad y para medir el uso del Portal.</p><p>Puede actualizar sus datos desde su perfil, pedir una copia de sus datos o pedir que se elimine su cuenta en cualquier momento. Las solicitudes las atienden los administradores del Portal.</p><p>Ubicación de los datos y legislación aplicable: [POR CONFIRMAR].</p>",
        "<p>Example privacy notice. We process the personal data you provide at registration (name, professional email, organisation, country, job title, phone) to manage your access to the Portal.</p><p>We also record sign-ins and downloads for security and to measure the use of the Portal.</p><p>You can update your details from your profile, ask for a copy of your data, or ask for your account to be deleted at any time. Requests are handled by the Portal administrators.</p><p>Data location and applicable law: [TBC].</p>",
        "<p>Aviso de privacidade de exemplo. Tratamos os dados pessoais que você informa no cadastro (nome, e-mail profissional, organização, país, cargo, telefone) para gerenciar seu acesso ao Portal.</p><p>Também registramos os acessos e os downloads por segurança e para medir o uso do Portal.</p><p>Você pode atualizar seus dados no seu perfil, pedir uma cópia dos seus dados ou pedir a exclusão da sua conta a qualquer momento. Os pedidos são atendidos pelos administradores do Portal.</p><p>Localização dos dados e legislação aplicável: [A CONFIRMAR].</p>")),
    ("material", 3, ("[EJEMPLO] Condiciones de uso del material", "[EXAMPLE] Material usage terms", "[EXEMPLO] Condições de uso do material"), (
        "<p>Condiciones de ejemplo. Los gráficos, bumpers, cortinillas, promos y música del Media Hub solo pueden ser usados por los Right Holders en su cobertura de los Juegos, dentro de su territorio licenciado.</p><p>Los materiales no deben modificarse de forma que tergiverse los Juegos o a sus socios.</p><p>Se le pedirá aceptar estas condiciones antes de su primera descarga. Su aceptación queda registrada. Los documentos informativos (PDF) se descargan sin esta aceptación.</p>",
        "<p>Example terms. Graphics, bumpers, curtains, promos and music in the Media Hub may only be used by Right Holders in their coverage of the Games, within their licensed territory.</p><p>Materials must not be altered in a way that misrepresents the Games or their partners.</p><p>You will be asked to accept these terms before your first download. Your acceptance is recorded. Information documents (PDF) can be downloaded without it.</p>",
        "<p>Condições de exemplo. Os gráficos, bumpers, cortinas, promos e músicas do Media Hub só podem ser usados pelos Right Holders na sua cobertura dos Jogos, dentro do seu território licenciado.</p><p>Os materiais não devem ser alterados de forma a deturpar os Jogos ou seus parceiros.</p><p>Você deverá aceitar estas condições antes do primeiro download. Sua aceitação fica registrada. Os documentos informativos (PDF) são baixados sem essa aceitação.</p>")),
]

FAQ_CATS = [
    (1, ("Acceso al portal", "Portal access", "Acesso ao portal")),
    (2, ("Señal y servicios", "Signal and services", "Sinal e serviços")),
]
FAQS = [  # (category position, position, question es/en/pt, answer es/en/pt)
    (1, 1, ("¿Quién puede acceder a este portal?", "Who can access this portal?", "Quem pode acessar este portal?"),
     ("<p>Los Right Holders y socios aprobados, y el equipo de producción del Host Broadcaster. Cada solicitud la revisa el equipo del Host Broadcaster.</p>",
      "<p>Approved Right Holders and partners, and the Host Broadcaster production team. Each request is reviewed by the Host Broadcaster team.</p>",
      "<p>Os Right Holders e parceiros aprovados, e a equipe de produção do Host Broadcaster. Cada pedido é analisado pela equipe do Host Broadcaster.</p>")),
    (1, 2, ("¿Cómo agrego a un colega?", "How do I add a colleague?", "Como adiciono um colega?"),
     ("<p>Pida a su colega que solicite acceso con su correo profesional. Cada cuenta se aprueba de forma individual.</p>",
      "<p>Ask your colleague to request access with their professional email. Each account is approved individually.</p>",
      "<p>Peça ao seu colega para solicitar acesso com o e-mail profissional. Cada conta é aprovada individualmente.</p>")),
    (2, 3, ("¿Cómo se distribuye la señal?", "How is the signal distributed?", "Como o sinal é distribuído?"),
     ("<p>Por satélite (6 canales, incluido el Canal Integrado 24/7) y por SRT (13 señales dedicadas). Los parámetros de recepción están en <a href=\"/broadcast?tab=distribution\">Señal y distribución</a>. La responsabilidad del Host Broadcaster termina al poner la señal a disposición.</p>",
      "<p>By satellite (6 channels, including the 24/7 Integrated Channel) and by SRT (13 dedicated signals). The reception parameters are under <a href=\"/broadcast?tab=distribution\">Broadcast &amp; Distribution</a>. The Host Broadcaster’s responsibility ends with making the signal available.</p>",
      "<p>Por satélite (6 canais, incluindo o Canal Integrado 24/7) e por SRT (13 sinais dedicados). Os parâmetros de recepção estão em <a href=\"/broadcast?tab=distribution\">Sinal e distribuição</a>. A responsabilidade do Host Broadcaster termina ao disponibilizar o sinal.</p>")),
    (2, 4, ("¿Cómo reservo servicios unilaterales?", "How do I book unilateral services?", "Como reservo serviços unilaterais?"),
     ("<p>En <a href=\"/requests\">Booking</a>, que le lleva al sitio de booking. Antes de los Juegos, en los WBM I y II; durante los Juegos, en la Oficina de Booking del IBC y con el BVM de cada sede.</p>",
      "<p>Through <a href=\"/requests\">Booking</a>, which takes you to the booking site. Before the Games, at WBM I and II; during the Games, at the Booking Office in the IBC and with the BVM at each venue.</p>",
      "<p>Em <a href=\"/requests\">Booking</a>, que leva ao site de booking. Antes dos Jogos, nos WBM I e II; durante os Jogos, no Booking Office do IBC e com o BVM de cada local.</p>")),
    (2, 5, ("¿Qué hay en el Media Hub?", "What is in the Media Hub?", "O que há no Media Hub?"),
     ("<p>El paquete gráfico, bumpers, cortinillas, promos y música para su cobertura, y documentos (manuales técnicos, escaletas, calendario). Algunos documentos son solo para Right Holders.</p>",
      "<p>The graphics package, bumpers, curtains, promos and music for your coverage, and documents (technical manuals, running orders, schedule). Some documents are for Right Holders only.</p>",
      "<p>O pacote gráfico, bumpers, cortinas, promos e músicas para sua cobertura, e documentos (manuais técnicos, roteiros, calendário). Alguns documentos são só para Right Holders.</p>")),
    (2, 6, ("¿Qué es el Canal Integrado?", "What is the Integrated Channel?", "O que é o Canal Integrado?"),
     ("<p>Un canal 24/7 listo para emitir, sin producción propia: emisión continua todos los días de competencia y un resumen diario cada noche. La grilla diaria está en <a href=\"/channel\">Canal Integrado</a>.</p>",
      "<p>A 24/7 ready-to-air channel, with no production of your own: continuous broadcast every competition day and a daily summary every night. The daily grid is under <a href=\"/channel\">Integrated Channel</a>.</p>",
      "<p>Um canal 24/7 pronto para exibir, sem produção própria: transmissão contínua todos os dias de competição e um resumo diário todas as noites. A grade diária está em <a href=\"/channel\">Canal Integrado</a>.</p>")),
    (2, 7, ("¿Habrá pruebas técnicas antes de los Juegos?", "Will there be technical tests before the Games?", "Haverá testes técnicos antes dos Jogos?"),
     ("<p>Sí, dos pruebas de satélite y SRT: a T–15 y a T–7 días. Las fechas, horarios y parámetros exactos se comunicarán con antelación a todos los Right Holders.</p>",
      "<p>Yes, two satellite and SRT tests: at T–15 and T–7 days. Exact dates, times and parameters will be sent to all Right Holders in advance.</p>",
      "<p>Sim, dois testes de satélite e SRT: a T–15 e a T–7 dias. Datas, horários e parâmetros exatos serão comunicados com antecedência a todos os Right Holders.</p>")),
]

AREAS = [
    (1, ("Dirección del Host Broadcaster", "Host Broadcast Management", "Direção do Host Broadcaster")),
    (2, ("Operaciones e Ingeniería", "Operations and Engineering", "Operações e Engenharia")),
    (3, ("Servicios RHB y Booking", "RHB Services and Booking", "Serviços RHB e Booking")),
]
CONTACTS = [  # (area position, position, name, role es/en/pt) — no e-mails or phones until confirmed
    (1, 1, "Javier Mendoza", ("Director de Producción · contacto [POR CONFIRMAR]", "Director of Production · contact [TBC]", "Diretor de Produção · contato [A CONFIRMAR]")),
    (1, 2, "Gonzalo Pampín", ("Productor Ejecutivo · contacto [POR CONFIRMAR]", "Executive Producer · contact [TBC]", "Produtor Executivo · contato [A CONFIRMAR]")),
    (2, 3, "Claudio Vázquez", ("Director Técnico · contacto [POR CONFIRMAR]", "Technical Director · contact [TBC]", "Diretor Técnico · contato [A CONFIRMAR]")),
    (2, 4, "BOC (Broadcast Operations Centre)", ("Operaciones de broadcast · contacto [POR CONFIRMAR]", "Broadcast operations · contact [TBC]", "Operações de broadcast · contato [A CONFIRMAR]")),
    (3, 5, "Oficina de Booking (IBC)", ("Reservas de servicios unilaterales · contacto [POR CONFIRMAR]", "Unilateral service bookings · contact [TBC]", "Reservas de serviços unilaterais · contato [A CONFIRMAR]")),
    (3, 6, "BVM (Broadcast Venue Managers)", ("Su interlocutor en cada sede · contactos [POR CONFIRMAR]", "Your contact at each venue · contacts [TBC]", "Seu contato em cada local · contatos [A CONFIRMAR]")),
]

DEADLINES = [  # dates estimated from the WBM (T–15 / T–7 before Day 1, 23 July 2027): to be confirmed
    ("2027-07-08T12:00:00-05:00", ("[POR CONFIRMAR] Primera prueba técnica de satélite y SRT (T–15)", "[TBC] First satellite and SRT technical test (T–15)", "[A CONFIRMAR] Primeiro teste técnico de satélite e SRT (T–15)"), "/broadcast?tab=distribution"),
    ("2027-07-16T12:00:00-05:00", ("[POR CONFIRMAR] Segunda prueba técnica de satélite y SRT (T–7)", "[TBC] Second satellite and SRT technical test (T–7)", "[A CONFIRMAR] Segundo teste técnico de satélite e SRT (T–7)"), "/broadcast?tab=distribution"),
]

TECH = [  # (grp, position, title es/en/pt, value es/en/pt)
    ("video", 1, ("Formato de vídeo", "Video format", "Formato de vídeo"), ("HD 1080i 59.94 · SDR · 16:9, formato único", "HD 1080i 59.94 · SDR · 16:9, single format", "HD 1080i 59.94 · SDR · 16:9, formato único")),
    ("video", 2, ("Satélite", "Satellite", "Satélite"), ("6 canales · H.265 (HEVC) · DVB-S2 8PSK FEC 5/6 · SR 28.500 · satélite y banda [POR CONFIRMAR]", "6 channels · H.265 (HEVC) · DVB-S2 8PSK FEC 5/6 · SR 28,500 · satellite and band [TBC]", "6 canais · H.265 (HEVC) · DVB-S2 8PSK FEC 5/6 · SR 28.500 · satélite e banda [A CONFIRMAR]")),
    ("video", 3, ("SRT", "SRT", "SRT"), ("13 señales dedicadas · H.264 a 20 Mbps · caller / listener · AES-128/256 · un Stream ID por señal", "13 dedicated signals · H.264 at 20 Mbps · caller / listener · AES-128/256 · one Stream ID per signal", "13 sinais dedicados · H.264 a 20 Mbps · caller / listener · AES-128/256 · um Stream ID por sinal")),
    ("audio", 4, ("Audio satélite", "Satellite audio", "Áudio satélite"), ("48 kHz · MPEG-1 Layer 2", "48 kHz · MPEG-1 Layer 2", "48 kHz · MPEG-1 Layer 2")),
    ("audio", 5, ("Sonido internacional", "International sound", "Som internacional"), ("Estéreo, sin comentarios · mapeo de canales [POR CONFIRMAR]", "Stereo, without commentary · channel mapping [TBC]", "Estéreo, sem comentários · mapeamento de canais [A CONFIRMAR]")),
    ("graphics", 6, ("Grafismo", "On-air graphics", "Grafismo"), ("En español, con datos del proveedor oficial de resultados", "In Spanish, driven by the official results data", "Em espanhol, com dados do fornecedor oficial de resultados")),
    ("other", 7, ("Modelos de producción", "Production models", "Modelos de produção"), ("Convencional (OB Van en la sede) · Full remote (IBC, 9 hubs) · REMI (galería en Lisboa)", "Conventional (OB van at the venue) · Full remote (IBC, 9 hubs) · REMI (gallery in Lisbon)", "Convencional (unidade móvel no local) · Full remote (IBC, 9 hubs) · REMI (galeria em Lisboa)")),
]

ADDITIONAL = (("Producción adicional y servicios unilaterales", "Additional production and unilateral services", "Produção adicional e serviços unilaterais"), (
    "<p>Se pueden reservar en el Portal RHB (<a href=\"/requests\">Booking</a>):</p><ul><li>Posiciones de stand-up</li><li>Asientos de observador</li><li>Cabinas off-tube</li><li>Circuitos IBC y sedes</li><li>Conectividad dedicada</li><li>Acceso al Cloud MAM</li><li>Paquetes Tailor Made</li></ul><p>Servicios <strong>dedicados</strong> (para todos los Juegos en el IBC, o un deporte en una sede) y <strong>ocasionales</strong> (por franjas, sesión o evento). Precios en el Rate Card [POR CONFIRMAR].</p><p>Las facilidades en sede son limitadas: con exceso de demanda se aplica el procedimiento habitual de arbitraje. El BVM representa a Booking en cada sede.</p>",
    "<p>The following can be booked through the RHB Portal (<a href=\"/requests\">Booking</a>):</p><ul><li>Stand-up positions</li><li>Observer seats</li><li>Off-tube booths</li><li>IBC and venue circuits</li><li>Dedicated connectivity</li><li>Cloud MAM access</li><li>Tailor Made packages</li></ul><p><strong>Dedicated</strong> services (for the whole Games at the IBC, or one sport at a venue) and <strong>occasional</strong> services (by time slot, session or event). Prices in the Rate Card [TBC].</p><p>Venue facilities are limited: when demand exceeds supply the usual arbitration procedure applies. The BVM represents Booking at each venue.</p>",
    "<p>Podem ser reservados no Portal RHB (<a href=\"/requests\">Booking</a>):</p><ul><li>Posições de stand-up</li><li>Assentos de observador</li><li>Cabines off-tube</li><li>Circuitos IBC e locais</li><li>Conectividade dedicada</li><li>Acesso ao Cloud MAM</li><li>Pacotes Tailor Made</li></ul><p>Serviços <strong>dedicados</strong> (para todos os Jogos no IBC, ou um esporte em um local) e <strong>ocasionais</strong> (por faixa horária, sessão ou evento). Preços no Rate Card [A CONFIRMAR].</p><p>As facilidades nos locais são limitadas: com excesso de demanda aplica-se o procedimento habitual de arbitragem. O BVM representa o Booking em cada local.</p>"))

P = "'all', 'published', now(), now()"
out = ["-- Lima 2027 · portal content (legal, FAQ, contacts, deadlines, technical parameters, additional production). Generated by scripts/lima/content.py.",
       "delete from public.faqs; delete from public.faq_categories; delete from public.contacts; delete from public.contact_areas;",
       "delete from public.legal_pages; delete from public.deadlines; delete from public.tech_parameters; delete from public.info_blocks where slug = 'additional-production';"]
for slug, pos, t, b in LEGAL:
    out.append(f"insert into public.legal_pages (slug, position, title_es, title_en, title_pt, body_es, body_en, body_pt, visibility, status, published_at, content_updated_at) values ({q(slug)}, {pos}, {', '.join(map(q, t))}, {', '.join(map(q, b))}, {P});")
for pos, t in FAQ_CATS:
    out.append(f"insert into public.faq_categories (position, title_es, title_en, title_pt, visibility, status, published_at, content_updated_at) values ({pos}, {', '.join(map(q, t))}, {P});")
for cat, pos, qs, a in FAQS:
    out.append(f"insert into public.faqs (category_id, position, question_es, question_en, question_pt, answer_es, answer_en, answer_pt, visibility, status, published_at, content_updated_at) values ((select id from public.faq_categories where position = {cat}), {pos}, {', '.join(map(q, qs))}, {', '.join(map(q, a))}, {P});")
for pos, t in AREAS:
    out.append(f"insert into public.contact_areas (position, title_es, title_en, title_pt, visibility, status, published_at, content_updated_at) values ({pos}, {', '.join(map(q, t))}, {P});")
for area, pos, name, r in CONTACTS:
    out.append(f"insert into public.contacts (area_id, position, name, role_es, role_en, role_pt, visibility, status, published_at, content_updated_at) values ((select id from public.contact_areas where position = {area}), {pos}, {q(name)}, {', '.join(map(q, r))}, {P});")
for due, t, link in DEADLINES:
    out.append(f"insert into public.deadlines (due_at, title_es, title_en, title_pt, link, visibility, status, published_at, content_updated_at) values ({q(due)}, {', '.join(map(q, t))}, {q(link)}, {P});")
for grp, pos, t, v in TECH:
    out.append(f"insert into public.tech_parameters (grp, position, title_es, title_en, title_pt, value_es, value_en, value_pt, visibility, status, published_at, content_updated_at) values ({q(grp)}, {pos}, {', '.join(map(q, t))}, {', '.join(map(q, v))}, {P});")
t, b = ADDITIONAL
out.append(f"insert into public.info_blocks (slug, position, title_es, title_en, title_pt, body_es, body_en, body_pt, visibility, status, published_at, content_updated_at) values ('additional-production', 0, {', '.join(map(q, t))}, {', '.join(map(q, b))}, {P});")
print("\n".join(out))

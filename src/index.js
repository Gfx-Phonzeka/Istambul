import React, { useState, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
const COLORS = {
  navy: "#0d2a4a",
  blue: "#1a4a7a",
  lightBlue: "#2979c0",
  accent: "#c0392b",
  accentLight: "#e74c3c",
  gold: "#f0a500",
  white: "#ffffff",
  offWhite: "#f7f8fa",
  lightGray: "#e8ecf0",
  midGray: "#8899aa",
  dark: "#0a1e33",
  teal: "#1d9e75",
  green: "#27ae60",
};

const lang = { en: "EN", tr: "TR" };

const sections = [
  { id: "home", label: "Home", labelTR: "Ana Sayfa", icon: "⬡" },
  { id: "vision", label: "1. Vision", labelTR: "1. Vizyon", icon: "◈" },
  { id: "track-record", label: "2. Track Record", labelTR: "2. Deneyim", icon: "◉" },
  { id: "local-branch", label: "2.2 Local Branch", labelTR: "2.2 Yerel Şube", icon: "◎" },
  { id: "architecture", label: "3. Architecture", labelTR: "3. Mimari", icon: "▦" },
  { id: "camera-tech", label: "4. Camera Tech", labelTR: "4. Kamera", icon: "◆" },
  { id: "ibc", label: "5. IBC", labelTR: "5. IBC", icon: "▣" },
  { id: "digital", label: "6. Digital", labelTR: "6. Dijital", icon: "◈" },
  { id: "legacy", label: "7. Legacy & ESG", labelTR: "7. Miras & ÇSY", icon: "◉" },
  { id: "fleet", label: "9. Fleet & Gantt", labelTR: "9. Filo & Gantt", icon: "▤" },
  { id: "timeline", label: "10. Timeline", labelTR: "10. Zaman Çizelgesi", icon: "▷" },
  { id: "financial", label: "11. Financial", labelTR: "11. Finansal", icon: "◐" },
];

const t = {
  vision: {
    title: { en: "Our Vision: The Bridge of Excellence", tr: "Vizyonumuz: Mükemmellik Köprüsü" },
    body: {
      en: "Istanbul is a vibrant metropolis where continents, cultures, and people seamlessly meet. Medialuso's vision is to create a Host Broadcast production that embodies this spirit: a conceptual and technological bridge connecting the absolute reliability of traditional sports broadcasting with the immersive, next-generation storytelling demanded by today's global audience.\n\nThe Istanbul 2027 European Games represent a monumental stepping stone — laying the definitive foundation for Turkey's prospective bid to host the 2036 Olympic Games. Our production is designed to be the ultimate global showcase of Turkey's capacity to host and broadcast mega-events.",
      tr: "İstanbul, kıtaların, kültürlerin ve insanların kusursuz biçimde buluştuğu canlı bir metropoldür. Medialuso'nun vizyonu, tam da bu ruhu somutlaştıran bir Yayıncı Kuruluş üretimi yaratmaktır: geleneksel spor yayıncılığının mutlak güvenilirliğini, günümüzün küresel izleyicisinin talep ettiği sürükleyici yeni nesil anlatımla buluşturan kavramsal ve teknolojik bir köprü.\n\nİstanbul 2027 Avrupa Oyunları, Türkiye'nin 2036 Olimpiyat adaylığının kesin temelini atan anıtsal bir basamağı temsil etmektedir.",
    },
    pillars: [
      {
        icon: "◈",
        en: "One Team Philosophy",
        tr: "Tek Ekip Felsefesi",
        desc_en: "EOC + LOC + Medialuso unified collaboration",
        desc_tr: "EOC + LOC + Medialuso ortak işbirliği",
        color: COLORS.lightBlue,
      },
      {
        icon: "◉",
        en: "Olympic-Level Production",
        tr: "Olimpiyat Düzeyi Üretim",
        desc_en: "1080p HDR · Dolby 5.1 · 99.99% uptime",
        desc_tr: "1080p HDR · Dolby 5.1 · %99,99 kesintisizlik",
        color: COLORS.accent,
      },
      {
        icon: "▷",
        en: "6-Month Promo Taskforce",
        tr: "6 Aylık Tanıtım Ekibi",
        desc_en: "Premium content to amplify Istanbul globally",
        desc_tr: "İstanbul'u küresel arenada tanıtacak içerik",
        color: COLORS.teal,
      },
      {
        icon: "◎",
        en: "60% Local Workforce",
        tr: "%60 Yerel İşgücü",
        desc_en: "800–900 personnel, majority from Turkey",
        desc_tr: "800–900 personel, çoğunluğu Türkiye'den",
        color: COLORS.gold,
      },
    ],
  },
  trackRecord: {
    title: { en: "The Ultimate Multi-Sport Broadcast Partner", tr: "Nihai Çoklu Spor Yayın Ortağı" },
    body: {
      en: "Medialuso brings over 28 years of unparalleled excellence in sports broadcasting. The true core of our expertise lies in managing the immense technical, operational, and logistical complexity of global multi-sport mega-events. We do not just broadcast sports; we build comprehensive broadcast cities.",
      tr: "Medialuso, spor yayıncılığında 28 yılı aşkın eşsiz mükemmellik sunar. Uzmanlığımızın özü, küresel çok sporlu mega etkinliklerin teknik ve operasyonel karmaşıklığını yönetmekte yatar. Yalnızca spor yayını yapmıyoruz; kapsamlı yayın şehirleri inşa ediyoruz.",
    },
    stats: [
      { value: "28+", label_en: "Years of Excellence", label_tr: "Yıl Mükemmellik" },
      { value: "740", label_en: "Professionals EG2023", label_tr: "Uzman EG2023" },
      { value: "750h", label_en: "Live Broadcast Hours", label_tr: "Canlı Yayın Saati" },
      { value: "3", label_en: "Continents Covered", label_tr: "Kıtada Faaliyet" },
    ],
    events: [
      { period: "1998–Present", label_en: "FIFA WC, UEFA CL, Top European Leagues", label_tr: "FIFA WC, UEFA ŞL, Avrupa Ligleri", color: COLORS.midGray },
      { period: "2017–2022", label_en: "Multi-Sport Expansion", label_tr: "Çok Sporlu Genişleme", color: COLORS.lightBlue },
      { period: "2023–2025", label_en: "EG Kraków · PanAm Santiago · UCL İstanbul", label_tr: "EA Kraków · PanAm Santiago · ŞL İstanbul", color: COLORS.accent },
      { period: "Istanbul 2027", label_en: "European Games — THE FUTURE", label_tr: "Avrupa Oyunları — GELECEK", color: COLORS.gold },
    ],
  },
  localBranch: {
    title: { en: "The Power of Our Local Branch", tr: "Yerel Şubemizin Gücü" },
    body: {
      en: "Our strength in Istanbul is not imported; it is resident. Medialuso's dedicated local branch has been operating successfully in the Turkish broadcast market for over a decade, consistently providing high-end technical resources for the Turkish Süper Lig and as Medialuso's strategic expansion hub for Eastern Europe.",
      tr: "İstanbul'daki gücümüz ithal değil, yerleşiktir. On yılı aşkın süredir Türkiye yayın pazarında başarıyla faaliyet gösteren yerel şubemiz, Türkiye Süper Ligi için üst düzey teknik kaynaklar sağlıyor ve Medialuso'nun Doğu Avrupa genişleme merkezi olarak hizmet veriyor.",
    },
    bullets: [
      { en: "10+ years in the Turkish broadcast market", tr: "10+ yıl Türkiye yayın pazarında" },
      { en: "Regular supplier to Turkish Süper Lig", tr: "Türkiye Süper Ligi'ne düzenli hizmet sağlayıcı" },
      { en: "Strategic hub for Eastern Europe expansion", tr: "Doğu Avrupa için stratejik genişleme merkezi" },
      { en: "Turkish professionals in elite global teams", tr: "Küresel seçkin ekiplerde Türk profesyoneller" },
      { en: "Unparalleled operational security for EG2027", tr: "EG2027 için eşsiz operasyonel güvenlik" },
    ],
  },
  architecture: {
    title: { en: "Broadcast Production Strategy & Architecture", tr: "Yayın Üretim Stratejisi ve Mimarisi" },
    body: {
      en: "Medialuso proposes a highly optimized Semi-Conventional IBC Production Architecture — guaranteeing the fail-safe reliability of traditional OB Vans for raw acquisition, while intelligently centralizing specific technical and editorial workflows to reduce the host city's footprint.",
      tr: "Medialuso, ham çekimler için geleneksel OB Van güvenilirliğini garanti ederken belirli iş akışlarını merkezileştirerek ev sahibi şehrin ayak izini azaltan Yarı Geleneksel IBC Üretim Mimarisi önermektedir.",
    },
    specs: [
      { label_en: "Video Standard", label_tr: "Video Standardı", value: "1080p HDR", sub: "1920×1080" },
      { label_en: "Audio Standard", label_tr: "Ses Standardı", value: "Dolby 5.1", sub: "Surround Sound" },
      { label_en: "Uptime Goal", label_tr: "Kesintisizlik Hedefi", value: "99.99%", sub: "Auto-failover" },
      { label_en: "Redundancy", label_tr: "Yedekleme", value: "Dark Fiber", sub: "+ 4G/5G backup" },
    ],
    tiers: [
      {
        name_en: "Premium", name_tr: "Premium",
        cameras: "18–25",
        equipment_en: "Large OB Trucks + 4–6 Replay Systems",
        equipment_tr: "Büyük OB Van + 4–6 Replay Sistemi",
        sports_en: "Athletics · Aquatics · Triathlon · Gymnastics",
        sports_tr: "Atletizm · Su Sporları · Triatlon · Jimnastik",
        color: COLORS.accent,
      },
      {
        name_en: "Standard", name_tr: "Standart",
        cameras: "8–12",
        equipment_en: "Medium OB Units + 2–3 Replay Systems",
        equipment_tr: "Orta OB + 2–3 Replay Sistemi",
        sports_en: "3x3 Basketball · Beach Volley · Canoe Sprint · Archery · Shooting · Table Tennis",
        sports_tr: "3x3 Basketbol · Plaj Voleybolu · Kano · Okçuluk · Atıcılık · Masa Tenisi",
        color: COLORS.lightBlue,
      },
      {
        name_en: "Compact", name_tr: "Kompakt",
        cameras: "4–6",
        equipment_en: "Agile Flypack + 1 Replay Server",
        equipment_tr: "Çevik Flypack + 1 Replay Sunucusu",
        sports_en: "Boxing · Fencing · Judo · Karate · Taekwondo · Wrestling · Padel · Squash · Rugby 7s",
        sports_tr: "Boks · Eskrim · Judo · Karate · Tekvando · Güreş · Padel · Squash · Ragbi 7",
        color: COLORS.teal,
      },
    ],
  },
  cameraTech: {
    title: { en: "Visual Innovation & Special Cameras", tr: "Görsel İnovasyon ve Özel Kameralar" },
    body: {
      en: "Medialuso's exclusive in-house R&D company is completely dedicated to engineering Special Cameras, integrating bespoke cutting-edge visual technologies without relying on third-party vendors — guaranteeing absolute reliability and spectacular narrative angles.",
      tr: "Medialuso'nun şirket içi Ar-Ge firması, üçüncü taraflara bağımlı olmadan özel görsel teknolojileri üretimlerimize entegre eden özel kameralar mühendisliğine tamamen adanmıştır.",
    },
    techs: [
      {
        icon: "◎",
        name_en: "Ultra Slow-Motion",
        name_tr: "Ultra Ağır Çekim",
        detail_en: "Up to 2,600 fps — redefining every millisecond of victory",
        detail_tr: "Saniyede 2.600 kareye kadar — zaferin her milisaniyesini yeniden tanımlar",
        color: COLORS.accent,
      },
      {
        icon: "◈",
        name_en: "POV & RefCams",
        name_tr: "POV & Hakem Kameraları",
        detail_en: "Referee cameras + FPV drones immersing viewers in the action",
        detail_tr: "Hakem kameraları + FPV dronlar izleyicileri aksiyonun içine çeker",
        color: COLORS.lightBlue,
      },
      {
        icon: "▦",
        name_en: "4Sky & AR Systems",
        name_tr: "4Sky ve AR Sistemleri",
        detail_en: "Proprietary cable cams with Augmented Reality overlays over the Bosphorus",
        detail_tr: "Tescilli kablo kameralar — İstanbul Boğazı üzerinde AR grafikleri",
        color: COLORS.teal,
      },
    ],
  },
  ibc: {
    title: { en: "The International Broadcast Centre (IBC)", tr: "Uluslararası Yayın Merkezi (IBC)" },
    body: {
      en: "Medialuso will design, install, and manage a highly secure, modular IBC facility requiring 1,500–2,500 m². The Semi-Conventional model centralizes critical operations while offloading editorial tasks to remote hubs, minimizing Istanbul's physical footprint.",
      tr: "Medialuso, 1.500–2.500 m² arasında bir alan gerektirecek, son derece güvenli ve modüler bir IBC tasarlayacak, kuracak ve yönetecektir. Yarı Geleneksel model, kritik operasyonları merkezileştirirken editoryal görevleri uzak merkezlere aktarır.",
    },
    zones: [
      { num: "1", name_en: "CDT Core", name_tr: "CDT Çekirdeği", desc_en: "Receives all venue feeds, manages servers, handles routing & distribution", desc_tr: "Tüm tesis yayınlarını alır, sunucuları yönetir, yönlendirme yapar", color: COLORS.lightBlue },
      { num: "2", name_en: "Tech QC (On-Site)", name_tr: "Teknik KK (Sahada)", desc_en: "Real-time monitoring — 1080p HDR quality, Dolby 5.1 levels, sync", desc_tr: "Gerçek zamanlı izleme — 1080p HDR kalitesi, Dolby 5.1, senkronizasyon", color: COLORS.accent },
      { num: "3", name_en: "Remote Editorial QC", name_tr: "Uzaktan Editoryal KK", desc_en: "Off-site narrative consistency, graphics integration, multi-cam standards", desc_tr: "Saha dışı anlatı tutarlılığı, grafik entegrasyonu, çok kamera standartları", color: COLORS.teal },
      { num: "4", name_en: "Content Factory", name_tr: "İçerik Fabrikası", desc_en: "Daily highlights, sport packages, 9:16 social formats, Promo Taskforce", desc_tr: "Günlük özetler, spora özel paketler, 9:16 sosyal formatlar, Tanıtım Ekibi", color: COLORS.gold },
      { num: "5", name_en: "BOC", name_tr: "Yayın Operasyon Merkezi", desc_en: "Central logistics hub — scheduling, RHB liaison, venue comms", desc_tr: "Merkezi lojistik — planlama, RHB irtibatı, tesis iletişimi", color: "#7f5af0" },
    ],
  },
  digital: {
    title: { en: "Digital Ecosystem & Content Factory", tr: "Dijital Ekosistem ve İçerik Fabrikası" },
    body: {
      en: "Modern sports fans consume content differently. Medialuso's production pipeline is built with a strict \"Digital-First\" mindset — automatically generating native 9:16 vertical video feeds alongside standard 16:9 broadcasts, instantly ready for TikTok, Instagram Reels, and YouTube Shorts.",
      tr: "Modern spor taraftarları içerikleri farklı tüketiyor. Üretim hattımız katı bir 'Dijital Öncelikli' zihniyetle inşa edilmiş — standart 16:9 yayınlarının yanında yerel 9:16 dikey video akışları otomatik oluşturularak TikTok, Instagram Reels ve YouTube Shorts'a anında dağıtıma hazır hale getirilir.",
    },
  },
  legacy: {
    title: { en: "Sustainability, Legacy & ESG", tr: "Sürdürülebilirlik, Miras ve ÇSY" },
    body: {
      en: "A true broadcast legacy is built on human capital and strategic national alliances. Medialuso commits to a workforce model that empowers the host nation — with 60% local sourcing, a TRT strategic partnership, a Broadcast Legacy Program for Turkish university students, and a 40% carbon reduction through our Green Hub model.",
      tr: "Gerçek bir yayın mirası, insan sermayesi ve stratejik ulusal ittifaklar üzerine inşa edilir. Medialuso; %60 yerel istihdam, TRT stratejik ortaklığı, üniversite öğrencileri için Yayın Mirası Programı ve Yeşil Merkez modeliyle %40 karbon azaltımı taahhüt eder.",
    },
    metrics: [
      { value: "60%", label_en: "Local Turkish staff", label_tr: "Türk yerel personel", color: COLORS.teal },
      { value: "-40%", label_en: "Carbon vs traditional", label_tr: "Geleneksele göre karbon", color: COLORS.green },
      { value: "100%", label_en: "Remote editorial QC", label_tr: "Uzaktan editoryal KK", color: COLORS.lightBlue },
      { value: "2036", label_en: "Olympic vision legacy", label_tr: "Olimpiyat vizyonu mirası", color: COLORS.gold },
    ],
  },
  fleet: {
    title: { en: "Production Plan & Fleet Allocation", tr: "Üretim Planı ve Filo Tahsisi" },
    body: {
      en: "Instead of a wasteful 1-to-1 vehicle allocation, Medialuso uses a Smart Turnaround Strategy: 17 premium OB Vans performing double-duty based on geographical clusters and chronological schedules — drastically reducing footprint and costs while guaranteeing resources are always where the action is.",
      tr: "Araçların 1'e 1 tahsis edilmesi yerine Medialuso, coğrafi kümelenmelere ve kronolojik takvimlere göre 17 premium OB Van'ın çift görev yapmasını sağlayan Akıllı Geçiş Stratejisi kullanır.",
    },
  },
  timeline: {
    title: { en: "Implementation Timeline", tr: "Uygulama Zaman Çizelgesi" },
    milestones: [
      { date: "Apr 2026", date_tr: "Nis 2026", label_en: "Kick-off & TRT Partnership", label_tr: "Başlangıç & TRT Ortaklığı", color: COLORS.accent },
      { date: "Jun 2026", date_tr: "Haz 2026", label_en: "Venue Technical Planning & Site Surveys", label_tr: "Tesis Teknik Planlaması & Saha Anketleri", color: COLORS.lightBlue },
      { date: "Aug 2026", date_tr: "Ağu 2026", label_en: "Infrastructure Design & Rate Card", label_tr: "Altyapı Tasarımı & Tarife Yayını", color: COLORS.lightBlue },
      { date: "Feb 2027", date_tr: "Şub 2027", label_en: "IBC Construction & Fiber Rigging", label_tr: "IBC İnşası & Fiber Kablolama", color: COLORS.teal },
      { date: "May 2027", date_tr: "May 2027", label_en: "Full Technical Rehearsals & BOC Activation", label_tr: "Tam Teknik Provalar & BOC Aktivasyonu", color: COLORS.teal },
      { date: "Jun 2027", date_tr: "Haz 2027", label_en: "Games Operations & Live Broadcasting", label_tr: "Oyunlar Operasyonları & Canlı Yayın", color: COLORS.gold },
    ],
  },
  financial: {
    title: { en: "Financial Proposal: Turnkey Solution", tr: "Finansal Teklif: Anahtar Teslim Çözüm" },
    body: {
      en: "Medialuso proposes a comprehensive Turnkey Host Broadcasting Solution — covering the full scope from multi-tier venue acquisition and Semi-Conventional IBC operation, to digital content generation and the 6-month Promotional Taskforce. Our intelligent architecture surpasses EG2023 production value while maintaining strict financial containment.",
      tr: "Medialuso, çok katmanlı tesis yayınından Yarı Geleneksel IBC operasyonuna, dijital içerik üretiminden 6 aylık Tanıtım Görev Gücüne kadar tüm kapsamı kapsayan Anahtar Teslim Yayıncı Kuruluş Çözümü önermektedir.",
    },
    breakdown: [
      { label_en: "Competition Production", label_tr: "Müsabaka Üretimi", pct: 45, color: COLORS.accent },
      { label_en: "Personnel & Workforce", label_tr: "Personel & İşgücü", pct: 22, color: COLORS.lightBlue },
      { label_en: "IBC Operations & Digital Hub", label_tr: "IBC & Dijital Merkez", pct: 18, color: COLORS.teal },
      { label_en: "Ceremonies Production", label_tr: "Tören Üretimi", pct: 12, color: COLORS.gold },
      { label_en: "Signal Transmission", label_tr: "Sinyal İletimi", pct: 8, color: "#7f5af0" },
    ],
  },
};

// ─── Components ───────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: `linear-gradient(135deg, ${COLORS.accent} 40%, #8b0000)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: -1,
      }}>M</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.white, letterSpacing: 1.5, lineHeight: 1 }}>MEDIALUSO</div>
        <div style={{ fontSize: 9, color: COLORS.midGray, letterSpacing: 2, lineHeight: 1.4 }}>BROADCAST EXCELLENCE</div>
      </div>
    </div>
  );
}

function EGBadge() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "4px 12px", border: `1px solid ${COLORS.gold}`,
      borderRadius: 6,
    }}>
      <div style={{ fontSize: 9, color: COLORS.gold, letterSpacing: 2 }}>THE EUROPEAN GAMES</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.white, letterSpacing: 1 }}>ISTANBUL 2027</div>
    </div>
  );
}

function LangToggle({ lang: l, setLang }) {
  return (
    <div style={{ display: "flex", borderRadius: 20, overflow: "hidden", border: `1px solid ${COLORS.lightBlue}` }}>
      {["en", "tr"].map(code => (
        <button key={code} onClick={() => setLang(code)} style={{
          padding: "4px 14px", fontSize: 12, fontWeight: 700, letterSpacing: 1,
          background: l === code ? COLORS.lightBlue : "transparent",
          color: l === code ? "#fff" : COLORS.midGray,
          border: "none", cursor: "pointer", transition: "all 0.2s",
        }}>{code.toUpperCase()}</button>
      ))}
    </div>
  );
}

function NavBar({ current, setCurrent, language, setLanguage, menuOpen, setMenuOpen }) {
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: `${COLORS.dark}ee`, backdropFilter: "blur(8px)",
      borderBottom: `1px solid ${COLORS.navy}`,
    }}>
      <div style={{
        maxWidth: 1400, margin: "0 auto", padding: "0 20px",
        height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Logo />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <EGBadge />
          <LangToggle lang={language} setLang={setLanguage} />
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: "none", border: `1px solid ${COLORS.navy}`,
            color: COLORS.white, cursor: "pointer", padding: "6px 12px",
            borderRadius: 6, fontSize: 18,
          }}>☰</button>
        </div>
      </div>
      {menuOpen && (
        <div style={{
          background: COLORS.dark, borderTop: `1px solid ${COLORS.navy}`,
          display: "flex", flexWrap: "wrap", gap: 4, padding: "12px 20px",
        }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => { setCurrent(s.id); setMenuOpen(false); }} style={{
              padding: "6px 14px", fontSize: 12, borderRadius: 20,
              background: current === s.id ? COLORS.lightBlue : COLORS.navy,
              color: current === s.id ? "#fff" : COLORS.midGray,
              border: `1px solid ${current === s.id ? COLORS.lightBlue : COLORS.navy}`,
              cursor: "pointer", fontWeight: current === s.id ? 700 : 400,
              transition: "all 0.15s",
            }}>
              {language === "tr" ? s.labelTR : s.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

function SectionNav({ current, setCurrent, language }) {
  const idx = sections.findIndex(s => s.id === current);
  const prev = idx > 0 ? sections[idx - 1] : null;
  const next = idx < sections.length - 1 ? sections[idx + 1] : null;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "24px 0 0", borderTop: `1px solid ${COLORS.navy}`, marginTop: 48,
    }}>
      {prev ? (
        <button onClick={() => setCurrent(prev.id)} style={{
          display: "flex", alignItems: "center", gap: 8, background: "none",
          border: `1px solid ${COLORS.navy}`, color: COLORS.midGray,
          padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13,
          transition: "all 0.15s",
        }}>
          ← {language === "tr" ? prev.labelTR : prev.label}
        </button>
      ) : <div />}
      <button onClick={() => setCurrent("home")} style={{
        background: "none", border: `1px solid ${COLORS.navy}`, color: COLORS.midGray,
        padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 12,
      }}>⬡ Menu</button>
      {next ? (
        <button onClick={() => setCurrent(next.id)} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: COLORS.lightBlue, border: "none",
          color: "#fff", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13,
          fontWeight: 600, transition: "all 0.15s",
        }}>
          {language === "tr" ? next.labelTR : next.label} →
        </button>
      ) : <div />}
    </div>
  );
}

function PageWrapper({ children, lang, current, setCurrent }) {
  return (
    <div style={{
      maxWidth: 960, margin: "0 auto", padding: "100px 24px 48px",
      minHeight: "100vh",
    }}>
      {children}
      <SectionNav current={current} setCurrent={setCurrent} language={lang} />
    </div>
  );
}

function SectionTitle({ en, tr, lang, sub_en, sub_tr }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h1 style={{
        fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 800,
        color: COLORS.white, margin: 0, lineHeight: 1.15,
        letterSpacing: -0.5,
      }}>
        {lang === "tr" ? tr : en}
      </h1>
      {(sub_en || sub_tr) && (
        <p style={{ color: COLORS.midGray, fontSize: 15, marginTop: 8, marginBottom: 0 }}>
          {lang === "tr" ? sub_tr : sub_en}
        </p>
      )}
      <div style={{ width: 48, height: 3, background: COLORS.accent, marginTop: 16, borderRadius: 2 }} />
    </div>
  );
}

function StatCard({ value, label, color }) {
  return (
    <div style={{
      background: COLORS.navy, border: `1px solid ${COLORS.blue}`,
      borderRadius: 10, padding: "20px 16px", textAlign: "center",
      borderTop: `3px solid ${color || COLORS.accent}`,
    }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: color || COLORS.accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.midGray, marginTop: 6, lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

function BodyText({ children }) {
  return (
    <p style={{
      color: "#b0c4d8", fontSize: 15, lineHeight: 1.8,
      marginBottom: 24, whiteSpace: "pre-line",
    }}>{children}</p>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────

function HomePage({ setCurrent, language }) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px 48px" }}>
      {/* Hero */}
      <div style={{
        textAlign: "center", padding: "60px 20px 48px",
        borderBottom: `1px solid ${COLORS.navy}`,
      }}>
        <div style={{
          display: "inline-block", padding: "6px 20px", borderRadius: 20,
          background: `${COLORS.accent}22`, border: `1px solid ${COLORS.accent}`,
          color: COLORS.gold, fontSize: 12, letterSpacing: 3, marginBottom: 24,
        }}>
          HOST BROADCAST PRODUCTION PROPOSAL
        </div>
        <h1 style={{
          fontSize: "clamp(32px, 5vw, 64px)", fontWeight: 900,
          color: COLORS.white, margin: "0 0 8px",
          letterSpacing: -1, lineHeight: 1.1,
        }}>
          {language === "tr" ? "Mükemmellik Köprüsü" : "The Bridge of Excellence"}
        </h1>
        <h2 style={{
          fontSize: "clamp(18px, 3vw, 32px)", fontWeight: 400,
          color: COLORS.lightBlue, margin: "0 0 32px",
        }}>
          European Games · Istanbul 2027
        </h2>
        <p style={{ color: COLORS.midGray, fontSize: 16, maxWidth: 600, margin: "0 auto 36px", lineHeight: 1.7 }}>
          {language === "tr"
            ? "Medialuso'nun İstanbul 2027 Avrupa Oyunları için Yayıncı Kuruluş Üretim Teklifine hoş geldiniz. Bölümlerde gezinmek için aşağıdaki kartları kullanın."
            : "Welcome to Medialuso's Host Broadcast Production Proposal for the Istanbul 2027 European Games. Use the cards below to navigate through each section of the proposal."}
        </p>
      </div>

      {/* Section cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 16, marginTop: 48,
      }}>
        {sections.filter(s => s.id !== "home").map((s, i) => (
          <button key={s.id} onClick={() => setCurrent(s.id)} style={{
            background: COLORS.navy, border: `1px solid ${COLORS.blue}`,
            borderRadius: 12, padding: "20px 16px", cursor: "pointer",
            textAlign: "left", color: COLORS.white,
            transition: "all 0.2s", borderLeft: `3px solid ${[COLORS.accent, COLORS.lightBlue, COLORS.teal, COLORS.gold, "#7f5af0"][i % 5]}`,
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.background = COLORS.blue; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.background = COLORS.navy; }}
          >
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: COLORS.white }}>
              {language === "tr" ? s.labelTR : s.label}
            </div>
          </button>
        ))}
      </div>

      {/* Footer branding */}
      <div style={{
        textAlign: "center", marginTop: 64,
        color: COLORS.midGray, fontSize: 12, letterSpacing: 2,
        borderTop: `1px solid ${COLORS.navy}`, paddingTop: 24,
      }}>
        MEDIALUSO · 28 YEARS OF GLOBAL BROADCAST EXCELLENCE · CONFIDENTIAL PROPOSAL
      </div>
    </div>
  );
}

// ─── VISION ──────────────────────────────────────────────────────────────────

function VisionPage({ lang, current, setCurrent }) {
  const d = t.vision;
  return (
    <PageWrapper lang={lang} current={current} setCurrent={setCurrent}>
      <SectionTitle en={d.title.en} tr={d.title.tr} lang={lang} />
      <BodyText>{lang === "tr" ? d.body.tr : d.body.en}</BodyText>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginTop: 32 }}>
        {d.pillars.map((p, i) => (
          <div key={i} style={{
            background: COLORS.navy, borderRadius: 12, padding: 20,
            borderTop: `3px solid ${p.color}`,
          }}>
            <div style={{ fontSize: 28, marginBottom: 12, color: p.color }}>{p.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.white, marginBottom: 6 }}>
              {lang === "tr" ? p.tr : p.en}
            </div>
            <div style={{ fontSize: 12, color: COLORS.midGray, lineHeight: 1.5 }}>
              {lang === "tr" ? p.desc_tr : p.desc_en}
            </div>
          </div>
        ))}
      </div>

      {/* Bridge visual */}
      <div style={{
        marginTop: 40, padding: 28, background: COLORS.navy,
        borderRadius: 12, border: `1px solid ${COLORS.blue}`,
      }}>
        <div style={{ fontSize: 12, color: COLORS.midGray, letterSpacing: 2, marginBottom: 20, textAlign: "center" }}>
          {lang === "tr" ? "YAYIN MİMARİSİ KÖPRÜSÜ" : "THE BROADCAST ARCHITECTURE BRIDGE"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, justifyContent: "center", flexWrap: "wrap", gap: 4 }}>
          {[
            { label: lang === "tr" ? "Geleneksel OB Güvenilirliği" : "Traditional OB Reliability", color: COLORS.midGray },
            { label: "+", color: COLORS.white, isOp: true },
            { label: lang === "tr" ? "Akıllı IBC Merkezi" : "Intelligent IBC Hub", color: COLORS.lightBlue },
            { label: "=", color: COLORS.white, isOp: true },
            { label: lang === "tr" ? "Olimpiyat Seviyesi Kalite" : "Olympic-Level Quality", color: COLORS.gold },
          ].map((item, i) => (
            item.isOp
              ? <div key={i} style={{ fontSize: 20, color: item.color, padding: "0 8px" }}>{item.label}</div>
              : <div key={i} style={{
                padding: "12px 20px", borderRadius: 8,
                background: `${item.color}18`, border: `1px solid ${item.color}44`,
                color: item.color, fontSize: 13, fontWeight: 600, textAlign: "center",
              }}>{item.label}</div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}

// ─── TRACK RECORD ─────────────────────────────────────────────────────────────

function TrackRecordPage({ lang, current, setCurrent }) {
  const d = t.trackRecord;
  return (
    <PageWrapper lang={lang} current={current} setCurrent={setCurrent}>
      <SectionTitle en={d.title.en} tr={d.title.tr} lang={lang} />
      <BodyText>{lang === "tr" ? d.body.tr : d.body.en}</BodyText>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 40 }}>
        {d.stats.map((s, i) => (
          <StatCard key={i} value={s.value}
            label={lang === "tr" ? s.label_tr : s.label_en}
            color={[COLORS.accent, COLORS.lightBlue, COLORS.teal, COLORS.gold][i]} />
        ))}
      </div>

      {/* Timeline */}
      <div style={{ marginTop: 32 }}>
        <div style={{ fontSize: 12, color: COLORS.midGray, letterSpacing: 2, marginBottom: 20 }}>
          28 {lang === "tr" ? "YILLIK KÜRESEL LİDERLİK" : "YEARS OF GLOBAL LEADERSHIP"}
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: 24, left: 0, right: 0, height: 2, background: COLORS.blue }} />
          <div style={{ display: "flex", gap: 0, justifyContent: "space-between", position: "relative" }}>
            {d.events.map((ev, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", padding: "0 6px" }}>
                <div style={{
                  width: 12, height: 12, borderRadius: "50%",
                  background: ev.color, border: `2px solid ${COLORS.dark}`,
                  margin: "18px auto 12px", position: "relative", zIndex: 1,
                }} />
                <div style={{ fontSize: 10, color: ev.color, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>{ev.period}</div>
                <div style={{ fontSize: 11, color: COLORS.midGray, lineHeight: 1.4 }}>
                  {lang === "tr" ? ev.label_tr : ev.label_en}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 40, padding: 20, background: `${COLORS.accent}11`,
        border: `1px solid ${COLORS.accent}44`, borderRadius: 10,
      }}>
        <div style={{ fontSize: 13, color: "#dde", lineHeight: 1.8 }}>
          {lang === "tr"
            ? "EG2023 Kraków-Małopolska için Medialuso, 740 yayın profesyonelini ve en az 15 son teknoloji HD OB Van'ı sahaya sürdü — zorlu bütçe ve zaman kısıtlamaları altında 750+ saat kusursuz canlı yayın üretti."
            : "For EG2023 Kraków-Małopolska, Medialuso deployed 740 broadcast professionals and a minimum of 15 state-of-the-art HD OB Vans — producing over 750 hours of pristine live broadcasting under rigorous budget and time constraints."}
        </div>
      </div>
    </PageWrapper>
  );
}

// ─── LOCAL BRANCH ─────────────────────────────────────────────────────────────

function LocalBranchPage({ lang, current, setCurrent }) {
  const d = t.localBranch;
  const [images, setImages] = useState([]);
  const fileInputRef = useRef();

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setImages(prev => [...prev, { src: ev.target.result, name: f.name }]);
      reader.readAsDataURL(f);
    });
  };

  return (
    <PageWrapper lang={lang} current={current} setCurrent={setCurrent}>
      <SectionTitle en={d.title.en} tr={d.title.tr} lang={lang} />
      <BodyText>{lang === "tr" ? d.body.tr : d.body.en}</BodyText>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        {/* Key points */}
        <div>
          {d.bullets.map((b, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "12px 0", borderBottom: `1px solid ${COLORS.navy}`,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: COLORS.teal, marginTop: 7, flexShrink: 0,
              }} />
              <div style={{ fontSize: 14, color: "#b0c4d8", lineHeight: 1.6 }}>
                {lang === "tr" ? b.tr : b.en}
              </div>
            </div>
          ))}
        </div>

        {/* Image gallery */}
        <div>
          <div style={{
            padding: "16px", background: COLORS.navy, borderRadius: 10,
            border: `1px dashed ${COLORS.lightBlue}`,
            textAlign: "center", marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, color: COLORS.midGray, marginBottom: 12 }}>
              {lang === "tr"
                ? "Yerel şubeye ait kendi fotoğraflarınızı ekleyin"
                : "Upload your own photos of the local branch"}
            </div>
            <button onClick={() => fileInputRef.current.click()} style={{
              padding: "8px 20px", background: COLORS.lightBlue, color: "#fff",
              border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}>
              + {lang === "tr" ? "Fotoğraf Ekle" : "Add Photos"}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple
              style={{ display: "none" }} onChange={handleFiles} />
          </div>

          {images.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {images.map((img, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img src={img.src} alt={img.name} style={{
                    width: "100%", height: 120, objectFit: "cover",
                    borderRadius: 8, border: `1px solid ${COLORS.blue}`,
                  }} />
                  <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} style={{
                    position: "absolute", top: 4, right: 4, background: `${COLORS.dark}cc`,
                    color: "#fff", border: "none", borderRadius: "50%",
                    width: 20, height: 20, cursor: "pointer", fontSize: 10, lineHeight: 1,
                  }}>✕</button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              height: 120, background: COLORS.dark, borderRadius: 8,
              border: `1px solid ${COLORS.navy}`, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ color: COLORS.midGray, fontSize: 12, textAlign: "center" }}>
                {lang === "tr" ? "Fotoğraflar burada görünecek" : "Photos will appear here"}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12, marginTop: 32,
      }}>
        {[
          { value: "10+", label_en: "Years in Turkey", label_tr: "Yıl Türkiye'de" },
          { value: "Süper Lig", label_en: "Regular Client", label_tr: "Düzenli Müşteri" },
          { value: "E. Europe", label_en: "Expansion Hub", label_tr: "Genişleme Merkezi" },
        ].map((s, i) => (
          <StatCard key={i} value={s.value}
            label={lang === "tr" ? s.label_tr : s.label_en}
            color={[COLORS.teal, COLORS.lightBlue, COLORS.gold][i]} />
        ))}
      </div>
    </PageWrapper>
  );
}

// ─── ARCHITECTURE ─────────────────────────────────────────────────────────────

function ArchitecturePage({ lang, current, setCurrent }) {
  const d = t.architecture;
  const [activeTier, setActiveTier] = useState(0);
  return (
    <PageWrapper lang={lang} current={current} setCurrent={setCurrent}>
      <SectionTitle en={d.title.en} tr={d.title.tr} lang={lang} />
      <BodyText>{lang === "tr" ? d.body.tr : d.body.en}</BodyText>

      {/* Tech specs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 36 }}>
        {d.specs.map((s, i) => (
          <div key={i} style={{
            background: COLORS.navy, borderRadius: 10, padding: "16px 14px",
            border: `1px solid ${COLORS.blue}`,
          }}>
            <div style={{ fontSize: 11, color: COLORS.midGray, letterSpacing: 1, marginBottom: 8 }}>
              {lang === "tr" ? s.label_tr : s.label_en}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.white }}>{s.value}</div>
            <div style={{ fontSize: 11, color: COLORS.lightBlue, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Architecture flow */}
      <div style={{
        background: COLORS.navy, borderRadius: 12, padding: 24,
        marginBottom: 36, border: `1px solid ${COLORS.blue}`,
      }}>
        <div style={{ fontSize: 11, color: COLORS.midGray, letterSpacing: 2, marginBottom: 20, textAlign: "center" }}>
          {lang === "tr" ? "YARI GELENEKSEL IBC MİMARİSİ" : "SEMI-CONVENTIONAL IBC ARCHITECTURE"}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
          {[
            { label: lang === "tr" ? "Tesis OB Van'ları" : "Venue OB Vans", sub: lang === "tr" ? "Ham çekim" : "Raw capture", color: COLORS.lightBlue },
            { arrow: true },
            { label: lang === "tr" ? "İstanbul IBC" : "Istanbul IBC", sub: lang === "tr" ? "CDT + KK + Fabrika" : "CDT + QC + Factory", color: COLORS.accent, highlight: true },
            { arrow: true },
            { label: lang === "tr" ? "Uzak Merkezler" : "Remote Hubs", sub: lang === "tr" ? "Editoryal KK" : "Editorial QC", color: COLORS.teal },
            { arrow: true },
            { label: lang === "tr" ? "Küresel Dağıtım" : "Global Delivery", sub: "RHBs + OTT", color: COLORS.gold },
          ].map((item, i) =>
            item.arrow
              ? <div key={i} style={{ color: COLORS.midGray, fontSize: 18 }}>→</div>
              : <div key={i} style={{
                padding: "14px 16px", borderRadius: 8, textAlign: "center",
                background: item.highlight ? `${item.color}22` : COLORS.dark,
                border: `${item.highlight ? 2 : 1}px solid ${item.color}`,
                minWidth: 110,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.label}</div>
                <div style={{ fontSize: 10, color: COLORS.midGray, marginTop: 4 }}>{item.sub}</div>
              </div>
          )}
        </div>
      </div>

      {/* Tiers */}
      <div style={{ fontSize: 12, color: COLORS.midGray, letterSpacing: 2, marginBottom: 16 }}>
        {lang === "tr" ? "YAYIM KATMANLARI" : "COMPETITION COVERAGE TIERS"}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {d.tiers.map((tier, i) => (
          <button key={i} onClick={() => setActiveTier(i)} style={{
            padding: "8px 16px", borderRadius: 6, fontSize: 13,
            background: activeTier === i ? tier.color : COLORS.navy,
            color: activeTier === i ? "#fff" : COLORS.midGray,
            border: `1px solid ${activeTier === i ? tier.color : COLORS.blue}`,
            cursor: "pointer", fontWeight: activeTier === i ? 700 : 400,
          }}>
            {lang === "tr" ? tier.name_tr : tier.name_en}
          </button>
        ))}
      </div>
      {d.tiers.map((tier, i) => activeTier === i && (
        <div key={i} style={{
          background: COLORS.navy, borderRadius: 10, padding: 24,
          border: `1px solid ${tier.color}`,
        }}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: COLORS.midGray, letterSpacing: 1 }}>{lang === "tr" ? "KAMERALAR" : "CAMERAS"}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: tier.color }}>{tier.cameras}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: COLORS.midGray, letterSpacing: 1, marginBottom: 6 }}>{lang === "tr" ? "EKİPMAN" : "EQUIPMENT"}</div>
              <div style={{ fontSize: 14, color: COLORS.white }}>{lang === "tr" ? tier.equipment_tr : tier.equipment_en}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: COLORS.midGray, letterSpacing: 1, marginBottom: 8 }}>{lang === "tr" ? "HEDEF SPORLAR" : "TARGET SPORTS"}</div>
          <div style={{ fontSize: 13, color: "#b0c4d8", lineHeight: 1.8 }}>
            {lang === "tr" ? tier.sports_tr : tier.sports_en}
          </div>
        </div>
      ))}
    </PageWrapper>
  );
}

// ─── CAMERA TECH ──────────────────────────────────────────────────────────────

function CameraTechPage({ lang, current, setCurrent }) {
  const d = t.cameraTech;
  return (
    <PageWrapper lang={lang} current={current} setCurrent={setCurrent}>
      <SectionTitle en={d.title.en} tr={d.title.tr} lang={lang} />
      <BodyText>{lang === "tr" ? d.body.tr : d.body.en}</BodyText>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginBottom: 36 }}>
        {d.techs.map((tech, i) => (
          <div key={i} style={{
            background: COLORS.navy, borderRadius: 12, padding: 24,
            border: `1px solid ${COLORS.blue}`,
            borderLeft: `4px solid ${tech.color}`,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12, color: tech.color }}>{tech.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.white, marginBottom: 8 }}>
              {lang === "tr" ? tech.name_tr : tech.name_en}
            </div>
            <div style={{ fontSize: 13, color: COLORS.midGray, lineHeight: 1.7 }}>
              {lang === "tr" ? tech.detail_tr : tech.detail_en}
            </div>
          </div>
        ))}
      </div>

      {/* Highlight stat */}
      <div style={{
        background: `${COLORS.accent}11`, border: `1px solid ${COLORS.accent}44`,
        borderRadius: 10, padding: 24, textAlign: "center",
      }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: COLORS.accent, lineHeight: 1 }}>2,600</div>
        <div style={{ fontSize: 16, color: COLORS.white, marginTop: 8, fontWeight: 600 }}>
          {lang === "tr" ? "Saniyede Kare (fps)" : "Frames Per Second"}
        </div>
        <div style={{ fontSize: 13, color: COLORS.midGray, marginTop: 6 }}>
          {lang === "tr"
            ? "Ultra Ağır Çekim kameralar — zaferin her milisaniyesini yeniden tanımlar"
            : "Ultra Slow-Motion cameras — redefining every millisecond of victory"}
        </div>
      </div>
    </PageWrapper>
  );
}

// ─── IBC ──────────────────────────────────────────────────────────────────────

function IBCPage({ lang, current, setCurrent }) {
  const d = t.ibc;
  const [activeZone, setActiveZone] = useState(null);
  return (
    <PageWrapper lang={lang} current={current} setCurrent={setCurrent}>
      <SectionTitle en={d.title.en} tr={d.title.tr} lang={lang} />
      <BodyText>{lang === "tr" ? d.body.tr : d.body.en}</BodyText>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* IBC diagram */}
        <div style={{ background: COLORS.navy, borderRadius: 12, padding: 20, border: `1px solid ${COLORS.blue}` }}>
          <div style={{ fontSize: 11, color: COLORS.midGray, letterSpacing: 2, marginBottom: 16 }}>
            {lang === "tr" ? "IBC MİMARİSİ" : "IBC ARCHITECTURE"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Sports venues box */}
            <div style={{
              textAlign: "center", padding: 10, borderRadius: 8,
              background: COLORS.dark, border: `1px solid ${COLORS.blue}`,
              fontSize: 12, color: COLORS.midGray,
            }}>
              {lang === "tr" ? "Spor Tesisleri · OB Van'lar & Flypack'ler" : "Sports Venues · OB Vans & Flypacks"}
            </div>
            <div style={{ textAlign: "center", color: COLORS.midGray, fontSize: 16 }}>↓</div>

            {/* Istanbul IBC container */}
            <div style={{
              border: `2px dashed ${COLORS.lightBlue}44`, borderRadius: 10, padding: 12,
            }}>
              <div style={{ fontSize: 10, color: COLORS.lightBlue, letterSpacing: 1, marginBottom: 8, textAlign: "center" }}>
                ISTANBUL IBC (ON-SITE)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {d.zones.filter(z => z.num !== "3").map((zone, i) => (
                  <div key={i}
                    onClick={() => setActiveZone(activeZone === i ? null : i)}
                    style={{
                      padding: "8px 10px", borderRadius: 6, cursor: "pointer",
                      background: activeZone === i ? `${zone.color}22` : COLORS.dark,
                      border: `1px solid ${activeZone === i ? zone.color : COLORS.navy}`,
                      transition: "all 0.15s",
                    }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: zone.color }}>Zone {zone.num}</div>
                    <div style={{ fontSize: 11, color: COLORS.white }}>
                      {lang === "tr" ? zone.name_tr : zone.name_en}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <div style={{ textAlign: "center", color: COLORS.midGray, fontSize: 14 }}>↓</div>
              <div style={{ textAlign: "center", color: COLORS.midGray, fontSize: 14 }}>↓</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <div style={{ padding: "8px 10px", borderRadius: 6, background: `${COLORS.teal}18`, border: `1px solid ${COLORS.teal}44`, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: COLORS.teal }}>Zone 3</div>
                <div style={{ fontSize: 11, color: COLORS.white }}>{lang === "tr" ? "Uzak Merkezler" : "Remote Hubs"}</div>
              </div>
              <div style={{ padding: "8px 10px", borderRadius: 6, background: `${COLORS.gold}18`, border: `1px solid ${COLORS.gold}44`, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: COLORS.gold }}>{lang === "tr" ? "Küresel" : "Global"}</div>
                <div style={{ fontSize: 11, color: COLORS.white }}>RHBs + OTT</div>
              </div>
            </div>
          </div>
        </div>

        {/* Zone detail */}
        <div>
          {activeZone !== null ? (
            <div style={{
              background: COLORS.navy, borderRadius: 12, padding: 20,
              border: `1px solid ${d.zones.filter(z => z.num !== "3")[activeZone]?.color || COLORS.blue}`,
              height: "100%",
            }}>
              <div style={{ fontSize: 11, color: COLORS.midGray, letterSpacing: 1, marginBottom: 12 }}>
                {lang === "tr" ? "BÖLGE DETAYı" : "ZONE DETAIL"}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: d.zones.filter(z => z.num !== "3")[activeZone]?.color, marginBottom: 12 }}>
                {lang === "tr" ? d.zones.filter(z => z.num !== "3")[activeZone]?.name_tr : d.zones.filter(z => z.num !== "3")[activeZone]?.name_en}
              </div>
              <div style={{ fontSize: 14, color: "#b0c4d8", lineHeight: 1.8 }}>
                {lang === "tr" ? d.zones.filter(z => z.num !== "3")[activeZone]?.desc_tr : d.zones.filter(z => z.num !== "3")[activeZone]?.desc_en}
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              {d.zones.map((zone, i) => (
                <div key={i} style={{
                  background: COLORS.navy, borderRadius: 8, padding: 14,
                  border: `1px solid ${COLORS.navy}`, borderLeft: `3px solid ${zone.color}`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: zone.color, marginBottom: 4 }}>
                    Zone {zone.num} — {lang === "tr" ? zone.name_tr : zone.name_en}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.midGray, lineHeight: 1.5 }}>
                    {lang === "tr" ? zone.desc_tr : zone.desc_en}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12, marginTop: 32,
      }}>
        {[
          { value: "1,500–2,500", label_en: "m² IBC Footprint", label_tr: "m² IBC Alanı" },
          { value: "5", label_en: "Functional Zones", label_tr: "Fonksiyonel Bölge" },
          { value: "99.99%", label_en: "Uptime Goal", label_tr: "Kesintisizlik Hedefi" },
        ].map((s, i) => (
          <StatCard key={i} value={s.value}
            label={lang === "tr" ? s.label_tr : s.label_en}
            color={[COLORS.lightBlue, COLORS.teal, COLORS.accent][i]} />
        ))}
      </div>
    </PageWrapper>
  );
}

// ─── DIGITAL ──────────────────────────────────────────────────────────────────

function DigitalPage({ lang, current, setCurrent }) {
  const d = t.digital;
  return (
    <PageWrapper lang={lang} current={current} setCurrent={setCurrent}>
      <SectionTitle en={d.title.en} tr={d.title.tr} lang={lang} />
      <BodyText>{lang === "tr" ? d.body.tr : d.body.en}</BodyText>

      {/* Format visual */}
      <div style={{
        display: "flex", gap: 24, alignItems: "center", justifyContent: "center",
        flexWrap: "wrap", padding: "32px 24px",
        background: COLORS.navy, borderRadius: 12,
        border: `1px solid ${COLORS.blue}`, marginBottom: 32,
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 90, height: 54, background: COLORS.dark,
            border: `2px solid ${COLORS.lightBlue}`, borderRadius: 6,
            margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ fontSize: 11, color: COLORS.lightBlue, fontWeight: 700 }}>16:9</div>
          </div>
          <div style={{ fontSize: 12, color: COLORS.white, fontWeight: 600 }}>1080p HDR</div>
          <div style={{ fontSize: 10, color: COLORS.midGray }}>Linear TV</div>
        </div>

        <div style={{ fontSize: 24, color: COLORS.midGray }}>→</div>

        <div style={{
          background: `${COLORS.accent}18`, border: `1px solid ${COLORS.accent}`,
          borderRadius: 8, padding: "12px 20px", textAlign: "center",
        }}>
          <div style={{ fontSize: 11, color: COLORS.accent, fontWeight: 700, letterSpacing: 1 }}>CONTENT FACTORY</div>
          <div style={{ fontSize: 12, color: COLORS.midGray, marginTop: 4 }}>AI Auto-Frame & Crop</div>
          <div style={{ fontSize: 11, color: COLORS.midGray }}>+ Digital Producers</div>
        </div>

        <div style={{ fontSize: 24, color: COLORS.midGray }}>→</div>

        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 34, height: 60, background: COLORS.dark,
            border: `2px solid ${COLORS.accent}`, borderRadius: 6,
            margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ fontSize: 9, color: COLORS.accent, fontWeight: 700 }}>9:16</div>
          </div>
          <div style={{ fontSize: 12, color: COLORS.white, fontWeight: 600 }}>Native Vertical</div>
          <div style={{ fontSize: 10, color: COLORS.midGray }}>Social Media</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {["TikTok", "Instagram Reels", "YouTube Shorts"].map(p => (
            <div key={p} style={{
              padding: "4px 12px", borderRadius: 12, fontSize: 11,
              background: `${COLORS.gold}18`, border: `1px solid ${COLORS.gold}44`,
              color: COLORS.gold,
            }}>{p}</div>
          ))}
        </div>
      </div>

      {/* AI + Human workflow */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          {
            icon: "◈", title_en: "AI Smart Logging", title_tr: "YZ Akıllı Günlükleme",
            desc_en: "Automated ingest instantly tags key plays, official records, and milestones to generate rapid highlights.",
            desc_tr: "Otomatik sistem tesis yayınlarını alır, önemli oyunları, rekorları ve kilometre taşlarını anında etiketler.",
            color: COLORS.lightBlue,
          },
          {
            icon: "◉", title_en: "Human Digital Producers", title_tr: "İnsan Dijital Yapımcılar",
            desc_en: "Proactively hunting for 'Hidden Moments' — raw emotions, behind-the-scenes, athlete reactions that AI can't replicate.",
            desc_tr: "Yapay zekanın kopyalayamayacağı 'Gizli Anların' peşine düşen ekip — duygular, kamera arkası, sporcu tepkileri.",
            color: COLORS.teal,
          },
        ].map((item, i) => (
          <div key={i} style={{
            background: COLORS.navy, borderRadius: 10, padding: 20,
            border: `1px solid ${COLORS.blue}`, borderTop: `3px solid ${item.color}`,
          }}>
            <div style={{ fontSize: 24, color: item.color, marginBottom: 10 }}>{item.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.white, marginBottom: 8 }}>
              {lang === "tr" ? item.title_tr : item.title_en}
            </div>
            <div style={{ fontSize: 13, color: COLORS.midGray, lineHeight: 1.6 }}>
              {lang === "tr" ? item.desc_tr : item.desc_en}
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}

// ─── LEGACY ───────────────────────────────────────────────────────────────────

function LegacyPage({ lang, current, setCurrent }) {
  const d = t.legacy;
  return (
    <PageWrapper lang={lang} current={current} setCurrent={setCurrent}>
      <SectionTitle en={d.title.en} tr={d.title.tr} lang={lang} />
      <BodyText>{lang === "tr" ? d.body.tr : d.body.en}</BodyText>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 36 }}>
        {d.metrics.map((m, i) => (
          <StatCard key={i} value={m.value}
            label={lang === "tr" ? m.label_tr : m.label_en}
            color={m.color} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[
          {
            title_en: "TRT Strategic Alliance",
            title_tr: "TRT Stratejik Ortaklığı",
            desc_en: "Deployment of local TRT OB units + elite operators united with our tier-one international experts.",
            desc_tr: "Yerel TRT OB birimlerinin konuşlandırılması + seçkin operatörlerin birinci sınıf uluslararası uzmanlarımızla birleşimi.",
            color: COLORS.lightBlue,
          },
          {
            title_en: "Broadcast Legacy Program",
            title_tr: "Yayın Mirası Programı",
            desc_en: "Turkish university students integrated into technical assistance roles — building the next generation of broadcast professionals for 2036.",
            desc_tr: "Türk üniversite öğrencileri teknik asistanlık rollerinde — 2036 için bir sonraki yayın profesyonelleri neslini inşa ediyor.",
            color: COLORS.teal,
          },
          {
            title_en: "Green Hub IBC",
            title_tr: "Yeşil Merkez IBC",
            desc_en: "Remote editorial workflows drastically reduce Istanbul's footprint — estimated 40% carbon reduction vs traditional models.",
            desc_tr: "Uzak editoryal iş akışları İstanbul'un ayak izini büyük ölçüde azaltır — geleneksel modellere göre tahmini %40 karbon azaltımı.",
            color: COLORS.green,
          },
          {
            title_en: "The 2036 Olympic Vision",
            title_tr: "2036 Olimpiyat Vizyonu",
            desc_en: "Every decision in this proposal is designed to lay the definitive foundation for Turkey's bid to host the Olympic Games.",
            desc_tr: "Bu teklifte alınan her karar, Türkiye'nin Olimpiyat Oyunlarına ev sahipliği yapma adaylığının kesin temelini atmak üzere tasarlanmıştır.",
            color: COLORS.gold,
          },
        ].map((item, i) => (
          <div key={i} style={{
            background: COLORS.navy, borderRadius: 10, padding: 20,
            border: `1px solid ${COLORS.blue}`, borderLeft: `4px solid ${item.color}`,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: item.color, marginBottom: 8 }}>
              {lang === "tr" ? item.title_tr : item.title_en}
            </div>
            <div style={{ fontSize: 13, color: COLORS.midGray, lineHeight: 1.6 }}>
              {lang === "tr" ? item.desc_tr : item.desc_en}
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}

// ─── FLEET & GANTT ────────────────────────────────────────────────────────────

const obVans = [
  { name: "OB 1 · Athletics", setup: [9, 11], rehearsal: [12, 13], live: [14, 27], turnaround: [] },
  { name: "OB 2 · Table Tennis", setup: [9, 11], rehearsal: [12, 13], live: [14, 22], turnaround: [] },
  { name: "OB 3 · Weightlifting→3x3 Basket", setup: [9, 10], rehearsal: [11, 12], live: [13, 17], turnaround: [18, 19], live2: [20, 26] },
  { name: "OB 4 · Diving/Swimming", setup: [9, 11], rehearsal: [12, 13], live: [14, 26], turnaround: [] },
  { name: "OB 5 · Art.Swim/Wrestling", setup: [9, 11], rehearsal: [12, 12], live: [13, 25], turnaround: [] },
  { name: "OB 6 · Canoe Sprint", setup: [10, 12], rehearsal: [13, 13], live: [14, 23], turnaround: [] },
  { name: "OB 7 · Gymnastics", setup: [9, 11], rehearsal: [12, 13], live: [14, 25], turnaround: [] },
  { name: "OB 8 · Opening/Closing Cer.", setup: [9, 11], rehearsal: [12, 14], live: [15, 16], turnaround: [17, 23], live2: [26, 28] },
  { name: "OB 9 · Volleyball/Rugby 7s", setup: [11, 12], rehearsal: [13, 13], live: [14, 27], turnaround: [] },
  { name: "OB 10 · Archery/Taekwondo", setup: [11, 12], rehearsal: [13, 13], live: [14, 24], turnaround: [] },
  { name: "OB 11 · Boxing/Squash", setup: [12, 13], rehearsal: [14, 14], live: [15, 26], turnaround: [] },
  { name: "OB 12 · Fencing/Padel", setup: [12, 13], rehearsal: [14, 14], live: [15, 25], turnaround: [] },
  { name: "OB 13 · Judo/Muaythai", setup: [11, 12], rehearsal: [13, 13], live: [14, 25], turnaround: [] },
  { name: "OB 14 · Karate→Mod.Pentathlon", setup: [10, 11], rehearsal: [12, 12], live: [13, 18], turnaround: [19, 20], live2: [21, 26] },
  { name: "OB 15 · Shooting", setup: [13, 14], rehearsal: [15, 15], live: [16, 26], turnaround: [] },
  { name: "OB 16 · Triathlon/Beach Volley", setup: [11, 12], rehearsal: [13, 13], live: [14, 20], turnaround: [21, 22], live2: [23, 27] },
  { name: "OB 17 · SportClimbing→Badminton", setup: [10, 11], rehearsal: [12, 12], live: [13, 17], turnaround: [18, 18], live2: [19, 27] },
];

const GANTT_COLORS = {
  setup: "#1d9e75",
  rehearsal: "#f0a500",
  live: COLORS.accent,
  turnaround: "#7f5af0",
  off: COLORS.dark,
};

function FleetPage({ lang, current, setCurrent }) {
  const days = Array.from({ length: 20 }, (_, i) => i + 9);
  const cellW = 30;

  const getPhase = (van, day) => {
    if (van.setup && day >= van.setup[0] && day <= van.setup[1]) return "setup";
    if (van.rehearsal && day >= van.rehearsal[0] && day <= van.rehearsal[1]) return "rehearsal";
    if (van.live && day >= van.live[0] && day <= van.live[1]) return "live";
    if (van.turnaround && van.turnaround.length && day >= van.turnaround[0] && day <= van.turnaround[1]) return "turnaround";
    if (van.live2 && day >= van.live2[0] && day <= van.live2[1]) return "live";
    return "off";
  };

  const peakDays = [15, 16, 17, 18, 19];

  return (
    <PageWrapper lang={lang} current={current} setCurrent={setCurrent}>
      <SectionTitle en={t.fleet.title.en} tr={t.fleet.title.tr} lang={lang} />
      <BodyText>{lang === "tr" ? t.fleet.body.tr : t.fleet.body.en}</BodyText>

      {/* Operational stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 32 }}>
        {[
          { value: "15", label_en: "Peak concurrent feeds", label_tr: "Eşzamanlı zirve yayın" },
          { value: "17", label_en: "Premium OB Vans", label_tr: "Premium OB Van" },
          { value: "30+", label_en: "Sports covered", label_tr: "Kapsanan spor" },
        ].map((s, i) => (
          <StatCard key={i} value={s.value}
            label={lang === "tr" ? s.label_tr : s.label_en}
            color={[COLORS.accent, COLORS.lightBlue, COLORS.gold][i]} />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries({ setup: lang === "tr" ? "Kurulum" : "Setup", rehearsal: lang === "tr" ? "Prova" : "Rehearsal", live: "LIVE", turnaround: lang === "tr" ? "Geçiş" : "Turnaround" }).map(([k, label]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: COLORS.midGray }}>
            <div style={{ width: 14, height: 10, borderRadius: 2, background: GANTT_COLORS[k] }} />
            {label}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: COLORS.accent }}>
          <div style={{ width: 2, height: 14, background: COLORS.accent }} />
          {lang === "tr" ? "Zirve Aşaması" : "Peak Phase"}
        </div>
      </div>

      {/* Gantt chart */}
      <div style={{ overflowX: "auto", background: COLORS.navy, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.blue}` }}>
        <div style={{ minWidth: 720 }}>
          {/* Header */}
          <div style={{ display: "flex", marginBottom: 8 }}>
            <div style={{ width: 200, flexShrink: 0 }} />
            {days.map(d => (
              <div key={d} style={{
                width: cellW, textAlign: "center", fontSize: 10, color: COLORS.midGray,
                background: peakDays.includes(d) ? `${COLORS.accent}11` : "transparent",
                borderLeft: peakDays.includes(d) ? `1px solid ${COLORS.accent}33` : "none",
                fontWeight: peakDays.includes(d) ? 700 : 400,
                color: peakDays.includes(d) ? COLORS.accent : COLORS.midGray,
              }}>
                {d}
              </div>
            ))}
          </div>
          {/* Rows */}
          {obVans.map((van, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", marginBottom: 3,
            }}>
              <div style={{ width: 200, flexShrink: 0, fontSize: 11, color: COLORS.midGray, paddingRight: 8, textAlign: "right", lineHeight: 1.3 }}>
                {van.name}
              </div>
              {days.map(d => {
                const phase = getPhase(van, d);
                return (
                  <div key={d} style={{
                    width: cellW, height: 18, flexShrink: 0,
                    background: phase === "off" ? "transparent" : GANTT_COLORS[phase],
                    borderLeft: peakDays.includes(d) ? `1px solid ${COLORS.accent}22` : "none",
                    opacity: phase === "off" ? 0.1 : 1,
                    borderRadius: 2,
                  }} />
                );
              })}
            </div>
          ))}
          {/* Date label */}
          <div style={{ display: "flex", marginTop: 8 }}>
            <div style={{ width: 200, flexShrink: 0 }} />
            {days.map((d, i) => (
              i === 0 || i === 6 || i === 19 ? (
                <div key={d} style={{ width: cellW, fontSize: 9, color: COLORS.midGray, textAlign: "center" }}>Jun {d}</div>
              ) : <div key={d} style={{ width: cellW }} />
            ))}
          </div>
        </div>
      </div>

      {/* Smart turnaround examples */}
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 11, color: COLORS.midGray, letterSpacing: 2, marginBottom: 12 }}>
          {lang === "tr" ? "AKILLI GEÇİŞ STRATEJİSİ — ÖRNEKLER" : "SMART TURNAROUND STRATEGY — EXAMPLES"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { van: "OB 3", from_en: "Weightlifting", from_tr: "Halter", to_en: "3×3 Basketball", to_tr: "3×3 Basketbol" },
            { van: "OB 14", from_en: "Karate", from_tr: "Karate", to_en: "Modern Pentathlon", to_tr: "Modern Pentatlon" },
            { van: "OB 17", from_en: "Sport Climbing", from_tr: "Spor Tırmanışı", to_en: "Badminton", to_tr: "Badminton" },
          ].map((ex, i) => (
            <div key={i} style={{
              background: COLORS.navy, borderRadius: 8, padding: 14,
              border: `1px solid ${COLORS.blue}`, display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                background: COLORS.lightBlue, color: "#fff",
                borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>{ex.van}</div>
              <div style={{ fontSize: 12, color: COLORS.white }}>{lang === "tr" ? ex.from_tr : ex.from_en}</div>
              <div style={{ color: "#7f5af0", fontSize: 16 }}>→</div>
              <div style={{ fontSize: 12, color: COLORS.white }}>{lang === "tr" ? ex.to_tr : ex.to_en}</div>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}

// ─── TIMELINE ─────────────────────────────────────────────────────────────────

function TimelinePage({ lang, current, setCurrent }) {
  const d = t.timeline;
  const [active, setActive] = useState(null);
  return (
    <PageWrapper lang={lang} current={current} setCurrent={setCurrent}>
      <SectionTitle en={d.title.en} tr={d.title.tr} lang={lang} />

      <div style={{ position: "relative", paddingLeft: 40, marginTop: 32 }}>
        <div style={{
          position: "absolute", left: 18, top: 0, bottom: 0, width: 2,
          background: `linear-gradient(to bottom, ${COLORS.accent}, ${COLORS.gold})`,
        }} />
        {d.milestones.map((m, i) => (
          <div key={i} onClick={() => setActive(active === i ? null : i)}
            style={{ position: "relative", marginBottom: 28, cursor: "pointer" }}>
            <div style={{
              position: "absolute", left: -31, top: 6,
              width: 14, height: 14, borderRadius: "50%",
              background: m.color, border: `3px solid ${COLORS.dark}`,
              zIndex: 1,
            }} />
            <div style={{
              background: active === i ? `${m.color}18` : COLORS.navy,
              border: `1px solid ${active === i ? m.color : COLORS.blue}`,
              borderRadius: 10, padding: "14px 18px",
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: m.color, fontWeight: 700, letterSpacing: 1 }}>
                  {lang === "tr" ? m.date_tr : m.date}
                </div>
                <div style={{ fontSize: 11, color: COLORS.midGray }}>{active === i ? "▲" : "▼"}</div>
              </div>
              <div style={{ fontSize: 15, color: COLORS.white, fontWeight: 600, marginTop: 4 }}>
                {lang === "tr" ? m.label_tr : m.label_en}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}

// ─── FINANCIAL ────────────────────────────────────────────────────────────────

function FinancialPage({ lang, current, setCurrent }) {
  const d = t.financial;
  const total = d.breakdown.reduce((s, b) => s + b.pct, 0);
  const [hovered, setHovered] = useState(null);
  return (
    <PageWrapper lang={lang} current={current} setCurrent={setCurrent}>
      <SectionTitle en={d.title.en} tr={d.title.tr} lang={lang} />
      <BodyText>{lang === "tr" ? d.body.tr : d.body.en}</BodyText>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        {/* Bar chart */}
        <div>
          <div style={{ fontSize: 11, color: COLORS.midGray, letterSpacing: 2, marginBottom: 20 }}>
            {lang === "tr" ? "MALİYET DAĞILIMI" : "COST DISTRIBUTION"}
          </div>
          {d.breakdown.map((item, i) => (
            <div key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ marginBottom: 14, cursor: "default" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 13, color: hovered === i ? COLORS.white : "#b0c4d8" }}>
                  {lang === "tr" ? item.label_tr : item.label_en}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.pct}%</div>
              </div>
              <div style={{ height: 8, background: COLORS.dark, borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: "100%", background: item.color,
                  width: `${(item.pct / total) * 100}%`,
                  borderRadius: 4, transition: "opacity 0.2s",
                  opacity: hovered === null || hovered === i ? 1 : 0.4,
                }} />
              </div>
              <div style={{ fontSize: 11, color: COLORS.midGray, marginTop: 3 }}>
                {lang === "tr" ? `%${item.pct - 5}–%${item.pct + 5} aralığı` : `${item.pct - 5}–${item.pct + 5}% range`}
              </div>
            </div>
          ))}
        </div>

        {/* Key points */}
        <div>
          <div style={{ fontSize: 11, color: COLORS.midGray, letterSpacing: 2, marginBottom: 20 }}>
            {lang === "tr" ? "ÇÖZÜMÜN KAPSAMI" : "SOLUTION SCOPE"}
          </div>
          {[
            { en: "Multi-tier venue acquisition across 30+ sports", tr: "30+ sporda çok katmanlı tesis yayını" },
            { en: "Semi-Conventional IBC operation", tr: "Yarı Geleneksel IBC operasyonu" },
            { en: "Digital content generation & social media pipeline", tr: "Dijital içerik üretimi & sosyal medya hattı" },
            { en: "6-month Promotional Content Taskforce", tr: "6 aylık Tanıtım İçeriği Görev Gücü" },
            { en: "Full Opening & Closing Ceremonies production", tr: "Açılış & Kapanış Törenleri tam üretimi" },
            { en: "Optional UHD 4K upgrade for ceremonies", tr: "Törenler için isteğe bağlı UHD 4K yükseltme" },
            { en: "Comprehensive RHB services & rate card", tr: "Kapsamlı RHB hizmetleri & tarife" },
            { en: "Broadcast Legacy Program for Turkey", tr: "Türkiye için Yayın Mirası Programı" },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, padding: "8px 0",
              borderBottom: `1px solid ${COLORS.navy}`,
            }}>
              <div style={{ color: COLORS.teal, marginTop: 2, flexShrink: 0 }}>✓</div>
              <div style={{ fontSize: 13, color: "#b0c4d8", lineHeight: 1.5 }}>
                {lang === "tr" ? item.tr : item.en}
              </div>
            </div>
          ))}

          <div style={{
            marginTop: 20, padding: 16, background: `${COLORS.gold}11`,
            border: `1px solid ${COLORS.gold}44`, borderRadius: 8,
            fontSize: 13, color: "#b0c4d8", lineHeight: 1.6,
            fontStyle: "italic",
          }}>
            {lang === "tr"
              ? "Detaylı finansal döküm tablosu, UHD Törenleri yükseltme seçeneği dahil olmak üzere ayrı bir gizli ek olarak sunulmuştur."
              : "A highly detailed financial breakdown spreadsheet, including the UHD Ceremonies upgrade option, is provided as a separate confidential annex."}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────

function App() {
  const [current, setCurrent] = useState("home");
  const [language, setLanguage] = useState("en");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [current]);

  const pageProps = { lang: language, current, setCurrent };

  const renderPage = () => {
    switch (current) {
      case "home": return <HomePage setCurrent={setCurrent} language={language} />;
      case "vision": return <VisionPage {...pageProps} />;
      case "track-record": return <TrackRecordPage {...pageProps} />;
      case "local-branch": return <LocalBranchPage {...pageProps} />;
      case "architecture": return <ArchitecturePage {...pageProps} />;
      case "camera-tech": return <CameraTechPage {...pageProps} />;
      case "ibc": return <IBCPage {...pageProps} />;
      case "digital": return <DigitalPage {...pageProps} />;
      case "legacy": return <LegacyPage {...pageProps} />;
      case "fleet": return <FleetPage {...pageProps} />;
      case "timeline": return <TimelinePage {...pageProps} />;
      case "financial": return <FinancialPage {...pageProps} />;
      default: return <HomePage setCurrent={setCurrent} language={language} />;
    }
  };

  return (
    <div style={{ background: "#0a1e33", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <NavBar
        current={current} setCurrent={setCurrent}
        language={language} setLanguage={setLanguage}
        menuOpen={menuOpen} setMenuOpen={setMenuOpen}
      />
      {renderPage()}
    </div>
  );
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);

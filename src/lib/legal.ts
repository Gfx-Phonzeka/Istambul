// [EXEMPLO] Placeholder legal texts. In stage 2 these become editable pages in the backoffice.
export const LEGAL_DOCS = {
  terms: {
    titleKey: "legal.terms",
    en: [
      "These example terms govern access to the Istanbul 2027 Right Holders Portal (the “Portal”), operated by Medialuso as Host Broadcaster of the 4th European Games.",
      "Access is personal and limited to approved users. You must not share your credentials or redistribute information from the Portal outside your organisation without authorisation.",
      "Information in the Portal is provided to help Right Holders and partners prepare their coverage. Worldwide signal distribution is handled by the EBU; Medialuso’s responsibility ends with making the signal available.",
      "Medialuso may suspend access in case of misuse of the Portal or of its materials.",
    ],
    tr: [
      "Bu örnek koşullar, 4. Avrupa Oyunları’nın Ev Sahibi Yayıncısı Medialuso tarafından işletilen Istanbul 2027 Yayın Hakkı Sahipleri Portalı’na (“Portal”) erişimi düzenler.",
      "Erişim kişiseldir ve onaylı kullanıcılarla sınırlıdır. Giriş bilgilerinizi paylaşmamalı ve Portal’daki bilgileri izinsiz olarak kuruluşunuz dışına dağıtmamalısınız.",
      "Portal’daki bilgiler, Yayın Hakkı Sahiplerinin ve ortakların yayın hazırlıklarına yardımcı olmak için sunulur. Sinyalin dünya çapında dağıtımı EBU tarafından yapılır; Medialuso’nun sorumluluğu sinyalin kullanıma sunulmasıyla sona erer.",
      "Portal’ın veya materyallerinin kötüye kullanılması durumunda Medialuso erişimi askıya alabilir.",
    ],
  },
  privacy: {
    titleKey: "legal.privacy",
    en: [
      "Example privacy notice. We process the personal data you provide at registration (name, professional email, organisation, country, job title, phone) to manage your access to the Portal.",
      "We also record sign-ins and downloads for security and to measure the use of the Portal.",
      "You can update your details from your profile, ask for a copy of your data, or ask for your account to be deleted at any time. Requests are handled by the Portal administrators.",
      "Data is stored in the European Union.",
    ],
    tr: [
      "Örnek gizlilik bildirimi. Kayıt sırasında verdiğiniz kişisel verileri (ad, kurumsal e-posta, kuruluş, ülke, görev, telefon) Portal’a erişiminizi yönetmek için işliyoruz.",
      "Güvenlik ve Portal kullanımını ölçmek amacıyla girişleri ve indirmeleri de kaydediyoruz.",
      "Bilgilerinizi profilinizden güncelleyebilir, verilerinizin bir kopyasını isteyebilir veya hesabınızın silinmesini istediğiniz zaman talep edebilirsiniz. Talepler Portal yöneticileri tarafından işleme alınır.",
      "Veriler Avrupa Birliği’nde saklanır.",
    ],
  },
  material: {
    titleKey: "legal.material",
    en: [
      "Example material usage terms. Graphics, bumpers, curtains, promos and music in the Media Hub may only be used by Right Holders in their coverage of the Games, within their licensed territory.",
      "Materials must not be altered in a way that misrepresents the Games or their partners.",
      "You will be asked to accept these terms before your first download. Your acceptance is recorded.",
    ],
    tr: [
      "Örnek materyal kullanım koşulları. Medya Merkezi’ndeki grafikler, bumper’lar, perdeler, tanıtımlar ve müzik yalnızca Yayın Hakkı Sahipleri tarafından, lisanslı bölgelerinde Oyunların yayınında kullanılabilir.",
      "Materyaller, Oyunları veya ortaklarını yanlış yansıtacak şekilde değiştirilmemelidir.",
      "İlk indirmenizden önce bu koşulları kabul etmeniz istenecektir. Kabulünüz kaydedilir.",
    ],
  },
} as const;

export type LegalSlug = keyof typeof LEGAL_DOCS;

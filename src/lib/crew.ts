// Crew Ops (phase A): personal sheet, functions, teams, participation. Shared by Istanbul and Lima.
import type { Locale } from "@/lib/event";

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;
export const COLLAB_TYPES = ["freelancer", "employee", "group_company"] as const;
export const TEAM_KINDS = ["technical", "operational", "ibc", "bvm", "management", "other"] as const;
export type CollabType = (typeof COLLAB_TYPES)[number];
export type TeamKind = (typeof TEAM_KINDS)[number];

/** Fields of the personal sheet (filled in by the person). New fields (Organising Committee matrix) go in EXTRA_FIELDS. */
export const SHEET_FIELDS = [
  { key: "nationality", type: "text" },
  { key: "date_of_birth", type: "date" },
  { key: "gender", type: "select", options: ["female", "male", "other"] },
  { key: "id_type", type: "select", options: ["passport", "national_id"] },
  { key: "id_number", type: "text" },
  { key: "id_expiry", type: "date" },
  { key: "emergency_name", type: "text" },
  { key: "emergency_phone", type: "tel" },
  { key: "polo_size", type: "select", options: SIZES },
  { key: "hoodie_size", type: "select", options: SIZES },
  { key: "languages", type: "text" },
] as const;
/** Extra fields stored in crew_records.extra (to be filled in when the Organising Committee matrix arrives). */
export const EXTRA_FIELDS: { key: string; label: Record<"en" | "es" | "pt" | "tr", string>; type: "text" | "date" }[] = [];
export const REQUIRED_SHEET = ["nationality", "date_of_birth", "id_type", "id_number", "id_expiry", "emergency_name", "emergency_phone", "polo_size", "hoodie_size"] as const;

export interface CrewRecord {
  profile_id: string; nationality: string | null; date_of_birth: string | null; gender: string | null; id_type: string | null;
  id_number: string | null; id_expiry: string | null; emergency_name: string | null; emergency_phone: string | null;
  polo_size: string | null; hoodie_size: string | null; languages: string | null; extra: Record<string, string>; photo_path: string | null;
  updated_at: string;
}

/** Share of the required data already filled in (photo included), 0–100. */
export function completeness(r: Partial<CrewRecord> | null | undefined): number {
  const total = REQUIRED_SHEET.length + 1;
  if (!r) return 0;
  const done = REQUIRED_SHEET.filter((k) => r[k]).length + (r.photo_path ? 1 : 0);
  return Math.round((done / total) * 100);
}

type Dict = Record<string, string>;
const L: Record<"en" | "es" | "pt" | "tr", Dict> = {
  en: {
    mySheet: "My crew sheet", mySheetIntro: "Fill in your details for accreditation, uniform and logistics. Only you and the crew coordination can see them.",
    personal: "Personal details", documents: "Identity document", emergency: "Emergency contact", uniform: "Uniform", photo: "Accreditation photo",
    photoHelp: "Recent passport-style photo: plain light background, face centred, JPG or PNG, up to 5 MB.", photoUpload: "Upload photo", photoChange: "Change photo",
    nationality: "Nationality", date_of_birth: "Date of birth", gender: "Gender", female: "Female", male: "Male", other: "Other",
    id_type: "Document type", passport: "Passport", national_id: "National ID card", id_number: "Document number", id_expiry: "Expiry date",
    emergency_name: "Name", emergency_phone: "Phone", polo_size: "Polo shirt size", hoodie_size: "Hoodie size", languages: "Languages you speak",
    save: "Save", saved: "Saved.", error: "Could not save. Please try again.", choose: "Choose…", complete: "{n}% complete",
    myRole: "My role in the Games", function: "Function", position: "Position", teams: "Teams", type: "Type", company: "Company",
    notAssigned: "Not assigned yet by the crew coordination.",
    crewOps: "Crew Ops", crewIntro: "Production team: functions, teams and personal data for accreditation and logistics.",
    people: "People", allTeams: "All teams", allFunctions: "All functions", missing: "Missing data only", filter: "Filter", search: "Search name or email",
    name: "Name", data: "Data", edit: "Edit", noPeople: "No one matches these filters.", export: "Export to Excel",
    exportFull: "Full list", exportContacts: "Contacts", exportUniforms: "Uniforms", exportAccreditation: "Accreditation",
    teamsTitle: "Teams", teamsIntro: "Technical teams stay with their production unit; operational (artistic) teams move between units.",
    teamName: "Team name", teamKind: "Kind", addTeam: "Add team", members: "members", delete: "Delete", confirmDelete: "Delete this team? The people stay, only the team goes.",
    technical: "Technical (unit)", operational: "Operational / artistic", ibc: "IBC / MCR", bvm: "BVM", management: "Management",
    functionsTitle: "Functions", area: "Area", addFunction: "Add function", active: "In use",
    freelancer: "Freelancer", employee: "Employee", group_company: "Group company employee",
    participation: "Participation", notes: "Notes", back: "Back to Crew Ops", personalData: "Personal data", lastUpdate: "Last update",
    access: "Access", accessIntro: "Who can manage Crew Ops besides the administrators.", coordination: "Coordination", finance: "Finance", none: "None",
    tabPeople: "People", tabTeams: "Teams", tabFunctions: "Functions", tabAccess: "Access",
  },
  es: {
    mySheet: "Mi ficha", mySheetIntro: "Completa tus datos para la acreditación, el uniforme y la logística. Solo tú y la coordinación del equipo los ven.",
    personal: "Datos personales", documents: "Documento de identidad", emergency: "Contacto de emergencia", uniform: "Uniforme", photo: "Foto para la acreditación",
    photoHelp: "Foto reciente tipo pasaporte: fondo claro y liso, cara centrada, JPG o PNG, hasta 5 MB.", photoUpload: "Subir foto", photoChange: "Cambiar foto",
    nationality: "Nacionalidad", date_of_birth: "Fecha de nacimiento", gender: "Género", female: "Femenino", male: "Masculino", other: "Otro",
    id_type: "Tipo de documento", passport: "Pasaporte", national_id: "Documento nacional de identidad", id_number: "Número de documento", id_expiry: "Fecha de caducidad",
    emergency_name: "Nombre", emergency_phone: "Teléfono", polo_size: "Talla de polo", hoodie_size: "Talla de sudadera", languages: "Idiomas que hablas",
    save: "Guardar", saved: "Guardado.", error: "No se pudo guardar. Inténtalo de nuevo.", choose: "Elegir…", complete: "{n}% completo",
    myRole: "Mi función en los Juegos", function: "Función", position: "Posición", teams: "Equipos", type: "Tipo", company: "Empresa",
    notAssigned: "La coordinación del equipo aún no lo ha asignado.",
    crewOps: "Crew Ops", crewIntro: "Equipo de producción: funciones, equipos y datos personales para acreditación y logística.",
    people: "Personas", allTeams: "Todos los equipos", allFunctions: "Todas las funciones", missing: "Solo con datos pendientes", filter: "Filtrar", search: "Buscar nombre o correo",
    name: "Nombre", data: "Datos", edit: "Editar", noPeople: "Nadie coincide con estos filtros.", export: "Exportar a Excel",
    exportFull: "Lista completa", exportContacts: "Contactos", exportUniforms: "Uniformes", exportAccreditation: "Acreditación",
    teamsTitle: "Equipos", teamsIntro: "Los equipos técnicos se quedan con su unidad de producción; los operativos (artísticos) pasan de una unidad a otra.",
    teamName: "Nombre del equipo", teamKind: "Tipo", addTeam: "Añadir equipo", members: "personas", delete: "Eliminar", confirmDelete: "¿Eliminar este equipo? Las personas se mantienen, solo se elimina el equipo.",
    technical: "Técnico (unidad)", operational: "Operativo / artístico", ibc: "IBC / MCR", bvm: "BVM", management: "Gestión",
    functionsTitle: "Funciones", area: "Área", addFunction: "Añadir función", active: "En uso",
    freelancer: "Freelance", employee: "Empleado", group_company: "Empleado de empresa del grupo",
    participation: "Participación", notes: "Notas", back: "Volver a Crew Ops", personalData: "Datos personales", lastUpdate: "Última actualización",
    access: "Acceso", accessIntro: "Quién puede gestionar Crew Ops además de los administradores.", coordination: "Coordinación", finance: "Finanzas", none: "Ninguno",
    tabPeople: "Personas", tabTeams: "Equipos", tabFunctions: "Funciones", tabAccess: "Acceso",
  },
  pt: {
    mySheet: "Minha ficha", mySheetIntro: "Preencha seus dados para a credencial, o uniforme e a logística. Só você e a coordenação da equipe os veem.",
    personal: "Dados pessoais", documents: "Documento de identidade", emergency: "Contato de emergência", uniform: "Uniforme", photo: "Foto para a credencial",
    photoHelp: "Foto recente tipo passaporte: fundo claro e liso, rosto centralizado, JPG ou PNG, até 5 MB.", photoUpload: "Enviar foto", photoChange: "Trocar foto",
    nationality: "Nacionalidade", date_of_birth: "Data de nascimento", gender: "Gênero", female: "Feminino", male: "Masculino", other: "Outro",
    id_type: "Tipo de documento", passport: "Passaporte", national_id: "Documento nacional de identidade", id_number: "Número do documento", id_expiry: "Data de validade",
    emergency_name: "Nome", emergency_phone: "Telefone", polo_size: "Tamanho da camisa polo", hoodie_size: "Tamanho do moletom", languages: "Idiomas que você fala",
    save: "Salvar", saved: "Salvo.", error: "Não foi possível salvar. Tente de novo.", choose: "Escolher…", complete: "{n}% completo",
    myRole: "Minha função nos Jogos", function: "Função", position: "Posição", teams: "Equipes", type: "Tipo", company: "Empresa",
    notAssigned: "A coordenação da equipe ainda não atribuiu.",
    crewOps: "Crew Ops", crewIntro: "Equipe de produção: funções, equipes e dados pessoais para credenciamento e logística.",
    people: "Pessoas", allTeams: "Todas as equipes", allFunctions: "Todas as funções", missing: "Só com dados pendentes", filter: "Filtrar", search: "Buscar nome ou email",
    name: "Nome", data: "Dados", edit: "Editar", noPeople: "Ninguém corresponde a estes filtros.", export: "Exportar para Excel",
    exportFull: "Lista completa", exportContacts: "Contatos", exportUniforms: "Uniformes", exportAccreditation: "Credenciamento",
    teamsTitle: "Equipes", teamsIntro: "As equipes técnicas ficam com sua unidade de produção; as operacionais (artísticas) passam de uma unidade para outra.",
    teamName: "Nome da equipe", teamKind: "Tipo", addTeam: "Adicionar equipe", members: "pessoas", delete: "Excluir", confirmDelete: "Excluir esta equipe? As pessoas continuam, só a equipe é excluída.",
    technical: "Técnica (unidade)", operational: "Operacional / artística", ibc: "IBC / MCR", bvm: "BVM", management: "Gestão",
    functionsTitle: "Funções", area: "Área", addFunction: "Adicionar função", active: "Em uso",
    freelancer: "Freelancer", employee: "Funcionário", group_company: "Funcionário de empresa do grupo",
    participation: "Participação", notes: "Notas", back: "Voltar ao Crew Ops", personalData: "Dados pessoais", lastUpdate: "Última atualização",
    access: "Acesso", accessIntro: "Quem pode gerir o Crew Ops além dos administradores.", coordination: "Coordenação", finance: "Finanças", none: "Nenhum",
    tabPeople: "Pessoas", tabTeams: "Equipes", tabFunctions: "Funções", tabAccess: "Acesso",
  },
  tr: {} as Dict,
};
L.tr = L.en;

/** Crew Ops labels in the portal language (Turkish falls back to English). */
export function crewLabels(locale: Locale) {
  const d = L[(locale as keyof typeof L)] ?? L.en;
  return (key: string, vars: Record<string, string | number> = {}) =>
    Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), d[key] ?? L.en[key] ?? key);
}

/** The whole Crew Ops dictionary for a language (for client components). */
export function crewDict(locale: Locale): Dict {
  return { ...L.en, ...(L[locale as keyof typeof L] ?? {}) };
}

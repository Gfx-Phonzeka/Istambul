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
    tabUnits: "Units", tabDays: "Days", tabService: "Service sheet",
    unitsIntro: "Production units (OB van, flypack) with their daily plan. Teams are assigned to units by dates and each person's days come from there.",
    unit: "Unit", unitCode: "Code (e.g. PU 2)", unitName: "Name", size: "Size", mode: "Mode", cameras: "Cameras", addUnit: "Add unit", noUnits: "No units yet.",
    plan: "Daily plan", planHelp: "Choose a period and what the unit does on those days. Applying again over the same days replaces them.",
    from: "From", to: "To", dayType: "Day", venue: "Venue", sport: "Sport", callTime: "Call time", apply: "Apply", clearDays: "Remove these days",
    assignments: "Teams on this unit", assignHelp: "A team works on this unit between these dates (an operational team can move to another unit afterwards).",
    assign: "Assign", team: "Team", noPlan: "No days planned yet.", remove: "Remove", days: "days",
    dayTypes_travel: "Travel", dayTypes_setup: "Set-up", dayTypes_rehearsal: "Rehearsal", dayTypes_check: "Check / test", dayTypes_live: "Match day (MD)",
    dayTypes_off: "Day off", dayTypes_dismantle: "Dismantling", dayTypes_office: "IBC / office", dayTypes_none: "No work (remove)", dayTypes_auto: "Back to automatic",
    myDays: "My days", myDaysEmpty: "Your days will appear here once the coordination assigns your team to a unit.",
    personDays: "Days", personDaysHelp: "Generated from the person's teams and units. Exceptions (travel, day off, another unit) are added below and marked ✎.",
    exception: "Add an exception", note: "Note", total: "Total days", grid: "Days of the whole crew", gridHelp: "Generated from units, assignments and exceptions. ✎ = exception.",
    serviceTitle: "Daily service sheet", serviceIntro: "What each unit does on the day and who works on it.", noService: "Nothing planned for this day.",
    exportDays: "Crew control (days)", mediagest: "In Mediagest", mediagestHelp: "Already entered in the billing system (Mediagest / SAP).",
    allUnits: "All units", confirmDeleteUnit: "Delete this unit with its daily plan and assignments?", generated: "automatic", exceptionMark: "exception", unitDetail: "Unit", show: "Show", print: "Print",
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
    tabUnits: "Unidades", tabDays: "Días", tabService: "Hoja de servicio",
    unitsIntro: "Unidades de producción (unidad móvil, flypack) con su plan diario. Los equipos se asignan a las unidades por fechas y de ahí salen los días de cada persona.",
    unit: "Unidad", unitCode: "Código (p. ej. PU 2)", unitName: "Nombre", size: "Tamaño", mode: "Modo", cameras: "Cámaras", addUnit: "Añadir unidad", noUnits: "Aún no hay unidades.",
    plan: "Plan diario", planHelp: "Elige un periodo y qué hace la unidad esos días. Si vuelves a aplicar sobre los mismos días, se reemplazan.",
    from: "Desde", to: "Hasta", dayType: "Día", venue: "Sede", sport: "Deporte", callTime: "Hora de citación", apply: "Aplicar", clearDays: "Quitar estos días",
    assignments: "Equipos en esta unidad", assignHelp: "Un equipo trabaja en esta unidad entre estas fechas (un equipo operativo puede pasar después a otra unidad).",
    assign: "Asignar", team: "Equipo", noPlan: "Aún no hay días planificados.", remove: "Quitar", days: "días",
    dayTypes_travel: "Viaje", dayTypes_setup: "Montaje", dayTypes_rehearsal: "Ensayo", dayTypes_check: "Check / prueba", dayTypes_live: "Día de competición (MD)",
    dayTypes_off: "Libre", dayTypes_dismantle: "Desmontaje", dayTypes_office: "IBC / oficina", dayTypes_none: "Sin trabajo (quitar)", dayTypes_auto: "Volver a automático",
    myDays: "Mis días", myDaysEmpty: "Tus días aparecerán aquí cuando la coordinación asigne tu equipo a una unidad.",
    personDays: "Días", personDaysHelp: "Generados a partir de los equipos y unidades de la persona. Las excepciones (viaje, libre, otra unidad) se añaden abajo y se marcan con ✎.",
    exception: "Añadir una excepción", note: "Nota", total: "Total de días", grid: "Días de todo el equipo", gridHelp: "Generados a partir de unidades, asignaciones y excepciones. ✎ = excepción.",
    serviceTitle: "Hoja de servicio diaria", serviceIntro: "Qué hace cada unidad ese día y quién trabaja en ella.", noService: "No hay nada planificado para este día.",
    exportDays: "Crew control (días)", mediagest: "En Mediagest", mediagestHelp: "Ya dado de alta en el sistema de facturación (Mediagest / SAP).",
    allUnits: "Todas las unidades", confirmDeleteUnit: "¿Eliminar esta unidad con su plan diario y asignaciones?", generated: "automático", exceptionMark: "excepción", unitDetail: "Unidad", show: "Mostrar", print: "Imprimir",
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
    tabUnits: "Unidades", tabDays: "Dias", tabService: "Folha de serviço",
    unitsIntro: "Unidades de produção (unidade móvel, flypack) com o seu plano diário. As equipes são atribuídas às unidades por datas e daí saem os dias de cada pessoa.",
    unit: "Unidade", unitCode: "Código (ex.: PU 2)", unitName: "Nome", size: "Tamanho", mode: "Modo", cameras: "Câmeras", addUnit: "Adicionar unidade", noUnits: "Ainda não há unidades.",
    plan: "Plano diário", planHelp: "Escolha um período e o que a unidade faz nesses dias. Aplicar de novo sobre os mesmos dias substitui-os.",
    from: "De", to: "Até", dayType: "Dia", venue: "Venue", sport: "Esporte", callTime: "Hora de chamada", apply: "Aplicar", clearDays: "Remover estes dias",
    assignments: "Equipes nesta unidade", assignHelp: "Uma equipe trabalha nesta unidade entre estas datas (uma equipe operacional pode passar depois para outra unidade).",
    assign: "Atribuir", team: "Equipe", noPlan: "Ainda não há dias planejados.", remove: "Remover", days: "dias",
    dayTypes_travel: "Viagem", dayTypes_setup: "Montagem", dayTypes_rehearsal: "Ensaio", dayTypes_check: "Check / teste", dayTypes_live: "Dia de competição (MD)",
    dayTypes_off: "Folga", dayTypes_dismantle: "Desmontagem", dayTypes_office: "IBC / escritório", dayTypes_none: "Sem trabalho (remover)", dayTypes_auto: "Voltar ao automático",
    myDays: "Meus dias", myDaysEmpty: "Seus dias aparecem aqui quando a coordenação atribuir sua equipe a uma unidade.",
    personDays: "Dias", personDaysHelp: "Gerados a partir das equipes e unidades da pessoa. As exceções (viagem, folga, outra unidade) são adicionadas abaixo e marcadas com ✎.",
    exception: "Adicionar uma exceção", note: "Nota", total: "Total de dias", grid: "Dias de toda a equipe", gridHelp: "Gerados a partir das unidades, atribuições e exceções. ✎ = exceção.",
    serviceTitle: "Folha de serviço diária", serviceIntro: "O que cada unidade faz no dia e quem trabalha nela.", noService: "Nada planejado para este dia.",
    exportDays: "Crew control (dias)", mediagest: "No Mediagest", mediagestHelp: "Já lançado no sistema de faturamento (Mediagest / SAP).",
    allUnits: "Todas as unidades", confirmDeleteUnit: "Excluir esta unidade com o plano diário e as atribuições?", generated: "automático", exceptionMark: "exceção", unitDetail: "Unidade", show: "Mostrar", print: "Imprimir",
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

export const STATUS_TONE = { received: "info", in_review: "warning", confirmed: "success", rejected: "danger" } as const;
export const REQUEST_STATUSES = ["received", "in_review", "confirmed", "rejected"] as const;
export const RHB_REQUEST_TYPES = ["unilateral", "additional_production", "other"];
export const TEAM_REQUEST_TYPES = ["team_equipment", "team_accreditation", "team_uniform", "team_logistics", "team_other"];

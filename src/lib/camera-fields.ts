import { LOCALES } from "@/lib/i18n";

/** Camera function texts for every portal language (Istanbul: en/tr · Lima: es/en/pt), empty when missing. */
export const fnFields = (c?: Record<string, unknown>) =>
  Object.fromEntries(LOCALES.map((l) => [`function_${l}`, ((c?.[`function_${l}`] as string) ?? "")])) as Record<`function_${string}`, string>;

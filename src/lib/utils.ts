import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalises a majors field that may be stored as:
 * - an array of strings  → returned as-is
 * - a single string with ; ، or , delimiters → split into trimmed strings
 * - undefined / null     → empty array
 */
export function parseMajors(majors: string | string[] | null | undefined): string[] {
  if (!majors) return [];
  if (Array.isArray(majors)) {
    return majors.flatMap((m) =>
      typeof m === "string" ? m.split(/[;،,]/).map((s) => s.trim()).filter(Boolean) : []
    );
  }
  return majors.split(/[;،,]/).map((s) => s.trim()).filter(Boolean);
}

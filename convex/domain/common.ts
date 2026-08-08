import { ConvexError } from "convex/values";

export type DomainErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "REFERENCE_IN_USE";

export function domainError(
  code: DomainErrorCode,
  message: string,
  field?: string,
): never {
  throw new ConvexError({ code, message, field });
}

export function requiredText(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized)
    domainError("VALIDATION_ERROR", `${field} is required`, field);
  return normalized;
}

export function optionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function finiteNumber(value: number, field: string): number {
  if (!Number.isFinite(value))
    domainError("VALIDATION_ERROR", `${field} must be finite`, field);
  return value;
}

export function numberInRange(
  value: number,
  min: number,
  max: number,
  field: string,
): number {
  finiteNumber(value, field);
  if (value < min || value > max) {
    domainError(
      "VALIDATION_ERROR",
      `${field} must be between ${min} and ${max}`,
      field,
    );
  }
  return value;
}

export function nonNegativeNumber(
  value: number | undefined,
  field: string,
): number | undefined {
  if (value === undefined) return undefined;
  finiteNumber(value, field);
  if (value < 0)
    domainError("VALIDATION_ERROR", `${field} cannot be negative`, field);
  return value;
}

export function isoDate(
  value: string | undefined,
  field: string,
): string | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const normalized = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match)
    domainError("VALIDATION_ERROR", `${field} must use YYYY-MM-DD`, field);
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    domainError(
      "VALIDATION_ERROR",
      `${field} is not a valid calendar date`,
      field,
    );
  }
  return normalized;
}

export function orderedDates(
  start: string | undefined,
  end: string | undefined,
  startField = "startDate",
  endField = "dueDate",
): { start: string | undefined; end: string | undefined } {
  const normalizedStart = isoDate(start, startField);
  const normalizedEnd = isoDate(end, endField);
  if (normalizedStart && normalizedEnd && normalizedStart > normalizedEnd) {
    domainError(
      "VALIDATION_ERROR",
      `${startField} must not be after ${endField}`,
      startField,
    );
  }
  return { start: normalizedStart, end: normalizedEnd };
}

export function normalizeEmail(value: string, field = "email"): string {
  const normalized = requiredText(value, field).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    domainError("VALIDATION_ERROR", `${field} is invalid`, field);
  }
  return normalized;
}

export function uniqueTexts(values: string[], field: string): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const normalized = requiredText(value, field);
    const key = normalized.toLocaleLowerCase("en-US");
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  }
  return result;
}

export function normalizedKey(value: string): string {
  return requiredText(value, "name")
    .normalize("NFKC")
    .toLocaleLowerCase("en-US");
}

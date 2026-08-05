import {
  isoDate,
  nonNegativeNumber,
  optionalText,
  requiredText,
  uniqueTexts,
} from "./common";

export type SystemModuleInput = {
  name: string;
  description?: string;
  usedBy: string[];
  version?: string;
  notes?: string;
  plannedDate?: string;
  sortOrder?: number;
};

export function normalizeSystemModule<T extends SystemModuleInput>(
  input: T,
): T {
  return {
    ...input,
    name: requiredText(input.name, "name"),
    description: optionalText(input.description),
    usedBy: uniqueTexts(input.usedBy, "usedBy"),
    version: optionalText(input.version),
    notes: optionalText(input.notes),
    plannedDate: isoDate(input.plannedDate, "plannedDate"),
    sortOrder: nonNegativeNumber(input.sortOrder, "sortOrder"),
  };
}

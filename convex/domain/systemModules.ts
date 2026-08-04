import { nonNegativeNumber, optionalText, requiredText, uniqueTexts } from "./common";

export type SystemModuleInput = {
  name: string;
  description?: string;
  usedBy: string[];
  version?: string;
  notes?: string;
  sortOrder?: number;
};

export function normalizeSystemModule<T extends SystemModuleInput>(input: T): T {
  return {
    ...input,
    name: requiredText(input.name, "name"),
    description: optionalText(input.description),
    usedBy: uniqueTexts(input.usedBy, "usedBy"),
    version: optionalText(input.version),
    notes: optionalText(input.notes),
    sortOrder: nonNegativeNumber(input.sortOrder, "sortOrder"),
  };
}

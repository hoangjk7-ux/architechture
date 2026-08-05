import {
  isoDate,
  numberInRange,
  nonNegativeNumber,
  optionalText,
  requiredText,
  uniqueTexts,
} from "./common";

export type SoftwareSystemInput = {
  name: string;
  category: string;
  owner?: string;
  departments: string[];
  campuses: string[];
  technology?: string;
  database?: string;
  hosting?: string;
  sla?: string;
  licenseType?: string;
  costPerYear?: number;
  contractEndDate?: string;
  technicalDebtScore: number;
  architectureScore: number;
  description?: string;
};

export function normalizeSoftwareSystem<T extends SoftwareSystemInput>(
  input: T,
): T {
  return {
    ...input,
    name: requiredText(input.name, "name"),
    category: requiredText(input.category, "category"),
    owner: optionalText(input.owner),
    departments: uniqueTexts(input.departments, "departments"),
    campuses: uniqueTexts(input.campuses, "campuses"),
    technology: optionalText(input.technology),
    database: optionalText(input.database),
    hosting: optionalText(input.hosting),
    sla: optionalText(input.sla),
    licenseType: optionalText(input.licenseType),
    costPerYear: nonNegativeNumber(input.costPerYear, "costPerYear"),
    contractEndDate: isoDate(input.contractEndDate, "contractEndDate"),
    technicalDebtScore: numberInRange(
      input.technicalDebtScore,
      0,
      100,
      "technicalDebtScore",
    ),
    architectureScore: numberInRange(
      input.architectureScore,
      0,
      100,
      "architectureScore",
    ),
    description: optionalText(input.description),
  };
}

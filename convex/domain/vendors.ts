import { normalizeEmail, numberInRange, nonNegativeNumber, optionalText, requiredText } from "./common";

export type VendorInput = {
  name: string;
  contactEmail?: string;
  contactName?: string;
  sla?: string;
  costPerYear?: number;
  riskScore: number;
  notes?: string;
};

export function normalizeVendor<T extends VendorInput>(input: T): T {
  return {
    ...input,
    name: requiredText(input.name, "name"),
    contactEmail: input.contactEmail ? normalizeEmail(input.contactEmail, "contactEmail") : undefined,
    contactName: optionalText(input.contactName),
    sla: optionalText(input.sla),
    costPerYear: nonNegativeNumber(input.costPerYear, "costPerYear"),
    riskScore: numberInRange(input.riskScore, 0, 100, "riskScore"),
    notes: optionalText(input.notes),
  };
}

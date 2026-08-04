import { domainError, numberInRange, optionalText, requiredText } from "./common";

export type IntegrationInput = {
  name: string;
  sourceSystemId: string;
  destinationSystemId: string;
  owner?: string;
  errorRate?: number;
  description?: string;
};

export function normalizeIntegration<T extends IntegrationInput>(input: T): T {
  if (input.sourceSystemId === input.destinationSystemId) {
    domainError("VALIDATION_ERROR", "Source and destination systems must differ", "destinationSystemId");
  }
  return {
    ...input,
    name: requiredText(input.name, "name"),
    owner: optionalText(input.owner),
    errorRate: input.errorRate === undefined
      ? undefined
      : numberInRange(input.errorRate, 0, 100, "errorRate"),
    description: optionalText(input.description),
  };
}

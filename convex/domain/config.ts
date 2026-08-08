import { normalizedKey, optionalText, requiredText } from "./common";

export type ConfigItemInput = { name: string; color?: string };

export function normalizeConfigItem<T extends ConfigItemInput>(
  input: T,
): T & { normalizedName: string } {
  const name = requiredText(input.name, "name");
  return {
    ...input,
    name,
    normalizedName: normalizedKey(name),
    color: optionalText(input.color),
  };
}

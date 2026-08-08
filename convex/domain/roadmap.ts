import {
  domainError,
  numberInRange,
  optionalText,
  orderedDates,
  requiredText,
} from "./common";

export type RoadmapLevel = "initiative" | "program" | "project" | "epic";

const requiredParentLevel: Record<RoadmapLevel, RoadmapLevel | null> = {
  initiative: null,
  program: "initiative",
  project: "program",
  epic: "project",
};

export type RoadmapInput = {
  title: string;
  level: RoadmapLevel;
  owner?: string;
  startDate?: string;
  dueDate?: string;
  architectureAlignmentScore: number;
  description?: string;
};

export function normalizeRoadmapItem<T extends RoadmapInput>(input: T): T {
  const dates = orderedDates(input.startDate, input.dueDate);
  return {
    ...input,
    title: requiredText(input.title, "title"),
    owner: optionalText(input.owner),
    startDate: dates.start,
    dueDate: dates.end,
    architectureAlignmentScore: numberInRange(
      input.architectureAlignmentScore,
      0,
      100,
      "architectureAlignmentScore",
    ),
    description: optionalText(input.description),
  };
}

export function assertRoadmapParent(
  level: RoadmapLevel,
  parentLevel: RoadmapLevel | null,
): void {
  const expected = requiredParentLevel[level];
  if (parentLevel !== expected) {
    domainError(
      "VALIDATION_ERROR",
      expected === null
        ? `${level} cannot have a parent`
        : `${level} must have a ${expected} parent`,
      "parentId",
    );
  }
}

export function assertNoRoadmapCycle(
  itemId: string,
  ancestorIds: readonly string[],
): void {
  if (ancestorIds.includes(itemId)) {
    domainError(
      "VALIDATION_ERROR",
      "Roadmap parent would create a cycle",
      "parentId",
    );
  }
}

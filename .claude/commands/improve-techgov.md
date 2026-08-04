---
description: Orchestrate the TechGov 10/10 improvement plan with isolated specialist agents
argument-hint: [status|plan|wave-0|wave-1|wave-2|wave-3|wave-4|next]
---

Act as lead orchestrator for `.ai/task.md` and `.ai/orchestration.md`.

Requested operation: `$ARGUMENTS` (default to `next`).

1. Read repository instructions, orchestration map, current Git status and diff.
2. Determine completed tasks from code/tests and do not trust stale reports alone.
3. For `status` or `plan`, make no source changes; report task state, blockers,
   ownership conflicts and the next safe merge wave.
4. For execution, dispatch only dependency-ready tasks to the matching custom
   agents: `security-engineer`, `data-integrity-engineer`, `frontend-engineer`, and
   `quality-engineer`.
5. Run at most one writing task per owned file set. Parallelize only the safe lanes
   explicitly listed in `.ai/orchestration.md`.
6. Require each agent to preserve existing dirty changes, run task-level checks and
   return changed files plus evidence.
7. Review every agent diff centrally. Reject scope creep, authorization based only
   on UI, swallowed errors, destructive data changes without policy tests, or broad
   lint ignores.
8. Run the available merge-wave verification commands. Do not deploy or seed.
9. Update `.ai/claude-plan.md` with task statuses and `.ai/final-report.md` with the
   wave result, blockers and next command.

If worktree isolation is unavailable and two ready tasks would touch overlapping
files, execute them sequentially. Never resolve this by overwriting user changes.

---
name: update-plan
description: Use this skill when the user requests any change to the app — a new feature, a behavior tweak, removing something, or adjusting how something works. Before implementing, check if a relevant plan exists in docs/plan/ and ask whether the plan should be updated to reflect the change. Keeps plans accurate as the app evolves.
version: 1.0.0
---

# Update Plan

When the user asks for a change, check whether a relevant plan document exists and offer to keep it in sync.

## Steps

1. **Check for a relevant plan.** Look in `docs/plan/` for a plan that covers the area being changed. If none exists, skip the rest of this skill.

2. **Ask once.** Before implementing anything, ask: "This touches the [feature] plan — want me to update it to reflect the change?"

3. **If yes:** Update only the affected section(s) of the plan file. Then append the decision to `docs/plan/qa-log.md`:

```markdown
## [Feature] - YYYY-MM-DD

**Q: [What changed]**
A: [The new decision, and what it supersedes if anything]
```

4. **Then proceed** with the actual implementation work as requested.

## Rules

- Never rewrite the whole plan — edit only what changed.
- Never delete qa-log entries — append only.
- If the user says no, skip the plan update and implement the change anyway.

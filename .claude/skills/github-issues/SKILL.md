---
name: github-issues
version: 1.0.0
description: >
  How to create, view, and manage GitHub issues for this project using the gh
  CLI. Use this skill whenever the user wants to "create a ticket", "open an
  issue", "file a bug", "log a task", "list open issues", "view a ticket",
  "close an issue", "assign an issue", or otherwise interact with GitHub issues.
  The gh CLI is the ONLY way we manage GitHub issues in this project — never
  suggest the web UI. Use this skill proactively any time issue tracking or
  ticket management comes up.
---

# GitHub Issues via `gh` CLI

The `gh` CLI is the canonical way to manage issues in this project. Repo:
**`mikevalstar/retirement-tool`**

Never suggest opening the GitHub web UI. Always use `gh` commands.

---

## Creating an issue

```bash
gh issue create \
  --title "Short, imperative title" \
  --body "$(cat <<'EOF'
## What

Clear description of what needs to be done or what's broken.

## Why

Why this matters / what it unlocks.

## Acceptance criteria

- [ ] Specific, testable outcome
- [ ] Another outcome
EOF
)"
```

**Title conventions:**
- Imperative mood: "Add income section route", not "Adding income route"
- No period at the end
- Keep it under 72 characters

**Body conventions:**
- `## What` — what the task is
- `## Why` — why it matters
- `## Acceptance criteria` — checkboxes for done-ness
- Skip sections that add no value for small/obvious tasks

**Adding labels at creation:**
```bash
gh issue create --title "..." --body "..." --label "bug"
gh issue create --title "..." --body "..." --label "enhancement"
```

**Assigning to yourself:**
```bash
gh issue create --title "..." --body "..." --assignee "@me"
```

---

## Listing issues

```bash
# All open issues (default)
gh issue list

# Compact view with limit
gh issue list --limit 20

# Filter by label
gh issue list --label "bug"

# Filter by assignee
gh issue list --assignee "@me"

# Closed issues
gh issue list --state closed
```

---

## Viewing an issue

```bash
# View in terminal
gh issue view 42

# Open in browser (when you actually need the full thread)
gh issue view 42 --web
```

---

## Updating an issue

```bash
# Add a comment
gh issue comment 42 --body "Progress update or question"

# Close an issue
gh issue close 42

# Close with a comment
gh issue close 42 --comment "Fixed in commit abc1234"

# Reopen
gh issue reopen 42

# Edit title or body
gh issue edit 42 --title "New title"
gh issue edit 42 --body "Replacement body text"

# Add a label
gh issue edit 42 --add-label "enhancement"

# Assign
gh issue edit 42 --add-assignee "@me"
```

---

## Creating issues from a plan

After a planning session (`/project-planner`), break the approved plan into
GitHub issues. Each issue should map to a user-facing behavior from the plan.

Pattern:
1. Draft issues as markdown in the chat for user review
2. Ask: "Want me to create these with `gh issue create`?"
3. Create them one at a time, capturing the issue numbers

```bash
# Example from a planning session
gh issue create \
  --title "Add income section with employment entry" \
  --label "enhancement" \
  --body "$(cat <<'EOF'
## What

Add the `/income` route with a form for entering employment income sources
(salary, hourly, self-employment). Each source has a name, annual gross
amount, and start/end year.

## Why

Income sources are a required input for the retirement simulation.

## Acceptance criteria

- [ ] Route `/income` exists and renders in the sidebar
- [ ] User can add, edit, and delete employment income sources
- [ ] Each source stores: name, type, gross annual amount, start year, end year
- [ ] Sidebar accent uses `--section-income` (#14b8a6)
EOF
)"
```

---

## Checklist

- [ ] Title is imperative, under 72 chars, no trailing period
- [ ] Body has at least a "What" section; acceptance criteria for non-trivial tasks
- [ ] Label added if clearly a bug or enhancement
- [ ] Issue number noted for reference in commits/PRs (e.g., `fixes #42`)

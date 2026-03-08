# Skills Index — Agent Routing Map

> Routing table for skill selection. Scan the tables below to find skills matching your current task.
> **Only `using-superpowers` is mandatory** (read at conversation start). All others: load if task matches.
> Process skills first (brainstorming, debugging), then implementation skills (frontend-design, postgres, etc.).

---

## Signal → Skill Routing

Match keywords from the user's request or your current task against the "Signals" column. Load ALL matching skills.

### Process & Planning

| Signals | Skill | Path | Type |
|---|---|---|---|
| start of conversation, any task | `using-superpowers` | `using-superpowers` | **Mandatory** |
| new feature, explore idea, design decision, "how should we..." | `brainstorming` | `brainstorming` | Rigid |
| implementation plan, multi-step task, before coding | `writing-plans` | `writing-plans` | Rigid |
| execute plan, separate session, checkpoints | `executing-plans` | `executing-plans` | Rigid |
| execute plan, subagents, same session, parallel tasks | `subagent-driven-development` | `subagent-driven-development` | Rigid |
| parallel independent tasks, separate agents, concurrent work | `dispatching-parallel-agents` | `dispatching-parallel-agents` | Rigid |
| git worktree, branch isolation, parallel session | `using-git-worktrees` | `using-git-worktrees` | Flexible |
| install skill, find skill, extend capabilities | `find-skills` | `find-skills` | Flexible |
| branch complete, feature done, ready to merge | `finishing-a-development-branch` | `finishing-a-development-branch` | Flexible |

### Quality & Verification

| Signals | Skill | Path | Type |
|---|---|---|---|
| bug, error, broken, debug, fix, test failure, build error | `systematic-debugging` | `systematic-debugging` | Rigid |
| implement feature, bugfix, write code, new function | `test-driven-development` | `test-driven-development` | Rigid |
| code review feedback, PR comments, review response | `receiving-code-review` | `receiving-code-review` | Rigid |
| request code review, before merge, PR review, review quality | `requesting-code-review` | `requesting-code-review` | Rigid |
| verify, confirm complete, done, finished, "it works" | `verification-before-completion` | `verification-before-completion` | Rigid |
| review React code, anti-patterns, useEffect abuse, state | `typescript-react-reviewer` | `typescript-react-reviewer` | Flexible |

### Frontend & UI

| Signals | Skill | Path | Type |
|---|---|---|---|
| UI component, page design, dashboard, visual design, layout | `frontend-design` | `frontend-design` | Flexible |
| React performance, hooks, re-render, memo, optimization | `vercel-react-best-practices` | `vercel-react-best-practices` | Flexible |

### TypeScript

| Signals | Skill | Path | Type |
|---|---|---|---|
| generics, conditional types, mapped types, utility types, type-safe | `typescript-advanced-types` | `typescript-advanced-types` | Flexible |

### Database & Backend

| Signals | Skill | Path | Type |
|---|---|---|---|
| postgres query, index, schema design, SQL, PostgREST, migration | `supabase-postgres-best-practices` | `supabase-postgres-best-practices` | Flexible |

### Testing

| Signals | Skill | Path | Type |
|---|---|---|---|
| e2e test, playwright, end-to-end, integration test, browser test | `playwright-best-practices` | `playwright-best-practices` | Flexible |

### Release

| Signals | Skill | Path | Type |
|---|---|---|---|
| changelog, release notes, semantic versioning, conventional commits | `changelog-automation` | `changelog-automation` | Flexible |

---

## Common Workflows

### New feature (full cycle)

```
using-superpowers → brainstorming → writing-plans → subagent-driven-development
  + Load per task: test-driven-development, requesting-code-review
  + Load if UI work: frontend-design, vercel-react-best-practices
  + Load if DB/schema work: supabase-postgres-best-practices
  + Final: verification-before-completion → finishing-a-development-branch
```

### Debug a problem

```
using-superpowers → systematic-debugging
  + playwright-best-practices (e2e issues)
  + test-driven-development (regression test)
  + verification-before-completion
```

### Build/modify UI (Editorial Orgánico theme)

```
using-superpowers → frontend-design
  + vercel-react-best-practices
  + typescript-react-reviewer (after implementing)
  + verification-before-completion
```

### Database schema work

```
using-superpowers → supabase-postgres-best-practices
  + writing-plans (if multi-step migration)
  + verification-before-completion
```

### Receiving code review

```
using-superpowers → receiving-code-review
  + typescript-react-reviewer (for React-specific feedback)
  + verification-before-completion
```

### Release & changelog

```
using-superpowers → changelog-automation
  + finishing-a-development-branch
```

---

## Skill Types

- **Mandatory**: `using-superpowers` — always loaded at conversation start.
- **Rigid**: Follow exactly, no shortcuts (TDD, debugging, verification, planning, code review).
- **Flexible**: Adapt principles to project context (frontend, postgres, typescript, testing tools).

# CCAR-F Study Hub

A single-place study site for the **Anthropic Claude Certified Architect – Foundations** exam
(CCA-F / CCAR-F): full documentation for all nine test topics, sixteen hands-on exercises graded in
the browser, and a 60-question / 120-minute mock exam that explains the rule behind every right
answer and why each distractor fails.

Static HTML, CSS and vanilla JavaScript. No build step, no dependencies, no network calls at
runtime — it works offline and on GitHub Pages as-is.

---

## What's in it

| Page | Contents |
|---|---|
| `index.html` | Exam blueprint, domain weightings, the seven anti-patterns used as distractors, a study plan, and primary sources |
| `docs.html` | A four-part primer (agentic loop and stop reasons, Claude Code config surfaces, MCP, cost/latency levers), then all nine test topics end-to-end with 54 Q&A drills, an exam-day playbook and a one-page cheat sheet |
| `exercises.html` | 16 exercises: 9 browser-graded editors (write real `settings.json`, hooks, schemas, tool definitions, error payloads), 3 classification drills, 2 multiple-choice drills, 2 terminal labs |
| `exam.html` | 60 scenario-based questions weighted to the published blueprint, with a 120-minute timer, study/exam modes, flagging, per-domain scoring and full explanations |

### Coverage of the nine test topics

| # | Objective | Docs | Exercises | Exam items |
|---|---|---|---|---|
| 1 | Orchestration safeguards for session termination | `#t1` | 11, 12 | Q1–16 |
| 2 | Permissions / hooks vs CLAUDE.md | `#t2` | 1, 2, 15, 16 | Q17, 22–28 |
| 3 | PostToolUse quality-gate hooks | `#t3` | 3, 4, 5, 15 | Q18–21 |
| 4 | Escalation decision criteria | `#t4` | 10, 12 | Q52–56, 58, 60 |
| 5 | Extraction schema design (optional / nullable / enum) | `#t5` | 6 | Q29–32, 40 |
| 6 | Extraction accuracy across document formats | `#t6` | 7 | Q33–37 |
| 7 | Feedback loops from structured error metadata | `#t7` | 7, 14 | Q38, 39 |
| 8 | Tool descriptions and selection reliability | `#t8` | 8, 13 | Q41, 45, 46, 51 |
| 9 | `tool_choice` and multi-tool sequencing | `#t9` | 9, 13 | Q42–44, 47, 49, 50 |

### Mock exam item distribution

Matched to the published blueprint, so a weak per-domain score is a real signal:

| Domain | Blueprint weight | Items |
|---|---|---|
| Agentic Architecture & Orchestration | 27% | 16 |
| Claude Code Configuration & Workflows | 20% | 12 |
| Prompt Engineering & Structured Output | 20% | 12 |
| Tool Design & MCP Integration | 18% | 11 |
| Context Management & Reliability | 15% | 9 |

Six items are **select-2**. Scoring is scaled 100–1000 with a 720 pass mark, matching the real exam.
The answer key is balanced (A:14 B:14 C:13 D:13 across single-answer items, and all six distinct
letter pairs across the select-2 items), so guessing a favourite letter gains you nothing.

---

## Deploy to GitHub Pages

From this directory:

```bash
git init -b main && git add -A && git commit -m "CCAR-F study hub"
```

Create an empty repository on GitHub (no README, no .gitignore), then:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git && git push -u origin main
```

Then in the repository on GitHub: **Settings → Pages → Source: Deploy from a branch →
Branch: `main`, folder: `/ (root)` → Save.**

The site appears at `https://<your-username>.github.io/<your-repo>/` within a minute or two.

`.nojekyll` is already present, which stops GitHub from running Jekyll over the files — without it,
paths beginning with an underscore are silently dropped. If you prefer a private study site, a
private repo with GitHub Pages requires a paid plan; otherwise just open `index.html` from disk,
since everything works from `file://` too.

## Run it locally

Opening `index.html` directly in a browser works. For a local server:

```bash
npx -y http-server . -p 8099 -c-1
```

## Progress and privacy

Your exam answers, flags, timer state and half-finished exercise editors are saved to
`localStorage` in your own browser. Nothing is sent anywhere — there is no analytics, no CDN and no
external request of any kind. Clearing site data resets everything; the exam's **Reset** button
clears just the exam attempt.

---

## Sources and caveat

The documentation is written from Anthropic's product documentation plus public candidate reports:

- [Claude Code — Hooks](https://code.claude.com/docs/en/hooks)
- [Claude Code — Settings & permissions](https://code.claude.com/docs/en/settings)
- [Claude Code — CLAUDE.md & memory](https://code.claude.com/docs/en/memory)
- [Claude Code — Subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude API — Define tools & `tool_choice`](https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools)
- [Claude API — Handle tool calls, `stop_reason`, `is_error`](https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls)
- [Claude API — Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Anthropic Academy — certification page and official exam guide](https://anthropic-partners.skilljar.com/claude-certified-architect-foundations-certification)

**The 60 mock questions are original.** They were written to the published blueprint, to documented
product behaviour, and to the traps reported by candidates who have sat the exam. They are not
recalled or leaked exam items, and no source claiming to hold verbatim exam content was used. Treat
a strong score as evidence you understand the material, not as a preview of the live item pool.

Some details are version-sensitive — CLI flag names, hook event names, supported JSON Schema
keywords. Verify those against the live documentation close to your exam date.

Independent study material. Not affiliated with or endorsed by Anthropic.

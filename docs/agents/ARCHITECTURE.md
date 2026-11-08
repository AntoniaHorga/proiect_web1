# Architecture — proiect_web1

<!-- graffino-agentic:begin v1 -->
> How this repo is built, generated from the code at backfill and kept current by
> whoever changes the structure. The code wins: when this page is wrong, fix it.
<!-- graffino-agentic:end -->

## Overview
Web application for university coursework (`proiect_web1`), developed in a standalone git repository.
Initial project scaffold stage.
Architecture components will be detailed as implementation progresses.

```text
[User / Browser] ---> [Web Application Client] ---> [Backend / API (TBD)]
```

## Parts
| Part | Path | Responsibility | Talks to |
|---|---|---|---|
| Repository Docs & Ledger | `docs/agents/` | System rules, decisions, architecture | Agent / Developer |
| Agentic Workflows | `.claude/`, `.agents/` | Planning and building automations | Agent CLI / IDE |

## Data flow
1. User requests a task or feature.
2. `/plan` produces an approach and verifies against ledger.
3. User approves plan.
4. `/build` implements code changes, updates tests, and records new candidate patterns.

## State and storage
| What | Where | Owner | Notes |
|---|---|---|---|
| Knowledge Ledger | `docs/agents/` | Git | Maintained via `ledger-lint.py` |

## Configuration
| Name | Where set | Used by | Notes |
|---|---|---|---|
| Git configuration | `.git/config` | Git client | Local branch setup |

## Build, deploy, runtime
Runs locally in the user's environment. Build and test scripts will be specified in `AGENTS.md` section 2 once dependencies are selected.

## Boundaries
Local development boundary. Secrets must never be committed.

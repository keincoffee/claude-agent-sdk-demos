# Varicent Sales Planning Cycle Builder

Automatically generate a complete Varicent sales planning cycle from a **Technical Design Document (TDD)** and sales data CSVs — in minutes instead of days.

## What it does

Three specialized subagents run in parallel to produce all planning artifacts:

| Subagent | Input | Output |
|---|---|---|
| **territory-analyst** | TDD rules + accounts + reps | `output/territory-assignments.csv` |
| **quota-calculator** | TDD methodology + historical performance | `output/quota-targets.csv` |
| **doc-writer** | TDD + quota data | `output/planning-cycle-spec.md` + `output/quota-letters/*.md` |

### Generated outputs

- **`territory-assignments.csv`** — Account-to-rep mapping, Varicent-importable. Includes rationale for every assignment (named account rule, segment, geography).
- **`quota-targets.csv`** — Annual and quarterly quotas per rep, with commission rates and OTE. Varicent-importable.
- **`quota-letters/`** — Individual quota letters for each rep (Markdown), ready to send.
- **`planning-cycle-spec.md`** — Full planning cycle specification with territory summary, quota distribution table, comp plan highlights, and a 20+ step Varicent setup checklist.

## How the agent reads a TDD

The agent parses free-form TDD text to extract:
- Territory rules (geography, segment, named account overrides, workload targets)
- Quota methodology (weighting formula, regional targets, floors/ceilings)
- Comp plan mechanics (pay mix, commission rates, accelerator tiers)
- Approval workflow (steps, owners, deadlines)
- Ramp schedules for new hires

## Synthetic demo data

The `data/` directory contains realistic synthetic data for a fictional company, **Nexus Analytics Inc.**:

| File | Description |
|---|---|
| `data/tdd.txt` | 8-section Technical Design Document |
| `data/reps.csv` | 8 quota-carrying reps across 3 regions |
| `data/accounts.csv` | 40 named accounts (Enterprise, Mid-Market, Commercial) |
| `data/historical-performance.csv` | 2 years of quarterly attainment per rep |

**To use your own data:** replace the CSV files with your own (match the column names) and supply your TDD as a `.txt` or `.pdf` argument.

## Prerequisites

- Node.js 18+ or Bun
- `ANTHROPIC_API_KEY` environment variable set

## Usage

```bash
cd varicent-planning-agent
npm install

# Run with synthetic demo data
npm start

# Supply your own TDD (CSVs still expected in data/)
npm start -- /path/to/your-tdd.txt
```

The agent streams progress to the terminal and prints a file manifest when complete.

## Architecture

```
varicent-planning-agent.ts
  └── Orchestrator agent
        ├── Reads: data/tdd.txt, data/reps.csv, data/accounts.csv,
        │         data/historical-performance.csv
        ├── territory-analyst subagent ─────────────────────────┐
        ├── quota-calculator subagent  ─── (run in parallel) ───┤
        └── doc-writer subagent        ─────────────────────────┘
              All write to output/
```

The orchestrator passes TDD and data content directly to each subagent, so all three can work simultaneously without waiting on file I/O.

## Extending for production use

- **Bring your own TDD**: Works with Word (.docx) if you convert to text first, or pass a PDF path and extend the agent to use `WebFetch` or a PDF parsing tool.
- **Live Varicent import**: Add a post-processing step to call Varicent's REST API with the generated CSVs.
- **CRM integration**: Replace the static `accounts.csv` with a live Salesforce/HubSpot export.
- **Iterative refinement**: Ask follow-up questions ("increase East quota by 10%", "reassign accounts A012 and A015 to Emily") — the agent can re-run specific subagents.

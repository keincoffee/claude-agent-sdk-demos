/**
 * Varicent Sales Planning Cycle Builder
 *
 * Reads a Technical Design Document (TDD) and sales data CSVs, then uses
 * specialized subagents to automatically generate a complete Varicent
 * sales planning cycle: territory assignments, quota targets, quota letters,
 * and a full planning cycle specification with Varicent setup checklist.
 *
 * Usage:
 *   npm start                       # uses data/tdd.txt and data/*.csv
 *   npm start -- path/to/custom.tdd # supply your own TDD
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// System prompt for the orchestrating agent
// ---------------------------------------------------------------------------
const ORCHESTRATOR_PROMPT = `You are a Varicent Sales Planning specialist. Your job is to read a
Technical Design Document (TDD) and sales data files, then orchestrate specialized subagents
to produce a complete, importable Varicent sales planning cycle.

WORKFLOW (follow this order exactly):
1. Read data/tdd.txt to understand the full plan design
2. Read data/reps.csv, data/accounts.csv, and data/historical-performance.csv
3. Confirm you have understood the data, then launch ALL THREE subagents IN PARALLEL:
   - territory-analyst  → produces output/territory-assignments.csv
   - quota-calculator   → produces output/quota-targets.csv
   - doc-writer         → produces output/planning-cycle-spec.md and output/quota-letters/*.md
4. After all subagents finish, print a concise summary of what was generated

IMPORTANT: The output/ directory already exists. Write all output files there.

CONTEXT TO PASS TO EACH SUBAGENT:
When you invoke each subagent, give it the full content of the TDD and the relevant
CSV data directly in your message — do not ask it to re-read the files itself.
This ensures consistency and speed.

QUALITY CHECKS before declaring done:
- territory-assignments.csv exists and has one row per account (40 accounts)
- quota-targets.csv exists and has one row per rep × period (8 reps × 5 periods = 40 rows)
- planning-cycle-spec.md exists and contains a Varicent setup checklist
- quota-letters/ directory contains 8 individual .md files (one per rep)`;

// ---------------------------------------------------------------------------
// Subagent prompts
// ---------------------------------------------------------------------------
const TERRITORY_ANALYST_PROMPT = `You are a Territory Design specialist for Varicent implementations.

You will receive the TDD content and account/rep data. Your job is to assign every account
to the most appropriate rep, following the territory rules in the TDD exactly.

RULES TO APPLY (from the TDD):
1. Named account overrides take precedence over geographic rules
2. Enterprise accounts ($500M+ revenue) go to Senior AEs and the Enterprise AE only
   (NOT to reps with < 24 months tenure)
3. Commercial accounts (<$50M) go to AEs only, not Senior AEs or Enterprise AE
4. Geographic region assignment based on hq_state as defined in TDD Section 3.2
5. Balance workload: AE target 8–14 accounts, Senior AE 6–10, Enterprise AE 4–7
6. Minimum 40% prospect accounts per rep

OUTPUT: Write output/territory-assignments.csv with these exact columns:
  account_id, account_name, rep_id, rep_name, title, region, segment,
  annual_revenue_millions, account_status, territory_rationale

territory_rationale must briefly explain why this account was assigned to this rep
(e.g. "Named account rule — Enterprise AE West", "Geographic — East region Mid-Market AE").

After writing the file, print a one-paragraph summary of the territory design decisions made.`;

const QUOTA_CALCULATOR_PROMPT = `You are a Quota Planning specialist for Varicent implementations.

You will receive the TDD content and rep/historical performance data. Your job is to
calculate FY2025 quotas for every rep, following the methodology in TDD Section 4 exactly.

CALCULATION STEPS:
1. For each rep, compute Historical Component:
   - 2-year average attainment % for reps with FY2023 + FY2024 data
   - FY2024 only for David Kim (joined Jan 2023, no FY2023 full year)
   - Tom Anderson: RAMPING — apply 40% ramp; use placeholder historical = 100%
   - Normalize within each region so components sum to 1.0

2. For each rep, compute Market Potential Component (use territory assignments you have):
   - Prospect accounts: sum(annual_revenue_millions × 0.02) → estimated new logo ARR
   - Customer accounts: sum(current_arr_usd × 0.15) → estimated expansion ARR
   - Normalize within each region so components sum to 1.0
   NOTE: You must estimate territories from the TDD rules since territory-analyst
   runs in parallel. Use TDD sections 3.3 and 3.4 to assign accounts yourself
   for this calculation.

3. Rep Share = (0.60 × Historical) + (0.40 × Market Potential)

4. Annual Quota = Regional Target × Rep Share
   Regional targets: East $5,400,000 | West $8,100,000 | Central $4,500,000

5. Apply floors/ceilings from TDD Section 4.3

6. Apply Tom Anderson ramp: multiply annual quota by 0.40

7. Calculate quarterly breakdown using seasonality in TDD Section 4.5
   Tom Anderson ramp: Q1=20%, Q2=30%, Q3=25%, Q4=25% of his ramped annual quota

8. Calculate commission rate: (OTE × 0.50) ÷ Annual Quota

OUTPUT: Write output/quota-targets.csv with these exact columns:
  rep_id, rep_name, title, region, annual_quota, q1_quota, q2_quota, q3_quota, q4_quota,
  h1_quota, h2_quota, ote_usd, base_salary_usd, on_target_commission_usd,
  commission_rate_pct, is_ramping, hist_component_pct, market_component_pct,
  hist_attainment_avg_pct

All quota values in whole USD. commission_rate_pct to 2 decimal places.

After writing the file, print a paragraph explaining quota distribution and any
notable decisions made (floors applied, ramp adjustments, etc.).`;

const DOC_WRITER_PROMPT = `You are a Sales Planning documentation specialist for Varicent implementations.

You will receive the TDD content, rep data, and quota targets. Your job is to produce
two sets of documents:

PART 1 — INDIVIDUAL QUOTA LETTERS
Write one file per rep in output/quota-letters/<FirstName_LastName>_quota_letter.md

Each letter must include:
  - Date: February 1, 2025
  - Rep name and title in salutation
  - Annual quota amount (formatted as $X,XXX,XXX)
  - Quarterly breakdown table (Q1–Q4)
  - Base salary and OTE
  - Commission rate (base rate at quota, e.g. "4.44% of new ARR")
  - Accelerator table:
      0–99%:    standard rate
      100–120%: 1.5× rate
      >120%:    2.0× rate
  - Note about Tom Anderson's ramp (if applicable)
  - Signature block: [Manager Name], [Region] VP, Nexus Analytics
  - Space for rep digital acknowledgment

Keep each letter professional, concise (under 400 words), and motivating.

PART 2 — PLANNING CYCLE SPECIFICATION
Write output/planning-cycle-spec.md with these sections:

  # FY2025 Sales Planning Cycle — Nexus Analytics Inc.

  ## Executive Summary
  (1 paragraph: company target, number of reps, regions, key dates)

  ## Territory Design Summary
  (Table: rep name, accounts assigned, enterprise/MM/commercial count,
   total addressable revenue, prospect %, customer %)

  ## Quota Distribution Summary
  (Table: rep name, region, role, annual quota, implied growth vs last year)

  ## Compensation Plan Highlights
  (Pay mix, base commission rates, accelerator tiers — 1 paragraph)

  ## Varicent Setup Checklist
  (Step-by-step numbered checklist for configuring Varicent, covering:
   data table creation, import sequence, calculation rule setup,
   workflow configuration, report setup — at least 20 items)

  ## Key Dates
  (Timeline from now to plan go-live)

  ## Open Items & Risks
  (At least 3 items from TDD Section 8 + any you identify)

Read output/quota-targets.csv if it exists to pull actual quota numbers.
If it doesn't exist yet, use reasonable estimates from the TDD.`;

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
async function runPlanningAgent(customTddPath?: string) {
  const workDir = __dirname;
  const tddPath = customTddPath
    ? path.resolve(customTddPath)
    : path.join(workDir, 'data', 'tdd.txt');

  if (!fs.existsSync(tddPath)) {
    console.error(`TDD not found at: ${tddPath}`);
    process.exit(1);
  }

  // Ensure output directories exist
  fs.mkdirSync(path.join(workDir, 'output', 'quota-letters'), { recursive: true });

  console.log('\n' + '='.repeat(64));
  console.log('  VARICENT SALES PLANNING CYCLE BUILDER');
  console.log('  Powered by Claude Agent SDK');
  console.log('='.repeat(64));
  console.log(`\n  TDD:      ${tddPath}`);
  console.log(`  Data dir: ${path.join(workDir, 'data')}`);
  console.log(`  Output:   ${path.join(workDir, 'output')}`);
  console.log('\n  Starting...\n');

  const prompt = `Generate a complete Varicent FY2025 sales planning cycle for Nexus Analytics Inc.

TDD location: data/tdd.txt
Rep data:     data/reps.csv
Account data: data/accounts.csv
Performance:  data/historical-performance.csv

Follow your system prompt workflow. Read all inputs first, then launch all three
subagents in parallel. When complete, summarize what was produced.`;

  const q = query({
    prompt,
    options: {
      maxTurns: 60,
      cwd: workDir,
      model: 'claude-opus-4-6',
      allowedTools: ['Read', 'Write', 'Glob', 'Agent'],
      systemPrompt: ORCHESTRATOR_PROMPT,
      agents: {
        'territory-analyst': {
          description:
            'Assigns accounts to sales reps based on TDD territory rules (geography, segment, ' +
            'named account overrides, workload balance). Writes output/territory-assignments.csv.',
          prompt: TERRITORY_ANALYST_PROMPT,
          tools: ['Read', 'Write'],
        },
        'quota-calculator': {
          description:
            'Calculates individual rep quotas using the TDD methodology (60% historical ' +
            'attainment, 40% market potential), applies ramp discounts, floors/ceilings, ' +
            'and quarterly seasonality. Writes output/quota-targets.csv.',
          prompt: QUOTA_CALCULATOR_PROMPT,
          tools: ['Read', 'Write'],
        },
        'doc-writer': {
          description:
            'Generates individual quota letters for every rep and a comprehensive planning ' +
            'cycle specification with Varicent setup checklist. Writes output/quota-letters/*.md ' +
            'and output/planning-cycle-spec.md.',
          prompt: DOC_WRITER_PROMPT,
          tools: ['Read', 'Write', 'Glob'],
        },
      },
    },
  });

  // Stream output
  let currentAgentContext = '';
  for await (const msg of q) {
    if (msg.type === 'assistant' && msg.message) {
      for (const block of msg.message.content) {
        if (block.type === 'text' && block.text.trim()) {
          console.log(block.text);
        }
        if (block.type === 'tool_use') {
          const label = block.name === 'Agent'
            ? `[Spawning subagent: ${(block.input as Record<string, string>)?.subagent_type ?? ''}]`
            : `[${block.name}]`;
          if (label !== currentAgentContext) {
            console.log(`\n${label}`);
            currentAgentContext = label;
          }
        }
      }
    }
  }

  // Print file manifest
  console.log('\n' + '='.repeat(64));
  console.log('  OUTPUT FILES GENERATED');
  console.log('='.repeat(64));

  const outputDir = path.join(workDir, 'output');
  const printTree = (dir: string, indent = '  ') => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        console.log(`${indent}${entry.name}/`);
        printTree(fullPath, indent + '  ');
      } else {
        const kb = (fs.statSync(fullPath).size / 1024).toFixed(1);
        console.log(`${indent}${entry.name}  (${kb} KB)`);
      }
    }
  };

  if (fs.existsSync(outputDir)) {
    printTree(outputDir);
  } else {
    console.log('  (no output directory found — check for errors above)');
  }

  console.log('\n' + '='.repeat(64));
  console.log('  Done. Files are ready for Varicent import.');
  console.log('='.repeat(64) + '\n');
}

runPlanningAgent(process.argv[2]).catch(console.error);

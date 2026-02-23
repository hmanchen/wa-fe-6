# WealthArchitect Backend — Complete API Reference

**Version:** 1.0  
**Date:** February 20, 2026  
**Base URL:** `/api/v1`  
**Authentication:** All endpoints require a valid Supabase JWT in the `Authorization: Bearer <token>` header.

---

## Table of Contents

**Financial Computation Endpoints** (deterministic, instant, free)
1. [POST /compute/financial/net-worth](#1-net-worth)
2. [POST /compute/financial/cash-flow](#2-cash-flow)
3. [POST /compute/financial/debt-service](#3-debt-service)
4. [POST /compute/financial/recommendation-mode](#4-recommendation-mode)
5. [POST /compute/financial/debt-health-penalty](#5-debt-health-penalty)
6. [POST /compute/financial/card-portfolio](#6-card-portfolio)
7. [POST /compute/financial/consolidation-options](#7-consolidation-options)
8. [POST /compute/financial/payoff-comparison](#8-payoff-comparison)
9. [POST /compute/financial/promo-rate-analysis](#9-promo-rate-analysis)
10. [POST /compute/financial/informal-debts](#10-informal-debts)
11. [POST /compute/financial/full-analysis](#11-full-analysis)

**Projection Endpoints** (deterministic, instant, free)
12. [POST /compute/projections/iul](#12-iul-projection)
13. [POST /compute/projections/annuity](#13-annuity-projection)
14. [POST /compute/projections/529](#14-529-projection)
15. [POST /compute/projections/iul-college](#15-iul-college-projection)
16. [POST /compute/comparison/401k-vs-iul](#16-401k-vs-iul-comparison)
17. [POST /compute/recommendation-inputs](#17-recommendation-inputs)

**AI Endpoints** (uses AI providers, costs per call)
18. [POST /ai/background-gaps](#18-background-gaps)
19. [POST /ai/background-summary](#19-background-summary)
20. [POST /ai/health-narrative](#20-health-narrative)
21. [POST /ai/protection-gaps](#21-protection-gaps)
22. [POST /ai/estate-urgency](#22-estate-urgency)
23. [POST /ai/xcurve-narration](#23-xcurve-narration)
24. [POST /ai/tax-narrative](#24-tax-narrative)
25. [POST /ai/recommendations](#25-recommendations)
26. [POST /ai/document-review](#26-document-review)
27. [POST /ai/projection-narrative](#27-projection-narrative)

**Admin Endpoints**
28. [POST /admin/ai/reload-providers](#28-reload-providers)
29. [POST /admin/ai/reload-prompts](#29-reload-prompts)
30. [GET /admin/ai/provider-health](#30-provider-health)
31. [GET /admin/ai/cost-report](#31-cost-report)

**Admin AI Provider CRUD**
32. [GET /admin/ai/providers](#32-list-ai-providers-admin)
33. [GET /admin/ai/providers/{id}](#33-get-ai-provider-admin)
34. [POST /admin/ai/providers](#34-create-ai-provider-admin)
35. [PUT /admin/ai/providers/{id}](#35-update-ai-provider-admin)
36. [DELETE /admin/ai/providers/{id}](#36-delete-ai-provider-admin)

**Presentation Flow Computation Endpoints** (Phases 5-8, deterministic, free)
37. [POST /compute/financial/xcurve-data](#37-x-curve-data)
38. [POST /compute/financial/college-funding-comparison](#38-college-funding-comparison)
39. [POST /compute/financial/rollover-options](#39-rollover-options)
40. [POST /compute/financial/roth-vs-7702](#40-roth-vs-7702-comparison)

**Presentation Flow AI Endpoint**
41. [POST /ai/debt-strategy-narrative](#41-debt-strategy-narrative)

**Market Data (Live Index Snapshot)**
42. [GET /market/snapshot](#42-market-snapshot)

**Contribution Limits (Reference Data)**
43. [GET /contribution-limits/years](#43-list-available-tax-years)
44. [GET /contribution-limits/{tax_year}](#44-get-contribution-limits-for-a-tax-year)
45. [POST /contribution-limits/](#45-add-a-contribution-limit)
46. [PUT /contribution-limits/{limit_id}](#46-update-a-contribution-limit)
47. [DELETE /contribution-limits/{limit_id}](#47-delete-a-contribution-limit)

---

## Response Wrapper

Every response follows this structure:

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

On error:

```json
{
  "success": false,
  "error": "error_code",
  "message": "Human-readable description",
  "detail": null
}
```

---

# Financial Computation Endpoints

All endpoints under `/api/v1/compute/financial/`. Deterministic math only — no AI calls, zero cost, instant response. Results are stored in `case_computations` for later retrieval.

---

## 1. Net Worth

**`POST /api/v1/compute/financial/net-worth`**

Computes comprehensive net worth with asset categories, multi-lien real estate equity, red flags, and liquidity scoring.

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `case_id` | UUID | Yes | — | The case to analyse |

```json
{
  "case_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `total_assets` | float | Sum of all asset net values + real estate equity |
| `total_liabilities` | float | Sum of all liens (mortgages, HELOCs) + consumer debts |
| `net_worth` | float | total_assets (assets already have loans deducted) |
| `categories` | object | Breakdown by category (see below) |
| `red_flags` | string[] | Critical issues detected |
| `liquidity_score` | string | `"healthy"`, `"tight"`, or `"critical"` |
| `real_estate_concentration` | float | % of net worth in real estate |

**`categories` object** — keys: `retirement`, `real_estate`, `cash_liquid`, `investments`, `education`, `other_assets`. Each contains:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name (e.g., "Retirement") |
| `total` | float | Category total |
| `percentage` | float | % of total assets |
| `accounts` | array | Individual accounts |
| `is_liquid` | bool | Whether category is liquid |

**Each account in `accounts`:**

For financial assets:

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | e.g., "401(k) - Delta" |
| `gross_value` | float | Value before loan deduction |
| `loan_against` | float | Amount borrowed against this asset |
| `net_value` | float | gross_value - loan_against |

For real estate:

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | e.g., "Primary Home" |
| `value` | float | Market value |
| `total_liens` | float | Sum of all mortgages/HELOCs/liens |
| `equity` | float | value - total_liens |
| `breakdown` | object | `{ "mortgage": 400000, "heloc": 100000 }` |

### Example Response

```json
{
  "success": true,
  "data": {
    "total_assets": 875000,
    "total_liabilities": 625000,
    "net_worth": 875000,
    "categories": {
      "retirement": {
        "name": "Retirement",
        "total": 175000,
        "percentage": 20.0,
        "accounts": [
          {
            "label": "401(k) - Delta",
            "gross_value": 200000,
            "loan_against": 25000,
            "net_value": 175000
          }
        ],
        "is_liquid": false
      },
      "real_estate": {
        "name": "Real Estate Equity",
        "total": 250000,
        "percentage": 28.6,
        "accounts": [
          {
            "label": "Primary Home",
            "value": 750000,
            "total_liens": 500000,
            "equity": 250000,
            "breakdown": { "mortgage": 400000, "heloc": 100000 }
          }
        ],
        "is_liquid": false
      },
      "cash_liquid": {
        "name": "Cash & Liquid",
        "total": 45000,
        "percentage": 5.1,
        "accounts": [
          { "label": "Chase Savings", "gross_value": 45000, "loan_against": 0, "net_value": 45000 }
        ],
        "is_liquid": true
      }
    },
    "red_flags": [
      "401(k) loan: $25,000 against 401(k) - Delta. If separated from employer, becomes taxable distribution + 10% penalty = ~$8,750 in taxes/penalties.",
      "$125,000 in consumer debt (non-mortgage). This includes credit cards, personal loans, HELOC, and 401(k) loans."
    ],
    "liquidity_score": "tight",
    "real_estate_concentration": 28.6
  }
}
```

### DB tables read

`case_assets`, `case_real_estate`, `case_debts`

### Stores result as

`case_computations` row with `computation_type = "net_worth"`

---

## 2. Cash Flow

**`POST /api/v1/compute/financial/cash-flow`**

Computes true monthly cash flow: gross income → taxes → pre-tax deductions → take-home → expenses → surplus or deficit.

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `case_id` | UUID | Yes | — | The case to analyse |
| `state` | string | No | `"GA"` | Two-letter state code for state tax estimation |

```json
{
  "case_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "state": "GA"
}
```

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| **Income** | | |
| `monthly_gross_income` | float | Total monthly gross from all sources |
| `income_sources` | array | Per-source breakdown (see below) |
| **Deductions** | | |
| `monthly_estimated_taxes` | float | Federal + state + FICA |
| `monthly_retirement_contributions` | float | 401(k), 403(b), etc. |
| `monthly_health_insurance` | float | Health insurance premiums |
| `monthly_other_deductions` | float | HSA, 401(k) loan repayments |
| `total_deductions` | float | Sum of all deductions |
| **Take-Home** | | |
| `monthly_net_take_home` | float | Gross minus all deductions |
| **Expenses** | | |
| `monthly_fixed_expenses` | float | Housing, insurance, childcare, utilities |
| `monthly_debt_service` | float | Credit cards, HELOC, personal loans |
| `monthly_discretionary` | float | Entertainment, subscriptions |
| `monthly_remittances` | float | International money transfers |
| `total_monthly_expenses` | float | Sum of all expense categories |
| **Bottom Line** | | |
| `monthly_surplus_or_deficit` | float | Net take-home minus total expenses (negative = deficit) |
| `annual_surplus_or_deficit` | float | Monthly × 12 |
| `status` | string | `"positive"`, `"break_even"`, or `"deficit"` |
| `warnings` | string[] | Cash flow warnings |

**Each item in `income_sources`:**

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | e.g., "Primary Salary - Delta" |
| `person` | string | `"client"` or `"spouse"` |
| `monthly` | float | Monthly amount |
| `annual` | float | Annual amount |
| `type` | string | Source type (salary, rental_net, etc.) |
| `is_stable` | bool | Whether income is stable |

### Example Response

```json
{
  "success": true,
  "data": {
    "monthly_gross_income": 20833,
    "income_sources": [
      { "label": "Salary - Delta", "person": "client", "monthly": 14583, "annual": 175000, "type": "salary", "is_stable": true },
      { "label": "Salary - Spouse", "person": "spouse", "monthly": 6250, "annual": 75000, "type": "salary", "is_stable": true }
    ],
    "monthly_estimated_taxes": 5200,
    "monthly_retirement_contributions": 1750,
    "monthly_health_insurance": 450,
    "monthly_other_deductions": 520,
    "total_deductions": 7920,
    "monthly_net_take_home": 12913,
    "monthly_fixed_expenses": 6800,
    "monthly_debt_service": 4980,
    "monthly_discretionary": 1200,
    "monthly_remittances": 1500,
    "total_monthly_expenses": 14480,
    "monthly_surplus_or_deficit": -1567,
    "annual_surplus_or_deficit": -18804,
    "status": "deficit",
    "warnings": [
      "CASH FLOW NEGATIVE: Spending $1,567/month more than earning. Annual deficit: $18,804. Debt is likely growing. This triggers PHASED recommendation mode.",
      "Debt payments ($4,980/mo) exceed retirement savings ($1,750/mo). More money going to creditors than to the future."
    ]
  }
}
```

### DB tables read

`case_income`, `case_expenses`, `case_assets`, `case_debts`

### Stores result as

`case_computations` row with `computation_type = "cash_flow"`

---

## 3. Debt Service

**`POST /api/v1/compute/financial/debt-service`**

Analyses every debt: interest costs, payoff timelines, classic + smart avalanche strategies, 401(k) loan risk, and debt-emergency detection.

**Prerequisite:** Run `/cash-flow` first for best results (uses stored retirement contribution and surplus data).

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `case_id` | UUID | Yes | — | The case to analyse |

```json
{
  "case_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| **Summary** | | |
| `total_consumer_debt` | float | Total non-mortgage consumer debt |
| `total_monthly_minimum` | float | Sum of all minimum payments |
| `total_monthly_interest` | float | Total interest accruing per month |
| `total_annual_interest` | float | Total interest per year |
| `monthly_principal_reduction` | float | How much actually reduces balances |
| **Per-Debt Detail** | | |
| `debts` | DebtItem[] | Array of individual debt analyses (see below) |
| **High-Interest** | | |
| `high_interest_total` | float | Debt with APR > 10% |
| `high_interest_monthly_cost` | float | Monthly interest on high-APR debt |
| `high_interest_annual_cost` | float | Annual interest on high-APR debt |
| **Payoff** | | |
| `debt_free_months` | int or null | Months until all consumer debt paid at current payments. null = never |
| `total_interest_if_current_payments` | float | Total future interest if payments don't change |
| **Strategies** | | |
| `avalanche_strategy` | object | Classic avalanche (highest APR first) result |
| `smart_avalanche_strategy` | object | Enhanced avalanche (promo-aware, skips 401k loans) result |
| **Emergency** | | |
| `is_debt_emergency` | bool | True if interest > 80% of retirement savings |
| `debt_vs_savings_ratio` | float | Annual interest / annual retirement savings × 100 |
| `warnings` | string[] | Critical warnings |
| `four01k_loan_risks` | array | 401(k)/403(b)/TSP loan risk details |

**Each item in `debts` (DebtItem):**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Debt identifier |
| `label` | string | Display name |
| `debt_type` | string | e.g., "credit_card", "heloc" |
| `balance` | float | Current balance |
| `apr` | float | Annual percentage rate |
| `minimum_payment` | float | Minimum monthly payment |
| `actual_payment` | float | What client actually pays |
| `monthly_interest` | float | Dollar amount of monthly interest |
| `monthly_principal` | float | Dollar amount reducing the balance |
| `is_variable` | bool | Variable rate flag |
| `is_tax_deductible` | bool | Tax-deductible interest |
| `payoff_months_at_minimum` | int or null | Months to pay off at minimum. null = never |
| `total_interest_at_minimum` | float | Total interest paid if only minimums |
| `risk_notes` | string[] | Risk warnings for this debt |

**`avalanche_strategy` / `smart_avalanche_strategy` object:**

| Field | Type | Description |
|-------|------|-------------|
| `strategy` | string | `"avalanche"` or `"smart_avalanche"` |
| `extra_monthly` | float | Extra payment amount used |
| `payoff_months` | int or null | Months to pay off all debt |
| `payoff_order` | array | `[{ "label": "...", "month": 5 }]` |
| `total_paid` | float | Total money spent |
| `total_interest` | float | Total interest paid |
| `attack_order` | array | (smart only) Prioritised list with urgency levels |

**Each item in `four01k_loan_risks`:**

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | e.g., "Delta 401(k) Loan" |
| `balance` | float | Loan balance |
| `employer` | string | Employer name |
| `tax_penalty_estimate` | float | Estimated tax + penalty if separated |
| `risk` | string | Human-readable risk explanation |

### Stores result as

`case_computations` row with `computation_type = "debt_service"`

---

## 4. Recommendation Mode

**`POST /api/v1/compute/financial/recommendation-mode`**

Detects whether to use standard 3-tier recommendations or the phased approach (debt triage first).

**Prerequisite:** Run `/cash-flow` and `/debt-service` first (reads their stored results).

### Request Body

```json
{
  "case_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `mode` | string | `"standard_tiers"` or `"phased"` |
| `reason` | string | Human-readable explanation |
| `details` | object | Mode-specific details (see below) |

**`details` for `"phased"` mode:**

| Field | Type | Description |
|-------|------|-------------|
| `triggers` | string[] | What caused phased mode |
| `approach` | string | Phase 1 → Phase 2 → Phase 3 description |
| `ai_prompt_override` | string | `"recommendation_narratives_phased"` |
| `note_to_advisor` | string | Advisor guidance |

**`details` for `"standard_tiers"` mode:**

| Field | Type | Description |
|-------|------|-------------|
| `approach` | string | "Standard 3-tier: Optimize -> Fill Gaps -> Complete Plan" |
| `ai_prompt_override` | null | No override needed |

### Example Response (phased)

```json
{
  "success": true,
  "data": {
    "mode": "phased",
    "reason": "Client requires debt triage before insurance products.",
    "details": {
      "triggers": [
        "Cash flow is NEGATIVE — spending more than earning",
        "Debt emergency — interest exceeds retirement savings rate",
        "$67,000 in high-interest debt with only $-1,567/month surplus"
      ],
      "approach": "Phase 1: Debt elimination + estate planning. Phase 2: Basic affordable protection (term + disability). Phase 3: Full plan (IUL, annuity, education) with freed-up cash flow.",
      "ai_prompt_override": "recommendation_narratives_phased",
      "note_to_advisor": "Do NOT lead with insurance products. This client needs debt strategy first."
    }
  }
}
```

### Stores result as

`case_computations` row with `computation_type = "recommendation_mode"`

---

## 5. Debt Health Penalty

**`POST /api/v1/compute/financial/debt-health-penalty`**

Computes the debt penalty to subtract from the 0-100 health score. Runs cash flow and debt service internally — no prerequisites needed.

### Request Body

```json
{
  "case_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `total_penalty` | int | Points to subtract (0 to -30) |
| `reasons` | string[] | Explanation of each penalty component |

### Example Response

```json
{
  "success": true,
  "data": {
    "total_penalty": 25,
    "reasons": [
      "-12 pts: $67,000 in high-interest debt",
      "-10 pts: Cash flow is negative ($1,567/mo deficit)",
      "-3 pts: Active 401(k) loan — separation risk"
    ]
  }
}
```

---

## 6. Card Portfolio

**`POST /api/v1/compute/financial/card-portfolio`**

Multi-card credit card portfolio analysis. Automatically filters to credit cards, store cards, and cash advances from all debts.

### Request Body

```json
{
  "case_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| **Overview** | | |
| `total_cards` | int | Total credit cards in portfolio |
| `cards_with_balance` | int | Cards carrying a balance |
| `cards_at_zero` | int | Cards with $0 balance |
| `total_balance` | float | Total card debt |
| `total_credit_limit` | float | Total credit limit across all cards |
| `aggregate_utilization_pct` | float | Total balance / total limit × 100 |
| `total_minimum_payments` | float | Sum of all minimum payments |
| `total_monthly_interest` | float | Total monthly interest |
| `total_annual_interest` | float | Total annual interest |
| `effective_blended_apr` | float | Weighted average APR |
| **Card Tiers** | | |
| `high_apr_cards` | CardSummary[] | Cards with effective APR > 15% |
| `mid_apr_cards` | CardSummary[] | Cards with 5% < APR ≤ 15% |
| `low_apr_cards` | CardSummary[] | Cards with APR ≤ 5% |
| `promo_cards` | CardSummary[] | Cards on promotional rate |
| `zero_balance_cards` | CardSummary[] | Cards with $0 balance |
| **Available Credit** | | |
| `total_available_credit` | float | Total unused credit |
| `available_on_zero_pct_cards` | float | Credit available on 0% cards specifically |
| **Fatigue** | | |
| `debt_fatigue_score` | int | 0-100 psychological overwhelm score |
| `debt_fatigue_triggers` | string[] | What's causing fatigue |
| **Credit Impact** | | |
| `credit_utilization_impact` | object | `{ aggregate_pct, impact, cards_over_50_pct, cards_over_75_pct, target }` |
| **Payoff** | | |
| `months_to_payoff_minimums_only` | int or null | Months to clear all cards at minimums. null = never |
| `total_interest_minimums_only` | float | Total interest if only minimums paid |
| `warnings` | string[] | Portfolio-level warnings |

**Each CardSummary:**

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Card name |
| `balance` | float | Current balance |
| `credit_limit` | float | Credit limit |
| `apr` | float | Regular APR |
| `is_promo` | bool | On promotional rate |
| `promo_expiration` | string or null | Promo expiration date |
| `post_promo_apr` | float | Rate after promo ends |
| `effective_apr` | float | Current effective rate |
| `minimum_payment` | float | Monthly minimum |
| `monthly_interest` | float | Monthly interest in dollars |
| `utilization_pct` | float | This card's utilization |
| `urgency` | string | `"emergency"`, `"high"`, `"moderate"`, `"low"`, `"strategic"` |

### Stores result as

`case_computations` row with `computation_type = "card_portfolio"`

---

## 7. Consolidation Options

**`POST /api/v1/compute/financial/consolidation-options`**

Analyses and ranks debt consolidation strategies for credit card portfolios.

**Prerequisite:** Run `/cash-flow` first (reads stored surplus).

### Request Body

```json
{
  "case_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `current_state` | object | `{ total_balance, active_cards, blended_apr, monthly_interest, annual_interest, total_minimum_payments }` |
| `options` | ConsolidationOption[] | Ranked list of strategies (see below) |
| `best_option` | ConsolidationOption or null | Top-ranked feasible option |
| `advisor_recommendation` | string | One-sentence recommendation |
| `simplification_summary` | string | e.g., "Go from 15 monthly payments to 1" |
| `warnings` | string[] | Advisor-level warnings |

**Each ConsolidationOption:**

| Field | Type | Description |
|-------|------|-------------|
| `strategy` | string | `"internal_balance_transfer"`, `"new_balance_transfer_card"`, `"personal_loan_consolidation"`, `"home_equity"`, `"smart_avalanche_only"` |
| `description` | string | Human-readable explanation |
| `cards_affected` | string[] | Which cards this strategy targets |
| `balance_moved` | float | Dollar amount moved |
| `from_apr` | float | Weighted APR of debt being moved |
| `to_apr` | float | New APR after consolidation |
| `monthly_interest_saved` | float | Monthly interest savings |
| `annual_interest_saved` | float | Annual interest savings |
| `monthly_payment_reduction` | float | Reduction in total monthly payments |
| `new_payment_count` | int | Number of payments after consolidation |
| `risks` | string[] | Risk factors |
| `requirements` | string[] | What's needed to execute |
| `feasibility` | string | `"ready"`, `"possible"`, or `"unlikely"` |
| `priority` | int | Lower = better option (1 is best) |

### Stores result as

`case_computations` row with `computation_type = "consolidation"`

---

## 8. Payoff Comparison

**`POST /api/v1/compute/financial/payoff-comparison`**

Side-by-side Snowball vs Avalanche vs Hybrid payoff strategy comparison. Excludes 401(k)/403(b)/TSP loans.

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `case_id` | UUID | Yes | — | The case to analyse |
| `extra_monthly` | float | No | `0` | Extra dollars per month for accelerated payoff |

```json
{
  "case_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "extra_monthly": 1000
}
```

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `avalanche` | object | Avalanche strategy results |
| `snowball` | object | Snowball strategy results |
| `comparison` | object | Head-to-head metrics |
| `recommendation` | string | `"avalanche"`, `"snowball"`, or `"hybrid"` |
| `recommendation_reason` | string | Why this strategy was recommended |
| `hybrid_suggestion` | string or null | If hybrid, what to do |

**`avalanche` / `snowball` object:**

| Field | Type | Description |
|-------|------|-------------|
| `months_to_payoff` | int | Total months to clear all debt |
| `total_interest` | float | Total interest paid |
| `total_paid` | float | Total money spent (principal + interest) |
| `elimination_timeline` | array | `[{ "label": "Macy's Card", "month": 3, "strategy": "snowball" }]` |
| `cards_eliminated_by_month_6` | int | Quick-win count |

**`comparison` object:**

| Field | Type | Description |
|-------|------|-------------|
| `interest_saved_by_avalanche` | float | How much more interest snowball costs |
| `months_faster_avalanche` | int | How many months sooner avalanche finishes |
| `quick_win_advantage_snowball` | int | Extra cards snowball eliminates in 6 months |

### Example Response

```json
{
  "success": true,
  "data": {
    "avalanche": {
      "months_to_payoff": 28,
      "total_interest": 18500,
      "total_paid": 105500,
      "elimination_timeline": [
        { "label": "Macy's Store Card", "month": 4, "strategy": "avalanche" },
        { "label": "Capital One Venture", "month": 12, "strategy": "avalanche" }
      ],
      "cards_eliminated_by_month_6": 2
    },
    "snowball": {
      "months_to_payoff": 30,
      "total_interest": 21200,
      "total_paid": 108200,
      "elimination_timeline": [
        { "label": "Amazon Card", "month": 2, "strategy": "snowball" },
        { "label": "PenFed Platinum", "month": 3, "strategy": "snowball" },
        { "label": "Macy's Store Card", "month": 5, "strategy": "snowball" }
      ],
      "cards_eliminated_by_month_6": 3
    },
    "comparison": {
      "interest_saved_by_avalanche": 2700,
      "months_faster_avalanche": 2,
      "quick_win_advantage_snowball": 1
    },
    "recommendation": "hybrid",
    "recommendation_reason": "Consider a hybrid: knock out the 2 smallest balances first (snowball) for quick wins, then switch to avalanche for the rest.",
    "hybrid_suggestion": "Consider a hybrid: knock out the 2 smallest balances first (snowball) for quick wins, then switch to avalanche."
  }
}
```

### Does NOT store result

This endpoint returns the result directly without persisting to `case_computations`.

---

## 9. Promo Rate Analysis

**`POST /api/v1/compute/financial/promo-rate-analysis`**

Analyses all promotional/introductory rate debts. Detects expiring promos, computes deferred-interest "bombs", and generates severity-ranked alerts.

### Request Body

```json
{
  "case_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `has_promotional_debts` | bool | Whether any promo debts exist |
| `count` | int | Number of promo debts (only if has_promotional_debts) |
| `total_promo_balance` | float | Total balance on promo debts |
| `debts` | array | Per-debt promo analysis (see below) |
| `alerts` | array | Severity-ranked alerts (see below) |

**Each item in `debts`:**

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Debt name |
| `balance` | float | Current balance |
| `current_rate` | string | e.g., "0%" |
| `post_promo_rate` | string | e.g., "24.99%" |
| `expiration_date` | string | ISO date |
| `days_remaining` | int | Days until expiration |
| `months_remaining` | int | Months until expiration |
| `monthly_payment_to_clear` | float | Payment needed to clear before expiration |
| `is_deferred_interest` | bool | If true, retroactive interest applies |
| `deferred_interest_bomb` | float | (if deferred) Estimated retroactive interest amount |
| `warning` | string | (if applicable) Human-readable warning |

**Each item in `alerts`:**

| Field | Type | Description |
|-------|------|-------------|
| `severity` | string | `"emergency"`, `"high"`, or `"moderate"` |
| `label` | string | Debt name |
| `message` | string | Detailed alert message |

---

## 10. Informal Debts

**`POST /api/v1/compute/financial/informal-debts`**

Analyses informal/hand loans (family, friend, community, employer) with cultural context, insurance impact, and advisor guidance.

### Request Body

```json
{
  "case_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `has_informal_debts` | bool | Whether any informal debts exist |
| `count` | int | Number of informal debts |
| `total_balance` | float | Total informal debt |
| `total_monthly_payment` | float | Total monthly payments on informal debts |
| `items` | array | Per-debt details (see below) |
| `advisor_notes` | string[] | Cultural context and guidance for the advisor |
| `insurance_impact` | string | How informal debts affect insurance needs |

**Each item in `items`:**

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | e.g., "Uncle Ravi hand loan" |
| `creditor` | string | Who the money is owed to |
| `relationship` | string | e.g., "Uncle", "Friend" |
| `balance` | float | Amount owed |
| `interest_rate` | float | Usually 0 |
| `monthly_payment` | float | Current payment |
| `has_written_agreement` | bool | Whether there's a signed note |
| `repayment_expectation` | string | `"strict_monthly"`, `"flexible"`, `"whenever_possible"`, `"lump_sum_future"` |
| `social_note` | string | Cultural/social context |

---

## 11. Full Analysis

**`POST /api/v1/compute/financial/full-analysis`**

Master endpoint. Runs ALL computation engines in dependency order and stores every result. Use when the advisor clicks "Run Full Analysis" or navigates to the Recommendations screen.

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `case_id` | UUID | Yes | — | The case to analyse |
| `state` | string | No | `"GA"` | Two-letter state code |

```json
{
  "case_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "state": "GA"
}
```

### Response — `data` object

Returns a nested object containing ALL engine outputs:

| Key | Type | Description |
|-----|------|-------------|
| `net_worth` | object | Same as `/net-worth` response |
| `cash_flow` | object | Same as `/cash-flow` response |
| `debt_service` | object | Same as `/debt-service` response |
| `recommendation_mode` | object | Same as `/recommendation-mode` response |
| `health_score_penalty` | object | Same as `/debt-health-penalty` response |
| `promo_rates` | object | Same as `/promo-rate-analysis` response |
| `informal_debts` | object | Same as `/informal-debts` response |
| `card_portfolio` | object | Same as `/card-portfolio` response (only if credit cards exist) |

### Response — `meta` object

| Field | Type | Description |
|-------|------|-------------|
| `computation_time_ms` | int | Total wall-clock time in milliseconds |
| `engines_run` | string[] | List of engines that executed |

### Execution Order

```
1. Net Worth         → reads: case_assets, case_real_estate, case_debts
2. Cash Flow         → reads: case_income, case_expenses, case_assets, case_debts
3. Debt Service      → reads: case_debts + output from step 2
4. Recommendation Mode → reads: output from steps 2 & 3
5. Health Score Penalty → reads: output from steps 2 & 3
6. Card Portfolio     → reads: case_debts (credit cards only, skipped if none)
7. Promo Rates        → reads: case_debts
8. Informal Debts     → reads: case_debts
```

### Stores results as

8 rows in `case_computations` (one per engine), each upserted.

---

# Projection Endpoints

All endpoints under `/api/v1/compute/`. Deterministic projections — no AI, no DB writes.

---

## 12. IUL Projection

**`POST /api/v1/compute/projections/iul`**

Projects Indexed Universal Life policy growth over time.

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `case_id` | UUID | No | null | Optional case reference |
| `monthly_premium` | float | No | `800` | Monthly premium payment |
| `death_benefit` | float | No | `1,500,000` | Target death benefit |
| `client_age` | int | No | `35` | Client's current age |
| `projection_years` | int | No | `30` | How many years to project |

### Response — `data` object

Contains year-by-year projection with cash value, death benefit, and milestone markers. Includes compliance disclaimer.

---

## 13. Annuity Projection

**`POST /api/v1/compute/projections/annuity`**

Projects annuity accumulation and income phases.

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `initial_deposit` | float | No | `0` | Lump sum deposit |
| `monthly_contribution` | float | No | `500` | Monthly contribution |
| `client_age` | int | No | `35` | Client's current age |
| `income_start_age` | int | No | `65` | Age to begin income |

### Response — `data` object

Contains accumulation phase, income phase projections, and total income estimates. Includes compliance disclaimer.

---

## 14. 529 Projection

**`POST /api/v1/compute/projections/529`**

Projects 529 education savings growth.

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `monthly_contribution` | float | No | `200` | Monthly contribution |
| `current_balance` | float | No | `0` | Starting balance |
| `years_to_college` | int | No | `13` | Years until college starts |

### Response — `data` object

Contains year-by-year growth, total contributions, projected value at college, and coverage estimate vs average tuition.

---

## 15. IUL College Projection

**`POST /api/v1/compute/projections/iul-college`**

Projects IUL as a college funding vehicle (cash value withdrawals for education).

### Request Body

Same as [IUL Projection](#12-iul-projection) — `projection_years` is used as `years_to_college`.

---

## 16. 401(k) vs IUL Comparison

**`POST /api/v1/compute/comparison/401k-vs-iul`**

Side-by-side comparison of contributing to 401(k) vs IUL.

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `monthly_amount` | float | No | `1,950` | Monthly contribution |
| `client_age` | int | No | `35` | Client's current age |
| `tax_bracket_pct` | float | No | `24` | Marginal tax rate |
| `retirement_age` | int | No | `65` | Target retirement age |

### Response — `data` object

Contains year-by-year comparison of both strategies, tax impact, access differences, and death benefit value.

---

## 17. Recommendation Inputs

**`POST /api/v1/compute/recommendation-inputs`**

Computes the redirectable money sources and recommendation parameters from case data.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `case_id` | UUID | Yes | The case to analyse |

### Response — `data` object

Contains identified money sources (above-match 401k, unused surplus, etc.), premium capacity ranges, and recommended allocations for the AI recommendation engine.

---

# AI Endpoints

All endpoints under `/api/v1/ai/`. These call AI providers and incur cost per call. Every response includes an `meta` object with provider, cost, and latency.

### Common Request Body (for all except document-review)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `case_id` | UUID | Yes | — | The case to analyse |
| `quality_override` | string | No | null | Override routing: `"cheapest"`, `"balanced"`, `"best_quality"` |

```json
{
  "case_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "quality_override": null
}
```

### Common `meta` object (returned with every AI response)

| Field | Type | Description |
|-------|------|-------------|
| `provider` | string | Which AI provider was used (e.g., "deepseek_chat") |
| `model_id` | string | Specific model (e.g., "deepseek-chat") |
| `cost_usd` | float | Cost of this call in USD |
| `latency_ms` | int | Response time in milliseconds |
| `languages` | object | `{ "primary": "en", "translated": "hi" }` |

---

## 18. Background Gaps

**`POST /api/v1/ai/background-gaps`**

AI analyses the client's financial background and identifies gaps, issues, and positive observations.

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `client_visible_gaps` | array | Gaps to show the client. Each: `{ icon, category, title, explanation, impact }` |
| `advisor_only_hints` | array | Advisor-only insights. Each: `{ icon, hint, context }` |
| `positive_observations` | array | Things the client is doing right |

---

## 19. Background Summary

**`POST /api/v1/ai/background-summary`**

Generates a natural-language summary of the client's financial background.

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `summary_narrative` | string | 2-3 paragraph summary |
| `key_strengths` | string[] | Client's financial strengths |
| `key_gaps` | string[] | Main gaps identified |
| `transition_statement` | string | Bridges to the next screen |

---

## 20. Health Narrative

**`POST /api/v1/ai/health-narrative`**

Generates the narrative for the financial health score screen.

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `headline` | string | One-line summary (e.g., "Your Financial Health: 62/100") |
| `client_narrative` | string | Multi-paragraph explanation |
| `positive_callouts` | string[] | Positive elements |
| `most_urgent` | string | The single most urgent issue |

---

## 21. Protection Gaps

**`POST /api/v1/ai/protection-gaps`**

Identifies life insurance, disability, and LTC protection gaps.

### Response — `data` object

Array of protection alerts, each with `{ priority, icon, message, client_impact }`.

---

## 22. Estate Urgency

**`POST /api/v1/ai/estate-urgency`**

Analyses estate planning urgency: wills, trusts, POA, healthcare directives.

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `urgency_narrative` | string | Why estate planning matters now |
| `documents_needed` | array | Each: `{ document, status, urgency }` |
| `estimated_probate_cost` | string | Estimated cost if no trust |
| `key_risk` | string | Biggest estate risk |

---

## 23. X-Curve Narration

**`POST /api/v1/ai/xcurve-narration`**

Narrates the X-Curve (responsibility vs wealth over time) for the client.

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `opening_narrative` | string | Sets the scene |
| `responsibility_explanation` | string | How responsibilities decrease over time |
| `wealth_explanation` | string | How wealth grows over time |
| `crossover_explanation` | string | What happens at the crossover point |
| `gap_summary` | string | The protection gap before crossover |

---

## 24. Tax Narrative

**`POST /api/v1/ai/tax-narrative`**

Generates the tax diversification analysis narrative.

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `bucket_narrative` | string | Explains tax-now / tax-later / tax-advantaged split |
| `diversification_recommendation` | string | What to change |
| `rmd_warning` | string or null | Required Minimum Distribution warning |
| `roth_vs_7702_narrative` | string or null | Roth vs IUL (7702) comparison |
| `action_bridge` | string or null | Bridges to recommendations |

---

## 25. Recommendations

**`POST /api/v1/ai/recommendations`**

Generates the full 3-tier recommendation set (or phased recommendations if recommendation mode is "phased").

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `executive_summary` | string | 2-3 sentence overview |
| `money_found` | object | `{ narrative, redirectable_monthly, sources: [{ source, current_amount_monthly, redirect_amount_monthly, justification }] }` |
| `tiers` | array | 3 tiers (see below) |
| `comparison_table` | object | `{ headers: [...], rows: [{ metric, values: [...] }] }` |
| `key_insight` | string | Single most powerful statement |
| `next_steps_timeline` | array | `[{ timeframe, action }]` |

**Each tier:**

| Field | Type | Description |
|-------|------|-------------|
| `tier` | int | 1, 2, or 3 |
| `name` | string | Tier name |
| `subtitle` | string | Tier description |
| `total_new_monthly_cost` | float | Monthly cost for this tier |
| `health_score_after` | float | Projected health score |
| `recommendations` | array | Individual recommendations |

**Each recommendation:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique ID |
| `priority` | int | Priority within tier |
| `product_type` | string | e.g., "term_life", "iul", "annuity" |
| `title` | string | Recommendation title |
| `gap_addressed` | string | Which gap this fixes |
| `what` | string | What to do |
| `how_funded` | string | How to pay for it |
| `why` | string | Why it matters |
| `justification` | string | Mathematical justification |
| `what_if_not` | string | Consequence of inaction |
| `monthly_cost` | float | Monthly cost |
| `annual_benefit` | string | Annual benefit description |

---

## 26. Document Review

**`POST /api/v1/ai/document-review`**

Uploads and reviews an insurance policy document (PDF, PNG, or JPEG).

### Request — multipart/form-data

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `case_id` | UUID | Yes | The case this document belongs to |
| `file` | File | Yes | PDF, PNG, or JPEG file |

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `policy_summary` | object | `{ carrier, policy_type, coverage_amount, annual_premium, term_length, issue_date, riders }` |
| `strengths` | string[] | What's good about the policy |
| `weaknesses` | array | `[{ issue, detail, severity }]` |
| `fit_assessment` | object | `{ overall_fit, explanation, coverage_gap }` |
| `advisor_discussion_points` | string[] | Talking points for the advisor |
| `disclaimer` | string | Legal disclaimer |

---

## 27. Projection Narrative

**`POST /api/v1/ai/projection-narrative`**

Wraps computed IUL/annuity/529 projections in natural language for the client.

### Response — `data` object

AI-generated narrative explaining the projection numbers in client-friendly language.

---

# Admin Endpoints

All endpoints under `/api/v1/admin/ai/`. Require authentication.

---

## 28. Reload Providers

**`POST /api/v1/admin/ai/reload-providers`**

Hot-reloads AI provider configurations from the database without restarting the server.

### Request Body

None.

### Response

```json
{
  "success": true,
  "data": { "status": "reloaded" }
}
```

---

## 29. Reload Prompts

**`POST /api/v1/admin/ai/reload-prompts`**

Hot-reloads AI prompts and routing rules from the database.

### Request Body

None.

### Response

```json
{
  "success": true,
  "data": { "status": "reloaded" }
}
```

---

## 30. Provider Health

**`GET /api/v1/admin/ai/provider-health`**

Returns the status and performance metrics of all configured AI providers.

### Response — `data` array

Each item:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Provider identifier (e.g., "deepseek_chat") |
| `display_name` | string | Human-readable name |
| `is_active` | bool | Whether provider is enabled |
| `avg_latency_ms` | int | Average response time |
| `quality_rating` | int | Quality score (1-100) |
| `priority_tier` | string | `"budget"`, `"standard"`, or `"premium"` |

---

## 31. Cost Report

**`GET /api/v1/admin/ai/cost-report`**

Returns aggregated AI cost analytics grouped by task type and provider.

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `rows` | array | Per task/provider breakdown |
| `total_cost_usd` | float | Total spend across all providers |
| `total_calls` | int | Total number of AI calls |

**Each row:**

| Field | Type | Description |
|-------|------|-------------|
| `task_type` | string | e.g., "gap_analysis", "recommendation_narratives" |
| `provider_name` | string | Which provider handled it |
| `total_calls` | int | Number of calls |
| `total_cost_usd` | float | Total cost for this combination |
| `avg_latency_ms` | float | Average response time |

### Example Response

```json
{
  "success": true,
  "data": {
    "rows": [
      { "task_type": "gap_analysis", "provider_name": "deepseek_chat", "total_calls": 47, "total_cost_usd": 0.023, "avg_latency_ms": 3200.5 },
      { "task_type": "recommendation_narratives", "provider_name": "deepseek_reasoner", "total_calls": 12, "total_cost_usd": 0.089, "avg_latency_ms": 8100.2 }
    ],
    "total_cost_usd": 0.112,
    "total_calls": 59
  }
}
```

---

## 32. List AI Providers (Admin)

**`GET /api/v1/admin/ai/providers`**

Returns all configured AI providers with their full configuration. API keys are never exposed — only a `set` / `not_set` status is returned.

### Response — `data` array

Each item:

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Provider UUID |
| `name` | string | Unique internal name (e.g., `deepseek_chat`) |
| `display_name` | string | Human-readable name |
| `api_base_url` | string | Provider's API base URL |
| `api_key_status` | string | `"set"` or `"not_set"` — never the real key |
| `model_id` | string | Model identifier |
| `is_active` | bool | Whether provider is enabled |
| `supports_json_mode` | bool | JSON mode support |
| `supports_vision` | bool | Vision/image support |
| `supports_documents` | bool | Document upload support |
| `max_context_tokens` | int | Context window size |
| `max_output_tokens` | int | Max output tokens |
| `supports_multilingual` | bool | Multilingual support |
| `multilingual_quality` | int | Multilingual quality (1-10) |
| `input_price_per_million` | float | Cost per million input tokens |
| `output_price_per_million` | float | Cost per million output tokens |
| `cache_hit_price_per_million` | float | Cache hit cost |
| `avg_latency_ms` | int | Average response time |
| `quality_rating` | int | Quality score (1-10) |
| `priority_tier` | string | `"budget"`, `"standard"`, or `"premium"` |

---

## 33. Get AI Provider (Admin)

**`GET /api/v1/admin/ai/providers/{provider_id}`**

Returns a single AI provider by UUID.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `provider_id` | uuid | Provider UUID |

### Response

Same structure as a single item from endpoint 32.

---

## 34. Create AI Provider (Admin)

**`POST /api/v1/admin/ai/providers`**

Adds a new AI provider. The `api_key` is encrypted at rest before storage.

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | string | **yes** | — | Unique internal name (e.g., `gpt4o`) |
| `display_name` | string | **yes** | — | Human-readable name |
| `api_base_url` | string | **yes** | — | Provider's API base URL |
| `api_key` | string | **yes** | — | Plain-text API key (encrypted before storage) |
| `model_id` | string | **yes** | — | Model identifier (e.g., `gpt-4o`) |
| `is_active` | bool | no | `true` | Enable immediately |
| `supports_json_mode` | bool | no | `true` | |
| `supports_vision` | bool | no | `false` | |
| `supports_documents` | bool | no | `false` | |
| `max_context_tokens` | int | no | `128000` | |
| `max_output_tokens` | int | no | `4096` | |
| `supports_multilingual` | bool | no | `true` | |
| `multilingual_quality` | int | no | `7` | 1-10 |
| `input_price_per_million` | float | **yes** | — | Cost per million input tokens |
| `output_price_per_million` | float | **yes** | — | Cost per million output tokens |
| `cache_hit_price_per_million` | float | no | `0` | |
| `avg_latency_ms` | int | no | `2000` | |
| `quality_rating` | int | no | `7` | 1-10 |
| `priority_tier` | string | no | `"standard"` | `budget` / `standard` / `premium` |

### Example Request

```json
{
  "name": "gpt4o",
  "display_name": "OpenAI GPT-4o",
  "api_base_url": "https://api.openai.com/v1",
  "api_key": "sk-proj-abc123...",
  "model_id": "gpt-4o",
  "input_price_per_million": 2.50,
  "output_price_per_million": 10.00,
  "quality_rating": 9,
  "priority_tier": "premium"
}
```

### Response (201)

Returns the created provider (same structure as endpoint 32).

### Error Responses

| Status | Condition |
|--------|-----------|
| `409` | Provider with that `name` already exists |

---

## 35. Update AI Provider (Admin)

**`PATCH /api/v1/admin/ai/providers/{provider_id}`**

Partially update a provider. Only supplied fields are changed. If `api_key` is provided, it is encrypted before storage.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `provider_id` | uuid | Provider UUID |

### Request Body

All fields from Create (endpoint 34) are accepted, but **all are optional**. Only include fields you want to change.

### Example — Update API key + activate

```json
{
  "api_key": "sk-new-key-xyz",
  "is_active": true
}
```

### Example — Change model and pricing

```json
{
  "model_id": "gpt-4o-mini",
  "input_price_per_million": 0.15,
  "output_price_per_million": 0.60,
  "priority_tier": "budget"
}
```

### Response

Returns the updated provider (same structure as endpoint 32).

---

## 36. Delete AI Provider (Admin)

**`DELETE /api/v1/admin/ai/providers/{provider_id}`**

Permanently removes a provider. Consider using `PATCH` to set `is_active: false` instead if you want to preserve history.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `provider_id` | uuid | Provider UUID |

### Response

```json
{
  "success": true,
  "data": { "status": "deleted", "name": "gpt4o" }
}
```

---

---

# Presentation Flow — Computation Endpoints (Phases 5-8)

New computation engines for the presentation flow. All deterministic, zero AI cost.

---

## 37. X-Curve Data

**`POST /api/v1/compute/financial/xcurve-data`**

Computes the Financial X-Curve: responsibility curve (declining obligations) vs wealth curve (growing assets). Returns curve data points for charting, insurance need components with formulas, coverage gap, and crossover age.

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `case_id` | uuid | Yes | — | Case UUID |
| `retirement_age` | int | No | `65` | Target retirement age (50–80) |
| `annual_education_cost_per_child` | float | No | `25000` | Annual college cost per child |

### Response Highlights

| Field | Description |
|-------|-------------|
| `responsibility_curve` | Array of `{age, value}` points for charting (declining) |
| `wealth_curve` | Array of `{age, value}` points for charting (growing) |
| `crossover_age` | Age where wealth >= responsibility (self-insured) |
| `components` | Insurance need breakdown with `{key, label, amount, formula, description}` |
| `total_need` | Total insurance need |
| `existing_coverage` | Sum of term + group + permanent coverage |
| `coverage_gap` | `total_need - existing_coverage` |
| `coverage_percentage` | `existing / total × 100` |
| `peak_responsibility_amount` | Maximum obligation amount |
| `retirement_wealth_projected` | Projected wealth at retirement |
| `years_of_maximum_risk` | Years from now until crossover |

---

## 38. College Funding Comparison

**`POST /api/v1/compute/financial/college-funding-comparison`**

Side-by-side comparison of 529 Plan vs IUL policy loan for college funding.

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `case_id` | uuid | Yes | — | Case UUID |
| `child_name` | string | Yes | — | Child's name |
| `child_age` | int | Yes | — | Child's current age (0–17) |
| `monthly_contribution` | float | Yes | — | Monthly savings amount |
| `state` | string | No | `GA` | Two-letter state code |
| `iul_monthly_premium` | float | No | same as 529 | IUL monthly premium |
| `iul_death_benefit` | float | No | `500000` | IUL death benefit |

### Response Highlights

| Field | Description |
|-------|-------------|
| `plan_529.projected_value` | `{conservative, moderate, optimistic}` amounts |
| `plan_529.fafsa_impact_annual` | Annual FAFSA assessment (5.64% of value) |
| `plan_529.scholarship_scenarios` | What happens under full/partial/no scholarship |
| `iul_college.cash_value_at_college` | `{conservative, moderate, optimistic}` amounts |
| `iul_college.fafsa_impact_annual` | Always `0` — invisible to FAFSA |
| `iul_college.death_benefit` | Additional protection value |
| `comparison_table` | 10-row feature comparison with `advantage` field |
| `recommendation` | Personalized recommendation text |

---

## 39. Rollover Options

**`POST /api/v1/compute/financial/rollover-options`**

Analyses 5 rollover options for an old 401(k) and compares systematic withdrawal (4% rule) vs Fixed Index Annuity for retirement income.

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `case_id` | uuid | Yes | — | Case UUID |
| `old_401k_balance` | float | Yes | — | Balance of old 401(k) |
| `employer_name` | string | Yes | — | Previous employer name |
| `client_age` | int | Yes | — | Client's current age |
| `retirement_age` | int | No | `65` | Target retirement age |
| `tax_bracket_pct` | float | No | `24` | Federal marginal tax bracket % |
| `state_tax_pct` | float | No | `5` | State income tax % |

### Response Highlights

| Field | Description |
|-------|-------------|
| `options` | 5 rollover options, each with `name, description, pros, cons, projected_value_at_65, risk_level` |
| `cash_out_penalty` | Exact penalty breakdown: `penalty_10pct, federal_tax, state_tax, total_loss, you_keep, loss_percentage` |
| `systematic_withdrawal` | 4% rule: `balance_at_65, monthly_income, depletion_age` for bear/average/bull scenarios |
| `fia_projection` | FIA: `benefit_base_at_65, guaranteed_monthly_income, income_for_life, floor` |
| `comparison_table` | 6-row comparison (monthly income, duration, risk, upside, flexibility, peace of mind) |
| `recommendation` | Personalized recommendation text |

---

## 40. Roth vs 7702 Comparison

**`POST /api/v1/compute/financial/roth-vs-7702`**

Client-specific Roth IRA vs 7702-compliant policy (IUL/CVL) comparison.

### Request Body

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `case_id` | uuid | Yes | — | Case UUID |
| `household_income` | float | Yes | — | Total household gross income |
| `client_age` | int | Yes | — | Client's current age |
| `has_dependents` | bool | No | `false` | Whether client has dependent children |
| `has_coverage_gap` | bool | No | `false` | Whether client has a life insurance gap |
| `gap_amount` | float | No | `0` | Coverage gap dollar amount |
| `filing_status` | string | No | `married_filing_jointly` | Tax filing status |

### Response Highlights

| Field | Description |
|-------|-------------|
| `comparison` | 11-row feature comparison (eligibility, limits, access, RMD, growth, income, death benefit, living benefits, downside protection, creditor protection, FAFSA) — each with `highlight` field |
| `roth_eligible` / `roth_ineligible` | Boolean flags based on income |
| `recommendation` | Personalized recommendation with specific reasons for 7702 |

---

# Presentation Flow — AI Endpoint

## 41. Debt Strategy Narrative

**`POST /api/v1/ai/debt-strategy-narrative`**

Generates an empathetic debt strategy narrative for clients in phased recommendation mode. Only call when `recommendation_mode == "phased"`.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `case_id` | uuid | Yes | Case UUID |
| `quality_override` | string | No | Override quality routing |

### Response — AI-generated JSON

| Field | Description |
|-------|-------------|
| `headline` | Single impactful sentence about debt cost |
| `empathy_opening` | Validation of frustration before strategy |
| `strategy_summary` | 2-3 sentences on the overall approach |
| `quick_win` | Immediate action for this week |
| `payoff_countdown` | Array of milestones: `{month, label, cards_remaining, balance, monthly_interest}` |
| `consolidation_recommendation` | Top consolidation strategy in plain language |
| `freed_up_monthly` | Monthly amount freed after debt elimination |
| `phase_3_bridge` | How freed-up money funds protection |
| `key_insight` | Single most powerful motivating statement |
| `advisor_note` | Presentation guidance for the advisor |

**Cost:** ~$0.005 per call

---

# Market Data (Live Index Snapshot)

Live market index data for the frontend Market Snapshot card. Called during the Investments & Assets section of the financial interview.

---

## 42. Market Snapshot

**`GET /api/v1/market/snapshot`**

Returns the current S&P 500 (or other index) market snapshot including price, daily change, N-day trend, sentiment, and market status. Responses are cached with variable TTL to stay within free-tier rate limits.

### Query Parameters

| Parameter | Type   | Required | Default | Description |
|-----------|--------|----------|---------|-------------|
| `symbol`  | string | No       | `^GSPC` | Market index symbol. Supports `^GSPC` (S&P 500), `^DJI` (Dow), `^IXIC` (NASDAQ) |
| `days`    | int    | No       | `2`     | Trailing days for trend calculation (1–30) |

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Ticker symbol of the index |
| `name` | string | Human-readable name (e.g. "S&P 500") |
| `current_price` | float | Latest index price |
| `previous_close` | float | Previous trading day's close |
| `change_amount` | float | `current_price - previous_close` |
| `change_percent` | float | Day change as % (positive = up) |
| `trend.days` | int | Number of trailing days |
| `trend.start_price` | float | Closing price N days ago |
| `trend.end_price` | float | Current price |
| `trend.change_percent` | float | % change over the N-day window |
| `trend.direction` | string | `up`, `down`, or `flat` |
| `sentiment` | string | `positive`, `negative`, or `neutral` |
| `sentiment_label` | string | Human-readable label for frontend display |
| `market_status` | string | `open`, `closed`, `pre_market`, or `after_hours` |
| `last_updated` | string | ISO 8601 timestamp of data freshness |
| `source` | string | Upstream data provider name |
| `cached` | bool | Whether response was served from cache |

### Sentiment Logic

| Condition | `sentiment` | `sentiment_label` |
|-----------|------------|-------------------|
| trend ≥ 1.0% | `positive` | "Market performing well" |
| 0.0% ≤ trend < 1.0% | `positive` | "Market slightly up" |
| -0.5% < trend < 0.0% | `neutral` | "Market relatively flat" |
| -1.0% ≤ trend ≤ -0.5% | `negative` | "Market slightly down" |
| -3.0% ≤ trend < -1.0% | `negative` | "Market under pressure" |
| trend < -3.0% | `negative` | "Significant market decline" |

### Caching

| Market Status | Cache TTL | Rationale |
|--------------|-----------|-----------|
| Open | 5 minutes | Prices change, but advisors don't need tick-level |
| Closed / Pre-market / After-hours | 60 minutes | Data won't change until next open |
| Weekends / Holidays | 6 hours | No trading activity |

### Example Response

```json
{
  "success": true,
  "data": {
    "symbol": "^GSPC",
    "name": "S&P 500",
    "current_price": 5842.31,
    "previous_close": 5806.14,
    "change_amount": 36.17,
    "change_percent": 0.62,
    "trend": {
      "days": 2,
      "start_price": 5778.50,
      "end_price": 5842.31,
      "change_percent": 1.10,
      "direction": "up"
    },
    "sentiment": "positive",
    "sentiment_label": "Market performing well",
    "market_status": "open",
    "last_updated": "2026-02-12T14:35:00-05:00",
    "source": "Yahoo Finance",
    "cached": false
  }
}
```

### Error Response — `503`

```json
{
  "success": false,
  "error": {
    "code": "MARKET_DATA_UNAVAILABLE",
    "message": "Market data is temporarily unavailable. Please try again later."
  }
}
```

> The frontend should hide the Market Snapshot card when a 503 is returned. This must never block the interview flow.

---

# Contribution Limits (Reference Data)

IRS contribution limits stored per tax year, plan type, coverage type, and age group. The frontend should call these endpoints instead of hardcoding limits. New years can be added via the POST endpoint or the seed script (`scripts/seed_contribution_limits.py`).

All endpoints under `/api/v1/contribution-limits/`.

---

## 43. List Available Tax Years

**`GET /api/v1/contribution-limits/years`**

Returns all tax years that have contribution limits stored in the database.

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `years` | int[] | Sorted list of available tax years (descending) |

### Example Response

```json
{
  "success": true,
  "data": {
    "years": [2026, 2025]
  }
}
```

---

## 44. Get Contribution Limits for a Tax Year

**`GET /api/v1/contribution-limits/{tax_year}`**

Returns all IRS contribution limits for the specified tax year, grouped by plan type. Optionally filter by `plan_type`.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `tax_year` | int | Tax year (e.g. `2026`) |

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `plan_type` | string | No | Filter by plan type: `401k`, `roth_401k`, `403b`, `457`, `tsp`, `traditional_ira`, `roth_ira`, `simple_ira`, `sep_ira`, `hsa`, `529`, `fsa_health`, `fsa_dependent_care`, `after_tax_401k` |

### Response — `data` object

| Field | Type | Description |
|-------|------|-------------|
| `tax_year` | int | The requested tax year |
| `plans` | array | Groups of limits by plan type (see below) |
| `total_records` | int | Total number of limit rows returned |

**Each plan group:**

| Field | Type | Description |
|-------|------|-------------|
| `plan_type` | string | Plan type identifier (e.g. `401k`) |
| `plan_display_name` | string | Human-readable name (e.g. `401(k) Plan`) |
| `limits` | array | Individual limit rows for this plan (see below) |

**Each limit row:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Unique ID |
| `tax_year` | int | Tax year |
| `plan_type` | string | Plan type identifier |
| `coverage_type` | string | `individual`, `family`, `employer_match`, or `total_annual_additions` |
| `age_group` | string | `all_ages`, `under_50`, `age_50_plus`, `age_55_plus`, or `age_60_63` |
| `limit_amount` | float | Dollar limit amount |
| `description` | string | Human-readable description |
| `notes` | string or null | Additional context (income limits, HDHP requirements, etc.) |
| `source` | string or null | IRS notice number or reference |

### Example Request

```
GET /api/v1/contribution-limits/2026?plan_type=401k
```

### Example Response

```json
{
  "success": true,
  "data": {
    "tax_year": 2026,
    "plans": [
      {
        "plan_type": "401k",
        "plan_display_name": "401(k) Plan",
        "limits": [
          {
            "id": "...",
            "tax_year": 2026,
            "plan_type": "401k",
            "coverage_type": "individual",
            "age_group": "all_ages",
            "limit_amount": 24500,
            "description": "401(k) base elective deferral limit (all ages)",
            "notes": null,
            "source": "IRS Notice 2025-67"
          },
          {
            "id": "...",
            "tax_year": 2026,
            "plan_type": "401k",
            "coverage_type": "individual",
            "age_group": "under_50",
            "limit_amount": 24500,
            "description": "401(k) elective deferral limit for individuals under age 50",
            "notes": null,
            "source": "IRS Notice 2025-67"
          },
          {
            "id": "...",
            "tax_year": 2026,
            "plan_type": "401k",
            "coverage_type": "individual",
            "age_group": "age_50_plus",
            "limit_amount": 32500,
            "description": "401(k) total limit for age 50+ ($24,500 + $8,000 catch-up)",
            "notes": null,
            "source": "IRS Notice 2025-67"
          },
          {
            "id": "...",
            "tax_year": 2026,
            "plan_type": "401k",
            "coverage_type": "individual",
            "age_group": "age_60_63",
            "limit_amount": 35750,
            "description": "401(k) total limit for ages 60-63 ($24,500 + $11,250 super catch-up)",
            "notes": "SECURE 2.0 enhanced catch-up for ages 60, 61, 62, 63 only",
            "source": "IRS Notice 2025-67"
          },
          {
            "id": "...",
            "tax_year": 2026,
            "plan_type": "401k",
            "coverage_type": "total_annual_additions",
            "age_group": "all_ages",
            "limit_amount": 72000,
            "description": "Section 415(c) total annual additions limit (employee + employer + forfeitures)",
            "notes": null,
            "source": "IRS Notice 2025-67"
          }
        ]
      }
    ],
    "total_records": 5
  }
}
```

### Stored plan types and their limits

| Plan Type | Coverage Types | Age Groups | 2026 Key Limits |
|-----------|---------------|------------|----------------|
| `401k` | individual, total_annual_additions | all_ages, under_50, age_50_plus, age_60_63 | $24,500 / $32,500 / $35,750 / $72,000 |
| `roth_401k` | individual | under_50, age_50_plus, age_60_63 | $24,500 / $32,500 / $35,750 |
| `after_tax_401k` | total_annual_additions | under_50 | $72,000 (mega backdoor) |
| `traditional_ira` | individual | under_50, age_50_plus | $7,500 / $8,600 |
| `roth_ira` | individual | under_50, age_50_plus | $7,500 / $8,600 |
| `simple_ira` | individual | under_50, age_50_plus, age_60_63 | $17,000 / $21,000 / $22,250 |
| `sep_ira` | individual | all_ages | $72,000 |
| `hsa` | individual, family | under_50, age_55_plus | $4,400 / $5,400 / $8,750 / $9,750 |
| `529` | individual | all_ages | $19,000 (gift tax excl.) |
| `fsa_health` | individual | all_ages | $3,400 |
| `fsa_dependent_care` | individual | all_ages | $5,000 |

---

## 45. Add a Contribution Limit

**`POST /api/v1/contribution-limits/`**

Creates a new contribution limit row. Returns 409 if a row with the same (tax_year, plan_type, coverage_type, age_group) already exists.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tax_year` | int | Yes | Tax year (2020–2100) |
| `plan_type` | string | Yes | Plan type identifier |
| `coverage_type` | string | Yes | `individual`, `family`, `employer_match`, or `total_annual_additions` |
| `age_group` | string | Yes | `all_ages`, `under_50`, `age_50_plus`, `age_55_plus`, or `age_60_63` |
| `limit_amount` | float | Yes | Dollar limit amount |
| `description` | string | Yes | Human-readable description |
| `notes` | string | No | Additional context |
| `source` | string | No | IRS notice number or URL |

### Example Request

```json
{
  "tax_year": 2027,
  "plan_type": "401k",
  "coverage_type": "individual",
  "age_group": "under_50",
  "limit_amount": 25000,
  "description": "401(k) elective deferral limit for individuals under age 50",
  "source": "IRS Notice 2026-XX"
}
```

---

## 46. Update a Contribution Limit

**`PUT /api/v1/contribution-limits/{limit_id}`**

Updates the limit_amount, description, notes, or source of an existing limit row.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit_id` | uuid | Limit row UUID |

### Request Body

All fields optional — only supplied fields are updated.

| Field | Type | Description |
|-------|------|-------------|
| `limit_amount` | float | New dollar limit |
| `description` | string | Updated description |
| `notes` | string | Updated notes |
| `source` | string | Updated source |

---

## 47. Delete a Contribution Limit

**`DELETE /api/v1/contribution-limits/{limit_id}`**

Permanently removes a contribution limit row.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit_id` | uuid | Limit row UUID |

---

## Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| `400` | Bad request — invalid input or unsupported file type |
| `401` | Unauthorized — missing or invalid JWT token |
| `404` | Not found — case does not exist or access denied |
| `409` | Conflict — duplicate entry (contribution limits) |
| `422` | Validation error — request body failed Pydantic validation |
| `500` | Internal server error |

---

## Quick Reference: Endpoint Dependencies

Some endpoints produce better results when run after others (they read stored computations):

```
Independent (no prerequisites):
  /net-worth
  /card-portfolio
  /promo-rate-analysis
  /informal-debts
  /debt-health-penalty (runs its own cash flow + debt service internally)
  All projection endpoints
  All AI endpoints

Needs /cash-flow first:
  /debt-service (uses monthly_retirement_contributions, monthly_surplus_or_deficit)
  /consolidation-options (uses monthly_surplus_or_deficit)

Needs /cash-flow + /debt-service first:
  /recommendation-mode (uses status, surplus, is_debt_emergency, high_interest_total)

Runs everything in order (no prerequisites):
  /full-analysis
```

**Recommendation:** For a complete case analysis, call `/full-analysis` once. It handles all dependencies automatically.

# Financial Interview — Form Fields & Backend API Reference

> **Last updated:** February 12, 2026
>
> This document describes every field captured by the Financial Interview screens, how they map to the backend payload, and which API endpoints are called.

---

## Table of Contents

1. [Workflow Overview](#1-workflow-overview)
2. [API Endpoints](#2-api-endpoints)
3. [Phase 2 — Financial Background](#3-phase-2--financial-background)
   - [Employment & Income](#31-employment--income)
   - [Retirement Accounts](#32-retirement-accounts)
   - [Investments & Assets](#33-investments--assets)
   - [Real Estate](#34-real-estate)
   - [Debts & Liabilities](#35-debts--liabilities)
   - [Monthly Expenses](#36-monthly-expenses)
4. [Income Replacement Risk (Educational)](#4-income-replacement-risk-educational)
5. [Phase 3 — Protection & Estate](#5-phase-3--protection--estate)
   - [Life Insurance Policies](#51-life-insurance-policies)
   - [Will, Trust & Estate](#52-will-trust--estate)
6. [Phase 4 — Analysis Dashboard](#6-phase-4--analysis-dashboard)
7. [Phases 5–8 — Upcoming](#7-phases-58--upcoming)
8. [Financial Health Score](#8-financial-health-score)
9. [Backend Payload Structure](#9-backend-payload-structure)
10. [Key-Conversion Notes](#10-key-conversion-notes)

---

## 1. Workflow Overview

```
PHASE 1: Case Setup (existing)
  └─ New Case + Client Profile

PHASE 2: Financial Background  ← live health score updates after each save
  ├─ Screen 2a: Employment & Income
  ├─ Screen 2b: Retirement Accounts
  ├─ Screen 2c: Investments & Assets
  ├─ Screen 2d: Real Estate
  ├─ Screen 2e: Debts & Liabilities
  └─ Screen 2f: Monthly Expenses
  [Health Score: Retirement + Education + Tax = max 60 pts]

  (Income Replacement Risk — educational interlude, no data saved)

PHASE 3: Protection & Estate  ← BEFORE Analysis (captures insurance + estate data)
  ├─ Screen 3a: Life Insurance Policies
  └─ Screen 3b: Will, Trust & Estate
  [Health Score: + Protection + Estate = NOW max 100 pts]

PHASE 4: Analysis Dashboard
  └─ Full Health Score, Net Worth, Tax Buckets, AI Summary, Strengths, Gaps

PHASE 5: Financial Home (AI narratives)
  └─ Background Summary, Health Narrative, Protection Gaps, Estate Urgency

PHASE 6: Financial X Curve
  └─ X-Curve Visualization, AI Narration, Tax Narrative

PHASE 7: Recommendations
  └─ AI Recommendations, Projections, Product Recommendations

PHASE 8: Delivery
  └─ PDF / Presentation Generation
```

### Why Protection & Estate comes BEFORE Analysis

| If captured AFTER analysis | If captured BEFORE analysis (current) |
|---|---|
| Health Score shows max 60/100 on analysis screen | Health Score shows complete 0–100 |
| Protection Gaps AI has no data to analyze | Protection Gaps AI has real policy data |
| Estate Urgency AI has no actual status | Estate Urgency AI knows actual estate status |
| Client sees incomplete picture first | Client sees complete picture on first view |
| Analysis page needs revisiting | One-shot: all data in, complete analysis out |

---

## 2. API Endpoints

### 2.1 Save / Load Financial Background Data

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| **Load** | `GET` | `/api/v1/cases/{caseId}/discovery/` | Retrieves full discovery record. Financial data nested under `financial_profile.primary_background` and `financial_profile.spouse_background`. |
| **Save** | `PUT` | `/api/v1/cases/{caseId}/discovery/` | Saves financial background (including protection & estate). Frontend reads existing data first, merges, then PUTs back. |

**Save payload structure:**

```json
{
  "financial_profile": {
    "primary_background": { /* ...snake_case PersonFinancialBackground... */ },
    "spouse_background": { /* ...snake_case PersonFinancialBackground... */ }
  }
}
```

### 2.2 Financial Health Score

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| **Get** | `GET` | `/api/v1/cases/{caseId}/financial-health-score/` | Returns computed Health Score with all 5 category breakdowns. |

**Cache:** `staleTime` of 10 seconds. Automatically invalidated after every save.

### 2.3 API Calls Per Screen

| Screen | API Calls | Data Store |
|--------|-----------|------------|
| 2a. Employment & Income | `PUT /discovery/` | Discovery JSONB |
| 2b. Retirement Accounts | `PUT /discovery/` | Discovery JSONB |
| 2c. Investments & Assets | `PUT /discovery/` | Discovery JSONB |
| 2d. Real Estate | `PUT /discovery/` | Discovery JSONB |
| 2e. Debts & Liabilities | `PUT /discovery/` | Discovery JSONB |
| 2f. Monthly Expenses | `PUT /discovery/` | Discovery JSONB |
| After each save | `GET /financial-health-score/` | reads Discovery JSONB |
| 3a. Life Insurance | `PUT /discovery/` | Discovery JSONB |
| 3b. Will/Trust/Estate | `PUT /discovery/` | Discovery JSONB |
| After save | `GET /financial-health-score/` | now scores Protection + Estate |
| 4. Analysis Dashboard | `GET /financial-health-score/` | reads Discovery JSONB |

---

## 3. Phase 2 — Financial Background

Divided into **6 sub-sections**, each captured for both **Primary Client** and **Spouse** independently.

### 3.1 Employment & Income

#### Employment Status Selector

| Field | Type | Backend Key | Values |
|-------|------|-------------|--------|
| Employment Status | `EmploymentStatus` | `income.employment_status` | `"employed"`, `"self-employed"`, `"not-working"` |

#### When Status = `"employed"`

| Field | Type | Backend Key |
|-------|------|-------------|
| Annual Salary | `number` | `income.annual_salary` |
| Bonus / Commission | `number` | `income.annual_bonus` |
| Employer Name | `string` | `income.employer_name` |
| Pay Frequency | `string` | `income.income_frequency` |
| Other Income (annual) | `number` | `income.other_income` |

#### When Status = `"self-employed"`

| Field | Type | Backend Key |
|-------|------|-------------|
| Business Income | `number` | `income.business_income` |
| Business Type | `string` | `income.business_type` |
| Bonus / Commission | `number` | `income.annual_bonus` |
| Other Income (annual) | `number` | `income.other_income` |

#### When Status = `"not-working"`

| Field | Type | Backend Key |
|-------|------|-------------|
| Other Income Sources | `number` | `income.other_income` |
| Source of Income | `string` | `income.other_income_source` |
| Bonus / One-time Income | `number` | `income.annual_bonus` |

---

### 3.2 Retirement Accounts

#### 401(k) / IRA / Roth IRA (Grouped Card)

| Field | Backend Key |
|-------|-------------|
| 401(k) Balance | `retirement401k.current_balance` |
| 401(k) Contribution | `retirement401k.employee_contribution_percent` |
| Traditional IRA Balance | `ira.current_balance` |
| Traditional IRA Annual Contribution | `ira.annual_contribution` |
| Roth IRA Balance | `roth_i_r_a.current_balance` |
| Roth IRA Annual Contribution | `roth_i_r_a.annual_contribution` |

#### Pension / Defined Benefit

| Field | Backend Key |
|-------|-------------|
| Lump Sum Option | `pension.lump_sum_option` |
| Monthly Benefit | `pension.estimated_monthly_benefit` |

#### 403(b) / 457(b)

| Field | Backend Key |
|-------|-------------|
| Balance | `plan403b457b.current_balance` |
| Annual Contribution | `plan403b457b.annual_contribution` |

---

### 3.3 Investments & Assets

| Card Name | Balance Field | Contribution Field |
|-----------|---------------|-------------------|
| Brokerage Account | `brokerage.current_value` | — |
| Bond Holdings | `bonds.municipal_bond_value` | — |
| Annuities | `annuity.current_value` | — |
| Stock Options / RSUs / ESPP | `equity_compensation.vested_r_s_u_value` | — |
| Cryptocurrency | `crypto.total_value` | — |
| Cash on Hand (Checking) | `cash_on_hand.checking_balance` | — |
| Cash on Hand (Savings) | `cash_on_hand.savings_balance` | — |
| Emergency Fund (months) | `cash_on_hand.emergency_fund_months` | — |
| HSA Balance | `hsa.current_balance` | — |
| CDs Total | `cd.total_value` | — |
| 529 Balance | `education529.total_balance` | — |
| Social Security (Monthly at FRA) | — | `social_security.estimated_monthly_benefit_f_r_a` |

---

### 3.4 Real Estate

| Field | Backend Key |
|-------|-------------|
| Primary Home Equity | `real_estate.primary_home_equity` |
| Investment Properties Market Value | `real_estate.total_market_value` |
| Monthly Rental Income | `real_estate.monthly_rental_income` |
| Number of Properties | `real_estate.number_of_properties` |
| Total Mortgage on Investments | `real_estate.total_mortgage_balance` |

---

### 3.5 Debts & Liabilities

| Card Name | Balance Field | Monthly Payment Field |
|-----------|---------------|----------------------|
| Mortgage | `debts.mortgage_balance` | `debts.mortgage_monthly_payment` |
| Auto Loans | `debts.auto_loan_balance` | `debts.auto_loan_monthly_payment` |
| Student Loans | `debts.student_loan_balance` | `debts.student_loan_monthly_payment` |
| Credit Card Debt | `debts.credit_card_balance` | `debts.credit_card_min_payment` |
| Other Loans | `debts.other_loan_balance` | `debts.other_loan_monthly_payment` |
| Other Loan Description | `debts.other_loan_description` | — |

---

### 3.6 Monthly Expenses

| Field | Backend Key |
|-------|-------------|
| Housing | `monthly_expenses.housing` |
| Utilities | `monthly_expenses.utilities` |
| Transportation | `monthly_expenses.transportation` |
| Groceries | `monthly_expenses.groceries` |
| Insurance | `monthly_expenses.insurance` |
| Childcare / Schooling / Education | `monthly_expenses.childcare` |
| Entertainment | `monthly_expenses.entertainment` |
| Dining Out | `monthly_expenses.dining_out` |
| Other | `monthly_expenses.other_expenses` |

---

## 4. Income Replacement Risk (Educational)

This section is **educational/interactive only** — no data is sent to the backend. It presents an animated 5-step story about income replacement risk, followed by solutions (Life Insurance and Will & Trust).

Navigation advances to **Phase 3: Protection & Estate**.

---

## 5. Phase 3 — Protection & Estate

Captured for both **Primary Client** and **Spouse** independently. Data is saved via the same `PUT /discovery/` endpoint as Financial Background.

### 5.1 Life Insurance Policies

| Field | Type | Backend Key |
|-------|------|-------------|
| Has Group Life (Employer) | `boolean` | `life_insurance.has_group_life` |
| Group Life Amount | `number` | `life_insurance.group_life_amount` |
| Has Term Life | `boolean` | `life_insurance.has_term_life` |
| Term Life Amount | `number` | `life_insurance.term_life_amount` |
| Term Life Premium | `number` | `life_insurance.term_life_premium` |
| Term Length (years) | `number` | `life_insurance.term_length_years` |
| Has Permanent Life | `boolean` | `life_insurance.has_perm_life` |
| Perm Life Type | `string` | `life_insurance.perm_life_type` |
| Perm Life Amount | `number` | `life_insurance.perm_life_amount` |
| Perm Life Premium | `number` | `life_insurance.perm_life_premium` |
| Perm Life Cash Value | `number` | `life_insurance.perm_life_cash_value` |
| Total Coverage Amount | `number` | `life_insurance.total_coverage_amount` |
| Has Disability Insurance | `boolean` | `life_insurance.has_disability_insurance` |
| Disability Monthly Benefit | `number` | `life_insurance.disability_monthly_benefit` |
| Has Long-Term Care | `boolean` | `life_insurance.has_long_term_care` |
| Has Umbrella Policy | `boolean` | `life_insurance.has_umbrella_policy` |
| Umbrella Coverage Amount | `number` | `life_insurance.umbrella_coverage_amount` |

### 5.2 Will, Trust & Estate

| Field | Type | Backend Key |
|-------|------|-------------|
| Has Will | `boolean` | `estate.has_will` |
| Will Last Updated | `string` (date) | `estate.will_last_updated` |
| Has Trust | `boolean` | `estate.has_trust` |
| Trust Type | `string` | `estate.trust_type` |
| Has Power of Attorney | `boolean` | `estate.has_power_of_attorney` |
| Has Healthcare Directive | `boolean` | `estate.has_healthcare_directive` |
| Beneficiary Designations Current | `boolean` | `estate.beneficiary_designations_current` |
| Notes | `string` | `estate.notes` |

---

## 6. Phase 4 — Analysis Dashboard

Displays the full analysis using data from the Health Score API. No new data is captured.

| Element | Data Source |
|---------|-------------|
| Full Health Score (0–100) | `GET /financial-health-score/` |
| Net Worth Breakdown | `healthScore.netWorth` |
| Tax Bucket Allocation | `healthScore.taxBuckets` |
| Score Breakdown (5 categories) | `healthScore.categories` |
| Summary | `healthScore.insights.summary` |
| What You're Doing Well | `healthScore.insights.strengths` |
| Areas That Need Attention | `healthScore.insights.gaps` |

---

## 7. Phases 5–8 — Upcoming

| Phase | Screen | Status | Planned API Calls |
|-------|--------|--------|-------------------|
| 5 | Financial Home | Placeholder | `POST /ai/background-summary`, `/health-narrative`, `/protection-gaps`, `/estate-urgency`, `/background-gaps` |
| 6 | Financial X Curve | Placeholder | `POST /ai/xcurve-narration`, `/tax-narrative` |
| 7 | Recommendations | Placeholder | `POST /ai/recommendations`, `/compute/projections/*` |
| 8 | Delivery | Placeholder | `POST /pdf/generate` |

---

## 8. Financial Health Score

Fetched from the backend, displayed in the sidebar and Analysis Dashboard.

```typescript
interface FinancialHealthScore {
  totalScore: number;           // 0–100
  maxPossibleScore: number;
  categories: {
    retirement: HealthScoreCategory;   // max 20 pts
    education: HealthScoreCategory;    // max 20 pts
    tax: HealthScoreCategory;          // max 20 pts
    protection: HealthScoreCategory;   // max 20 pts (from Phase 3)
    estate: HealthScoreCategory;       // max 20 pts (from Phase 3)
  };
  netWorth: { total: number; breakdown: { retirement, investments, savings, realEstate, other } };
  taxBuckets: { taxDeferred, taxFree, taxable };
  insights: { strengths, gaps, summary };
}
```

---

## 9. Backend Payload Structure

Full `PersonFinancialBackground` object (snake_case) sent on save:

```json
{
  "financial_profile": {
    "primary_background": {
      "role": "primary",
      "income": { "employment_status": "employed", "annual_salary": 150000, ... },
      "monthly_expenses": { "housing": 2500, ... },
      "retirement401k": { "has401k": true, "current_balance": 250000, ... },
      "ira": { "has_i_r_a": true, ... },
      "roth_i_r_a": { "has_roth_i_r_a": true, ... },
      "pension": { ... },
      "plan403b457b": { ... },
      "brokerage": { ... },
      "bonds": { ... },
      "annuity": { ... },
      "equity_compensation": { ... },
      "education529": { ... },
      "real_estate": { "has_real_estate": true, "primary_home_equity": 200000, ... },
      "crypto": { ... },
      "cash_on_hand": { ... },
      "hsa": { ... },
      "cd": { ... },
      "social_security": { ... },
      "systematic_investments": { ... },
      "funds_abroad": { ... },
      "debts": {
        "mortgage_balance": 350000,
        "mortgage_monthly_payment": 2200,
        "auto_loan_balance": 25000,
        "student_loan_balance": 0,
        "credit_card_balance": 5000
      },
      "life_insurance": {
        "has_group_life": true,
        "group_life_amount": 100000,
        "has_term_life": true,
        "term_life_amount": 500000,
        "has_disability_insurance": true,
        "has_long_term_care": false,
        "has_umbrella_policy": false
      },
      "estate": {
        "has_will": true,
        "will_last_updated": "2024-06-15",
        "has_trust": false,
        "has_power_of_attorney": true,
        "has_healthcare_directive": true,
        "beneficiary_designations_current": true
      }
    }
  }
}
```

---

## 10. Key-Conversion Notes

Frontend uses **camelCase**, backend uses **snake_case**. The `deepConvertKeys` utility recursively converts.

| Frontend | Backend | Notes |
|----------|---------|-------|
| `rothIRA` | `roth_i_r_a` | Consecutive uppercase → separate underscores |
| `hasHSA` | `has_h_s_a` | Same pattern |
| `hasIRA` | `has_i_r_a` | Same pattern |
| `vestedRSUValue` | `vested_r_s_u_value` | Same pattern |
| `has529` | `has529` | Numbers unaffected |

---

## Source Files Reference

| File | Purpose |
|------|---------|
| `src/types/financial-interview.ts` | All TypeScript interfaces |
| `src/components/features/financial-interview/financial-bg-layout.tsx` | Financial Background form (6 sub-sections) |
| `src/components/features/financial-interview/protection-estate-screen.tsx` | Protection & Estate form (Life Insurance + Will/Trust) |
| `src/components/features/financial-interview/financial-bg-insights.tsx` | Analysis Dashboard / Insights view |
| `src/components/features/financial-interview/income-replacement-screen.tsx` | Interactive Income Replacement Risk education |
| `src/components/features/financial-interview/interview-section-nav.tsx` | Top-level section navigation (8 phases) |
| `src/app/(platform)/cases/[caseId]/financial-interview/page.tsx` | Main page — orchestrates all phases |
| `src/lib/api/financial-interview.ts` | API functions |
| `src/hooks/use-financial-interview.ts` | React Query hooks |
| `src/lib/api/client.ts` | Authenticated fetch wrapper |

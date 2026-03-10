"use client";

import { DataCard } from "./DataCard";
import { ProgressBar } from "./ProgressBar";
import { EDUCATIONAL_TOOLTIPS } from "./pyramidConstants";

function usd(v: number) {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function LevelDetailPanel({
  level,
  data,
}: {
  level: 1 | 2 | 3 | 4 | 5;
  data: any;
}) {
  if (level === 1) {
    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <DataCard title="What You Own" tooltip={EDUCATIONAL_TOOLTIPS.assets}>
          <p>Total Assets: <strong>{usd(data.assets.totalAssets)}</strong></p>
          <p>Retirement: {usd(data.assets.retirement)}</p>
          <p>Investments: {usd(data.assets.investments)}</p>
          <p>Savings: {usd(data.assets.savings)}</p>
          <p>Real Estate: {usd(data.assets.realEstate)}</p>
        </DataCard>
        <DataCard title="What You Owe" tooltip={EDUCATIONAL_TOOLTIPS.liabilities}>
          <p>Total Liabilities: <strong>{usd(data.liabilities.totalLiabilities)}</strong></p>
          <p>Consumer Debt: {usd(data.liabilities.totalConsumerDebt)}</p>
          <p>High-Interest Debt: {usd(data.liabilities.highInterestTotal)}</p>
          <p>Debt-Free Timeline: {Math.round(data.liabilities.debtFreeMonths || 0)} months</p>
        </DataCard>
        <DataCard title="Your Income Machine" tooltip={EDUCATIONAL_TOOLTIPS.incomeMachine}>
          <p>Monthly Gross: <strong>{usd(data.income.monthlyGross)}</strong></p>
          <p>Annual Gross: {usd(data.income.annualGross)}</p>
          <p>Sources: {(data.income.sources || []).length}</p>
        </DataCard>
        <DataCard title="Who You Earn For" tooltip={EDUCATIONAL_TOOLTIPS.family}>
          <p>Primary: {data.family.primaryName}</p>
          <p>Spouse: {data.family.spouseName || "—"}</p>
          <p>Dependents: {data.family.dependents}</p>
        </DataCard>
        <DataCard title="Unforeseen Circumstances" tooltip={EDUCATIONAL_TOOLTIPS.unforeseen}>
          <p>Life Insurance: {data.protection.lifeInsurance.exists ? "In place" : "Needs attention"}</p>
          <p>Disability: {data.protection.disabilityInsurance.exists ? "In place" : "Needs attention"}</p>
          <p>Umbrella: {data.protection.umbrellaPolicy.exists ? "In place" : "To discuss"}</p>
          <p>LTC Planning: {data.protection.ltcPlanning.exists ? "In place" : "To discuss"}</p>
          <p>Coverage Gap: {usd(data.protection.lifeInsurance.coverageGap || 0)}</p>
        </DataCard>
      </div>
    );
  }

  if (level === 2) {
    const efPct = data.emergencyFund.targetBalance > 0
      ? (data.emergencyFund.currentBalance / data.emergencyFund.targetBalance) * 100
      : 0;
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <DataCard title="Monthly Emergency Fund" tooltip={EDUCATIONAL_TOOLTIPS.emergencyFund}>
          <p>Current: {data.emergencyFund.currentMonths.toFixed(1)} months</p>
          <p>Target: {data.emergencyFund.targetMonths} months</p>
          <p>Gap: {usd(data.emergencyFund.gap)}</p>
          <div className="mt-2"><ProgressBar value={efPct} /></div>
        </DataCard>
        <DataCard title="Key Critical Expenses" tooltip={EDUCATIONAL_TOOLTIPS.criticalExpenses}>
          <p>Critical Monthly: {usd(data.criticalExpenses.totalCritical)}</p>
          <p>Monthly Net: {usd(data.criticalExpenses.monthlyIncome)}</p>
          <p>Ratio: {(data.criticalExpenses.criticalExpenseRatio * 100).toFixed(1)}%</p>
        </DataCard>
        <DataCard title="Retirement Planning" tooltip={EDUCATIONAL_TOOLTIPS.retirement}>
          <p>Target Age: {data.retirement.targetAge}</p>
          <p>Current Savings: {usd(data.retirement.currentSavings)}</p>
          <p>Projected: {usd(data.retirement.projectedAtRetirement)}</p>
          <p>Monthly Gap: {usd(data.retirement.retirementGapMonthly)}</p>
          <div className="mt-2"><ProgressBar value={data.retirement.readinessScore || 0} /></div>
        </DataCard>
        <DataCard title="Large Purchases / Education" tooltip={EDUCATIONAL_TOOLTIPS.largePurchases}>
          <p>Education Need: {usd(data.largePurchases.educationNeed)}</p>
          <p>Education Savings: {usd(data.largePurchases.educationSavings)}</p>
          <p>Shortfall: {usd(data.largePurchases.educationShortfall)}</p>
        </DataCard>
      </div>
    );
  }

  if (level === 3) {
    return (
      <DataCard title="Aggressive Planning" tooltip={EDUCATIONAL_TOOLTIPS.aggressive}>
        <p>Invested (Non-Retirement): <strong>{usd(data.investments.totalInvested)}</strong></p>
        <p>Monthly Surplus Available: {usd(data.growth.surplusAvailable)}</p>
        <p>Inflation Target: {(data.growth.inflationTarget * 100).toFixed(1)}%</p>
        <p>Minimum Growth Target: {(data.growth.minimumGrowthTarget * 100).toFixed(1)}%</p>
      </DataCard>
    );
  }

  if (level === 4) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <DataCard title="Estate Planning" tooltip={EDUCATIONAL_TOOLTIPS.estate}>
          <p>Will: {data.estate.willInPlace ? "In place" : "Needs discussion"}</p>
          <p>Trust: {data.estate.trustEstablished ? "In place" : "Needs discussion"}</p>
          <p>POA: {data.estate.poa ? "In place" : "Needs discussion"}</p>
          <p>Healthcare Directive: {data.estate.healthcareDirective ? "In place" : "Needs discussion"}</p>
          <div className="mt-2"><ProgressBar value={data.estate.estateScorePct || 0} /></div>
        </DataCard>
        <DataCard title="Death Benefit Planning" tooltip={EDUCATIONAL_TOOLTIPS.estate}>
          <p>Total Coverage: {usd(data.deathBenefit.totalCoverage)}</p>
          <p>Coverage Gap: {usd(data.deathBenefit.coverageGap)}</p>
          <p>Estate Need: {usd(data.deathBenefit.estateNeed)}</p>
          <p>Legacy Goal: {usd(data.deathBenefit.legacyGoal)}</p>
        </DataCard>
      </div>
    );
  }

  return (
    <DataCard title="Financial Freedom Scorecard" tooltip={EDUCATIONAL_TOOLTIPS.freedom}>
      <p>Health Score: {data.healthScore}/{data.maxScore}</p>
      <p>Pillars Complete: {data.freedom.pillarsComplete}/{data.freedom.totalPillars}</p>
      <div className="mt-2"><ProgressBar value={data.freedom.freedomPercentage} /></div>
      <p className="mt-2">Recommended Review: {data.review.recommendedReviewDate}</p>
    </DataCard>
  );
}


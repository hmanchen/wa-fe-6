"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DisclaimerVariant = "compact" | "standard" | "full" | "ai";
type DisclaimerContext =
  | "fna"
  | "insurance"
  | "estate"
  | "projections"
  | "recommendations"
  | "educational";

interface DisclaimerBannerProps {
  variant: DisclaimerVariant;
  context?: DisclaimerContext;
  advisorName?: string;
  advisorState?: string;
  advisorLicenseNumber?: string;
  className?: string;
}

interface AdvisorProfileTokens {
  advisorName: string;
  advisorState: string;
  advisorLicenseNumber: string;
}

let advisorTokensCache: AdvisorProfileTokens | null = null;
let advisorTokensPromise: Promise<AdvisorProfileTokens> | null = null;

const FALLBACK_TOKENS: AdvisorProfileTokens = {
  advisorName: "Licensed Insurance Professional",
  advisorState: "N/A",
  advisorLicenseNumber: "N/A",
};

async function loadAdvisorTokens(): Promise<AdvisorProfileTokens> {
  if (advisorTokensCache) return advisorTokensCache;
  if (advisorTokensPromise) return advisorTokensPromise;

  advisorTokensPromise = (async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
      const advisorId = user?.id;

      let profile: Record<string, unknown> = {};
      if (advisorId) {
        const { data } = await supabase
          .from("advisor_profiles")
          .select("full_name, license_state, license_number")
          .eq("advisor_id", advisorId)
          .maybeSingle();
        profile = (data ?? {}) as Record<string, unknown>;
      }

      const tokens: AdvisorProfileTokens = {
        advisorName:
          String(profile.full_name ?? metadata.full_name ?? "").trim() ||
          FALLBACK_TOKENS.advisorName,
        advisorState:
          String(profile.license_state ?? metadata.license_state ?? "").trim() ||
          FALLBACK_TOKENS.advisorState,
        advisorLicenseNumber:
          String(profile.license_number ?? metadata.license_number ?? "").trim() ||
          FALLBACK_TOKENS.advisorLicenseNumber,
      };

      advisorTokensCache = tokens;
      return tokens;
    } catch {
      advisorTokensCache = FALLBACK_TOKENS;
      return FALLBACK_TOKENS;
    }
  })();

  return advisorTokensPromise;
}

export function DisclaimerBanner({
  variant,
  context = "educational",
  advisorName,
  advisorState,
  advisorLicenseNumber,
  className,
}: DisclaimerBannerProps) {
  const [tokens, setTokens] = useState<AdvisorProfileTokens>(FALLBACK_TOKENS);

  useEffect(() => {
    let active = true;
    void loadAdvisorTokens().then((value) => {
      if (active) setTokens(value);
    });
    return () => {
      active = false;
    };
  }, []);

  const resolvedAdvisorName = advisorName?.trim() || tokens.advisorName;
  const resolvedAdvisorState = advisorState?.trim() || tokens.advisorState;
  const resolvedAdvisorLicenseNumber =
    advisorLicenseNumber?.trim() || tokens.advisorLicenseNumber;
  const year = new Date().getFullYear();

  const commonClassName =
    "border-t border-[#E5E7EB] bg-[#F8F9FA] px-4 py-3 text-[11px] leading-relaxed text-[#6B7280]";
  const mergedClassName = className
    ? `${commonClassName} ${className}`
    : commonClassName;

  const contextSuffix = useMemo(() => {
    if (context === "insurance") {
      return " Insurance strategies are subject to underwriting and carrier terms.";
    }
    if (context === "estate") {
      return " Estate planning topics are educational and require attorney review.";
    }
    if (context === "projections") {
      return " Projection outputs are assumptions-based estimates, not guarantees.";
    }
    if (context === "recommendations") {
      return " Recommendations are discussion points and require suitability review.";
    }
    return "";
  }, [context]);

  if (variant === "compact") {
    return (
      <div className={mergedClassName}>
        <span className="mr-1">📋</span>
        For educational purposes only. Not financial, legal, or tax advice.
        Consult a licensed professional.
      </div>
    );
  }

  if (variant === "ai") {
    return (
      <div className={mergedClassName}>
        <span className="mr-1">⚖️</span>
        AI-Generated Content Disclosure: The financial narrative above was generated
        by an AI system based on information you provided. It is for educational and
        illustrative purposes only. It does not constitute financial, investment,
        legal, or tax advice. AI-generated content may contain errors or omissions.
        All insurance product recommendations require review by a licensed insurance
        professional and are subject to carrier underwriting. Do not make financial
        decisions based solely on this content.
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className={mergedClassName}>
        <p className="mb-1">
          <span className="mr-1">⚖️</span>
          Important Legal Disclosures
        </p>
        <p className="mb-1">
          Financial Needs Analysis: This Financial Needs Analysis (FNA) is an
          educational tool designed to help identify potential gaps in insurance
          coverage and retirement planning. It is not a comprehensive financial plan
          and does not constitute financial, investment, legal, or tax advice.
        </p>
        <p className="mb-1">
          Insurance Products: All insurance product recommendations are for
          illustrative purposes only. Final premiums, coverage amounts, and product
          availability are subject to carrier underwriting approval and may differ
          from estimates shown. {resolvedAdvisorName} is licensed to sell insurance
          products only.
        </p>
        <p className="mb-1">
          Projections &amp; Estimates: All financial projections, retirement
          estimates, college funding projections, and income replacement calculations
          are based on information provided and mathematical assumptions. They do not
          guarantee future results. Actual outcomes will vary based on market
          conditions, tax law changes, health status, and other factors outside our
          control.
        </p>
        <p className="mb-1">
          Not Investment Advice: This platform does not provide investment advice and
          is not registered as an investment advisor. Nothing presented should be
          interpreted as a recommendation to buy, sell, or hold any investment
          security.
        </p>
        <p className="mb-1">
          Not Legal Advice: Estate planning information provided is for educational
          purposes only. Consult a licensed attorney for preparation of wills,
          trusts, powers of attorney, or other legal documents.
        </p>
        <p className="mb-1">
          Not Tax Advice: Tax-related information is educational only. Consult a
          licensed CPA or tax professional for tax planning advice.
        </p>
        <p className="mb-1">
          License Information: {resolvedAdvisorName} is a licensed insurance
          professional in the state of {resolvedAdvisorState}. Insurance license
          number: {resolvedAdvisorLicenseNumber}. This analysis was prepared in
          connection with the potential sale of insurance products only.
        </p>
        <p className="mb-1">
          Not a Securities Transaction: This document does not constitute an offer or
          solicitation to purchase or sell any security. {resolvedAdvisorName} is not
          registered as a broker-dealer or investment advisor.
        </p>
        <p>
          © {year} Arclis Financial Intelligence Platform. All rights reserved.
        </p>
      </div>
    );
  }

  return (
    <div className={mergedClassName}>
      <span className="mr-1">⚖️</span>
      Important Disclosure: The information provided by this platform is for
      educational and Financial Needs Analysis purposes only. It does not constitute
      financial, investment, legal, or tax advice. {resolvedAdvisorName} is a
      licensed insurance professional. Insurance product recommendations are subject
      to underwriting approval. Individual results may vary. All projections are
      estimates based on information provided and assumptions that may not reflect
      actual outcomes. This analysis is not a guarantee of future results.
      {contextSuffix}
    </div>
  );
}

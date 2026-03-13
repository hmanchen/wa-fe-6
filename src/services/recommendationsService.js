import { createClient } from "@/lib/supabase/client";
import { API_BASE_URL } from "@/lib/config";

async function getAuthToken() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }
  return session.access_token;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || API_BASE_URL;

export const recommendationsService = {
  async fetch(caseId) {
    const token = await getAuthToken();
    const res = await fetch(
      `${BASE_URL}/api/v1/ai/recommendations?case_id=${caseId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!res.ok) {
      let detail = "";
      try {
        const payload = await res.json();
        detail = payload?.detail || payload?.message || "";
      } catch {
        detail = "";
      }
      throw new Error(detail || `API error: ${res.status}`);
    }
    return res.json();
  },
  async fetchIULProjection(caseId, monthlyPremium) {
    const token = await getAuthToken();
    const res = await fetch(
      `${BASE_URL}/api/v1/ai/iul-projection?case_id=${caseId}&monthly_premium=${monthlyPremium}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    return res.json();
  },
  async fetchCollegeProjection(caseId, monthlyPremium) {
    const token = await getAuthToken();
    const res = await fetch(
      `${BASE_URL}/api/v1/ai/iul-college-projection?case_id=${caseId}&monthly_premium=${monthlyPremium}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    return res.json();
  },
};

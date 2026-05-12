import { expect, test, type Page } from "@playwright/test";

const CASE_ID = "b884b43b-3e52-4fec-9203-0ecd9b30e1a6";

async function mockFinancialInterviewApi(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path === `/api/v1/cases/${CASE_ID}/`) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: CASE_ID,
            case_number: "CASE-AD02",
            status: "discovery",
            priority: "medium",
            client_id: "client-1",
            advisor_id: "advisor-1",
            client_name: "AD02 Client",
            client_email: "ad02@example.com",
            client_phone: "555-0100",
            case_type: "life_insurance",
            consent_acknowledged_at: "2026-05-01T00:00:00.000Z",
            client_personal_info: {
              first_name: "AD02",
              last_name: "Client",
              date_of_birth: "1986-01-01",
              marital_status: "married",
              partner_first_name: "Partner",
              address: { province: "TX" },
            },
            created_at: "2026-05-01T00:00:00.000Z",
            updated_at: "2026-05-01T00:00:00.000Z",
          },
        }),
      });
      return;
    }

    if (path === `/api/v1/cases/${CASE_ID}/discovery/`) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            financial_profile: {
              primary_background: {
                income: { income_sources: [{ type: "employer", annual_income: 260000 }] },
              },
              goals_discovery: {},
            },
          },
        }),
      });
      return;
    }

    if (path === `/api/v1/cases/${CASE_ID}/financial-health-score/`) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            total_score: 72,
            max_possible_score: 100,
            goal_summary: { retirement_target_age: 65 },
            categories: {},
          },
        }),
      });
      return;
    }

    if (path === "/api/v1/compute/financial/full-analysis") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            needs_analysis: { coverage_gap: 3182896 },
            coverage_gap: 3182896,
            goal_coverage_adequacy: { coverage_gap: 3182896 },
            hidden_money: {
              total_monthly_redirectable: 500,
              calculation_trace: { coverage_gap: 3182896 },
              sources: [{ source: "Cash flow", monthly_amount: 500 }],
            },
          },
        }),
      });
      return;
    }

    if (path === "/api/v1/compute/financial/xcurve-data") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            coverage_gap: 3182896,
            crossing_age: 67,
          },
        }),
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ data: {} }),
    });
  });
}

test("Financial Home is hidden and Analysis Dashboard continues to Pyramid", async ({ page }) => {
  await mockFinancialInterviewApi(page);

  await page.goto(`/cases/${CASE_ID}/financial-interview`);

  await expect(page.getByRole("button", { name: "Financial Home", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Financial Home Pyramid" })).toBeVisible();

  await page.getByRole("button", { name: "Analysis Dashboard" }).click();
  await page.getByRole("button", { name: "How this unallocated surplus is derived" }).click();
  await expect(page.getByText("Coverage gap used in rule check")).toBeVisible();
  await expect(page.getByText("$3,182,896")).toBeVisible();

  await page.getByRole("button", { name: /Continue to Financial Home Pyramid/i }).click();

  await expect(page.getByRole("heading", { name: "Financial Home Pyramid" })).toBeVisible();
  await expect(page.getByText("Coverage Gap: $3,182,896")).toBeVisible();

  await page.getByRole("button", { name: /Continue to Financial X Curve/i }).click();
  await expect(page.getByText("Coverage Gap: $3,182,896")).toBeVisible();
});

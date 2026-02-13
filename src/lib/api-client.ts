import { createClient } from '@/lib/supabase/client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiClient {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders()
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (response.status === 401) {
      window.location.href = '/login'
      throw new Error('Authentication expired')
    }

    const json = await response.json()

    if (!response.ok) {
      throw new Error(json.message || json.error || 'API request failed')
    }

    return json
  }

  // ── Case Management ──────────────────────────────────────────────
  createCase(data: { case_name: string; notes?: string }) {
    return this.request('POST', '/api/v1/cases/', data)
  }

  listCases(page = 1, pageSize = 20, status?: string) {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (status) params.set('status', status)
    return this.request('GET', `/api/v1/cases/?${params}`)
  }

  getCase(caseId: string) {
    return this.request('GET', `/api/v1/cases/${caseId}`)
  }

  updateCase(caseId: string, data: { case_name?: string; status?: string; notes?: string }) {
    return this.request('PUT', `/api/v1/cases/${caseId}`, data)
  }

  archiveCase(caseId: string) {
    return this.request('DELETE', `/api/v1/cases/${caseId}`)
  }

  // ── Client Profiles ──────────────────────────────────────────────
  createClient(caseId: string, data: Record<string, unknown>) {
    return this.request('POST', `/api/v1/cases/${caseId}/client/`, data)
  }

  getClient(caseId: string) {
    return this.request('GET', `/api/v1/cases/${caseId}/client/`)
  }

  updateClient(caseId: string, data: Record<string, unknown>) {
    return this.request('PUT', `/api/v1/cases/${caseId}/client/`, data)
  }

  // ── Computation Engines ──────────────────────────────────────────
  computeInsuranceNeeds(data: Record<string, unknown>) {
    return this.request('POST', '/api/v1/compute/insurance-needs/', data)
  }

  computeAffordability(data: Record<string, unknown>) {
    return this.request('POST', '/api/v1/compute/affordability/', data)
  }

  computeTaxAnalysis(data: Record<string, unknown>) {
    return this.request('POST', '/api/v1/compute/tax-analysis/', data)
  }

  computeInsuranceDesign(data: Record<string, unknown>) {
    return this.request('POST', '/api/v1/compute/insurance-design/', data)
  }

  // ── AI & Recommendations ────────────────────────────────────────
  generateExplanation(data: Record<string, unknown>) {
    return this.request('POST', '/api/v1/explanations/generate', data)
  }

  generateTalkingPoints(data: Record<string, unknown>) {
    return this.request('POST', '/api/v1/explanations/talking-points', data)
  }

  generateRecommendations(data: Record<string, unknown>) {
    return this.request('POST', '/api/v1/recommendations/generate', data)
  }

  // ── Products ─────────────────────────────────────────────────────
  searchProducts(data: Record<string, unknown>) {
    return this.request('POST', '/api/v1/products/search', data)
  }

  recommendProductTypes(data: Record<string, unknown>) {
    return this.request('POST', '/api/v1/products/recommend-types', data)
  }

  // ── PDF ──────────────────────────────────────────────────────────
  generatePDF(data: Record<string, unknown>) {
    return this.request('POST', '/api/v1/pdf/generate', data)
  }

  // ── Health (no auth) ─────────────────────────────────────────────
  healthCheck() {
    return fetch(`${API_BASE}/api/v1/health`).then(r => r.json())
  }
}

// Singleton instance
export const api = new ApiClient()

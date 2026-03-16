import { useEffect, useState } from "react";
import {
  CheckCircle,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Send,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";

export default function DeliveryScreen({ caseId, caseData, onBack }) {
  const [status, setStatus] = useState("idle");
  const [reportData, setReportData] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [history, setHistory] = useState([]);
  const [sendEmail, setSendEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [error, setError] = useState(null);

  const clientName =
    caseData?.client_name ||
    `${caseData?.first_name || ""} ${caseData?.last_name || ""}`.trim() ||
    caseData?.clientName ||
    "Client";

  useEffect(() => {
    loadReportHistory();
    loadSnapshotSummary();
  }, [caseId]);

  const loadSnapshotSummary = async () => {
    try {
      const { data } = await apiClient.get(`/reports/history/${caseId}`);
      setHistory(data?.reports || []);
    } catch (_e) {
      // no-op
    }
  };

  const loadReportHistory = async () => {
    try {
      const { data } = await apiClient.get(`/reports/history/${caseId}`);
      setHistory(data?.reports || []);
      if (data?.reports?.[0]?.pdf_url) {
        setPdfUrl(data.reports[0].pdf_url);
        setStatus("generated");
      }
    } catch (_e) {
      // no-op
    }
  };

  const handleGenerate = async (withEmail = false) => {
    setStatus("generating");
    setError(null);
    try {
      const { data } = await apiClient.post("/reports/generate", {
          case_id: caseId,
          store_in_db: true,
          send_to_email: withEmail ? sendEmail : null,
      });
      setPdfUrl(data.pdf_url || null);
      setReportData(data);
      setStatus("generated");
      await loadReportHistory();
    } catch (e) {
      setError(e?.message || "Report generation failed");
      setStatus("error");
    }
  };

  const handleDownload = async () => {
    try {
      const { data } = await apiClient.get(`/reports/download/${caseId}`, {
        responseType: "blob",
      });
      const blob = data;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Financial-Blueprint-${clientName.replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (_e) {
      setError("Download failed. Please try again.");
    }
  };

  const DataReadinessPanel = () => {
    const sections = [
      {
        key: "analysis_dashboard",
        label: "Analysis Dashboard",
        icon: "📊",
        description: "Health score, gaps, hidden money",
      },
      {
        key: "financial_home",
        label: "Financial Story",
        icon: "🏠",
        description: "Two futures, CFP narrative",
      },
      {
        key: "recommendations",
        label: "Recommendations",
        icon: "📋",
        description: "Priority actions and projections",
      },
    ];

    return (
      <div
        style={{
          background: "#F8F7F4",
          border: "1px solid #E8E4DC",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#1B2B4B",
            marginBottom: 12,
          }}
        >
          📁 Report Data Readiness
        </div>
        {sections.map((s) => (
          <div
            key={s.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
              padding: "6px 10px",
              background: "#FFFFFF",
              borderRadius: 8,
              border: "1px solid #E8E4DC",
            }}
          >
            <span style={{ fontSize: 18 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1B2B4B" }}>
                {s.label}
              </div>
              <div style={{ fontSize: 11, color: "#718096" }}>{s.description}</div>
            </div>
            <CheckCircle size={16} color="#4A7C6F" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 24px" }}>
      <div style={{ borderLeft: "4px solid #4A7C6F", paddingLeft: 16, marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            color: "#4A7C6F",
            textTransform: "uppercase",
            letterSpacing: 2,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          FINAL STEP
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#1B2B4B" }}>
          {clientName}'s Financial Blueprint Report
        </div>
        <div style={{ fontSize: 13, color: "#718096", marginTop: 4 }}>
          Generate a professional PDF report summarizing this session.
        </div>
      </div>

      <DataReadinessPanel />

      {status === "idle" && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E4DC",
            borderRadius: 16,
            padding: "28px 32px",
            textAlign: "center",
          }}
        >
          <FileText size={48} color="#4A7C6F" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1B2B4B", marginBottom: 8 }}>
            Ready to Generate Report
          </div>
          <div style={{ fontSize: 13, color: "#718096", marginBottom: 24, lineHeight: 1.6 }}>
            Creates a professional, compliance-ready PDF with health summary, gap analysis,
            recommendations, and projections.
          </div>

          <button
            onClick={() => handleGenerate(false)}
            style={{
              background: "#4A7C6F",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 12,
              padding: "14px 32px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <FileText size={20} />
            Generate Financial Blueprint PDF
          </button>

          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => setShowEmailInput(!showEmailInput)}
              style={{
                background: "none",
                color: "#4A7C6F",
                border: "1px solid #4A7C6F",
                borderRadius: 8,
                padding: "8px 20px",
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Send size={14} />
              Generate & Email to Client
            </button>
          </div>

          {showEmailInput && (
            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 10,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <input
                type="email"
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
                placeholder="client@email.com"
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E8E4DC",
                  fontSize: 13,
                  width: 260,
                }}
              />
              <button
                onClick={() => handleGenerate(true)}
                disabled={!sendEmail.includes("@")}
                style={{
                  background: "#1B2B4B",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 20px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  opacity: sendEmail.includes("@") ? 1 : 0.5,
                }}
              >
                Send Report
              </button>
            </div>
          )}
        </div>
      )}

      {status === "generating" && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E8E4DC",
            borderRadius: 16,
            padding: "40px",
            textAlign: "center",
          }}
        >
          <div style={{ animation: "spin 1s linear infinite", display: "inline-block", marginBottom: 20 }}>
            <RefreshCw size={40} color="#4A7C6F" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1B2B4B", marginBottom: 8 }}>
            Generating Your Report...
          </div>
          <div style={{ fontSize: 13, color: "#718096" }}>
            Compiling financial data and recommendations into PDF format.
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
        </div>
      )}

      {status === "generated" && (
        <div>
          <div
            style={{
              background: "linear-gradient(135deg, #F0F7F4, #E8F5F0)",
              border: "1px solid rgba(74,124,111,0.3)",
              borderLeft: "4px solid #4A7C6F",
              borderRadius: 12,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <CheckCircle size={32} color="#4A7C6F" />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1B2B4B" }}>
                Report Generated Successfully
              </div>
              <div style={{ fontSize: 12, color: "#718096" }}>
                Stored securely and logged in audit history.
                {reportData?.pdf_size_bytes
                  ? ` (${Math.round(reportData.pdf_size_bytes / 1024)} KB)`
                  : ""}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <button
              onClick={handleDownload}
              style={{
                background: "#4A7C6F",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Download size={18} />
              Download PDF
            </button>

            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: "#FFFFFF",
                  color: "#1B2B4B",
                  border: "1px solid #E8E4DC",
                  borderRadius: 10,
                  padding: "12px 24px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Eye size={18} />
                Preview in Browser
              </a>
            )}

            <button
              onClick={() => {
                setStatus("idle");
                setShowEmailInput(true);
              }}
              style={{
                background: "#FFFFFF",
                color: "#4A7C6F",
                border: "1px solid #4A7C6F",
                borderRadius: 10,
                padding: "12px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Send size={18} />
              Email to Client
            </button>

            <button
              onClick={() => setStatus("idle")}
              style={{
                background: "#FFFFFF",
                color: "#718096",
                border: "1px solid #E8E4DC",
                borderRadius: 10,
                padding: "12px 24px",
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <RefreshCw size={16} />
              Regenerate
            </button>
          </div>

          {history.length > 0 && (
            <div
              style={{
                background: "#F8F7F4",
                border: "1px solid #E8E4DC",
                borderRadius: 12,
                padding: "16px 20px",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1B2B4B", marginBottom: 12 }}>
                📋 Report History
              </div>
              {history.map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    background: i === 0 ? "#FFFFFF" : "transparent",
                    borderRadius: 8,
                    border: i === 0 ? "1px solid #E8E4DC" : "none",
                    marginBottom: 4,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1B2B4B" }}>
                      {i === 0 ? "Latest Report" : `Report #${history.length - i}`}
                    </div>
                    <div style={{ fontSize: 11, color: "#718096" }}>
                      {new Date(h.delivered_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {h.delivered_to_email ? ` · Sent to ${h.delivered_to_email}` : ""}
                    </div>
                  </div>
                  {h.pdf_url && (
                    <a
                      href={h.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12,
                        color: "#4A7C6F",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      View →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div
          style={{
            background: "#FFF5F5",
            border: "1px solid rgba(224,82,82,0.3)",
            borderLeft: "4px solid #E05252",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "#E05252", marginBottom: 4 }}>
            Report Generation Failed
          </div>
          <div style={{ fontSize: 12, color: "#718096", marginBottom: 12 }}>
            {error || "An unexpected error occurred."}
          </div>
          <div style={{ fontSize: 12, color: "#4A5568" }}>
            Complete Analysis Dashboard and Recommendations before generating.
          </div>
          <button
            onClick={() => setStatus("idle")}
            style={{
              marginTop: 12,
              background: "#E05252",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 20px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}


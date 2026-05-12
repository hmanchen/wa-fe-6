import { APP_SHORT_NAME } from "@/lib/app-branding";

export default function JoinTheTeamCard({ clientName, advisorName, clientAge }) {
  const ageContext = clientAge
    ? `At ${clientAge}, you have the ideal combination of life experience and earning years ahead of you.`
    : "You're at a stage where earning potential and life experience are both working in your favor.";

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1B2B4B 0%, #243A63 100%)",
        border: "1px solid #3B5080",
        borderRadius: 16,
        padding: "28px 32px",
        marginBottom: 16,
        color: "#FFFFFF",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(74,124,111,0.15)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -20,
          right: 60,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(212,165,32,0.1)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              background: "rgba(74,124,111,0.3)",
              borderRadius: 12,
              padding: "8px 12px",
              fontSize: 24,
            }}
          >
            {"\uD83E\uDD1D"}
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#4A7C6F",
                textTransform: "uppercase",
                letterSpacing: 2,
                fontWeight: 700,
                marginBottom: 3,
              }}
            >
              A Personal Message
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF" }}>
              {clientName
                ? `${clientName}, There's Another Way to Fund Your Plan`
                : "There's Another Way to Fund Your Plan"}
            </div>
          </div>
        </div>

        <p style={{ fontSize: 14, color: "#BFD0E8", lineHeight: 1.8, marginBottom: 20 }}>
          {ageContext} You've just seen a complete picture of your financial future and what it takes to
          secure it. If the monthly investment feels like a stretch today, there is a genuine path to
          change that:{" "}
          <strong style={{ color: "#FFFFFF" }}>become a licensed insurance professional yourself</strong>,
          mentor under {advisorName || "your advisor"}, and use {APP_SHORT_NAME} with your own clients to
          build the income that funds this very plan.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            {
              icon: "\uD83D\uDCDC",
              title: "Get Licensed",
              desc: "Mentored path to your insurance license with full support",
            },
            {
              icon: "\uD83D\uDCBC",
              title: "Use This Tool",
              desc: `Access ${APP_SHORT_NAME} for your own clients - the same system you just experienced`,
            },
            {
              icon: "\uD83D\uDCB0",
              title: "Earn While You Build",
              desc: "Your own commissions fund the plan you just built for yourself",
            },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "14px 16px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", marginBottom: 5 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: "#90A8CC", lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div
            style={{
              background: "#4A7C6F",
              color: "#FFFFFF",
              borderRadius: 10,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(74,124,111,0.4)",
            }}
          >
            Learn About Joining the Team {"\u2192"}
          </div>
          <div style={{ fontSize: 12, color: "#90A8CC", fontStyle: "italic" }}>
            No obligation. 15-minute conversation.
            {advisorName ? ` Ask ${advisorName} after this meeting.` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}


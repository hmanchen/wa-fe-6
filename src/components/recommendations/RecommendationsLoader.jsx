import { useState, useEffect } from "react";
import {
  Brain,
  Shield,
  TrendingUp,
  GraduationCap,
  BarChart2,
  Scale,
  Sparkles,
  CheckCircle,
} from "lucide-react";

const STAGES = [
  { Icon: Brain, label: "Reviewing your complete financial profile..." },
  { Icon: Shield, label: "Assessing your protection and coverage gaps..." },
  { Icon: TrendingUp, label: "Modeling your retirement accumulation timeline..." },
  { Icon: GraduationCap, label: "Projecting your education funding requirements..." },
  { Icon: BarChart2, label: "Conducting your cash flow efficiency analysis..." },
  { Icon: Scale, label: "Prioritizing recommendations within your budget..." },
  { Icon: Sparkles, label: "Preparing your personalized financial strategy..." },
  { Icon: CheckCircle, label: "Finalizing your recommendation plan..." },
];

export default function RecommendationsLoader({ clientName }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setStageIndex((i) => (i + 1) % STAGES.length);
        setVisible(true);
      }, 300);
    }, 3500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const { Icon, label } = STAGES[stageIndex];

  return (
    <div
      style={{
        background: "#F8F7F4",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        position: "relative",
        overflow: "hidden",
        animation: "recSlideUpFade 350ms ease",
      }}
    >
      <div className="rec-loader-particles" />

      <div
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 300ms ease",
          marginBottom: 24,
        }}
      >
        <Icon size={64} color="#4A7C6F" strokeWidth={1.5} />
      </div>

      <p
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 300ms ease",
          color: "#1B2B4B",
          fontSize: 20,
          fontWeight: 500,
          marginBottom: 32,
          textAlign: "center",
          maxWidth: 440,
        }}
      >
        {label}
      </p>

      <div
        style={{
          width: "100%",
          maxWidth: 400,
          height: 4,
          background: "#E8E4DC",
          borderRadius: 4,
          marginBottom: 24,
        }}
      >
        <div className="rec-loader-progress" />
      </div>

      <p
        style={{
          color: "#718096",
          fontSize: 13,
          fontStyle: "italic",
          textAlign: "center",
        }}
      >
        Building
        {clientName ? ` ${clientName}'s` : " your"} personalized financial blueprint...
      </p>
    </div>
  );
}

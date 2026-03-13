export function PrefillLoadingBanner({ cityLabel }: { cityLabel?: string }) {
  return (
    <div className="prefill-banner prefill-banner--loading">
      <div className="prefill-spinner">
        <svg className="spin" viewBox="0 0 24 24" width="20" height="20">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeDasharray="60"
            strokeDashoffset="20"
          />
        </svg>
      </div>
      <div className="prefill-banner__text">
        <span className="prefill-banner__title">Fetching National Averages…</span>
        <span className="prefill-banner__sub">
          Looking up cost-of-living data for {cityLabel ?? "your area"}.
        </span>
      </div>
    </div>
  );
}

export function PrefillSuccessBanner({
  prefillData,
  ownsHome,
  pitiAmount,
  onDismiss,
  onRefresh,
}: {
  prefillData: Record<string, unknown>;
  ownsHome: boolean;
  pitiAmount?: number;
  onDismiss: () => void;
  onRefresh: () => void;
}) {
  const city = String(prefillData.city ?? "");
  const state = String(prefillData.state ?? "");
  const metro = String(prefillData.metro_area ?? "");
  const cityLabel = String(prefillData.city_label ?? "");
  const source = String(prefillData.data_source ?? "");
  const confidence = String(prefillData.confidence ?? "medium");
  const locationLabel = metro
    ? `${city}, ${state} (${metro})`
    : [city, state].filter(Boolean).join(", ") || cityLabel || state || "your area";

  return (
    <div className="prefill-banner prefill-banner--success">
      <div className="prefill-banner__icon">✨</div>
      <div className="prefill-banner__text">
        <span className="prefill-banner__title">
          Pre-filled with National Averages — {locationLabel}
        </span>
        <span className="prefill-banner__sub">
          {ownsHome && pitiAmount
            ? `Housing uses the actual PITI ($${pitiAmount.toLocaleString()}). Other fields are estimated.`
            : `All fields below reflect estimated averages for ${locationLabel}.`}
        </span>
        <span className="prefill-banner__confidence">
          Data confidence:{" "}
          <strong>{confidence === "high" ? "🟢 High (metro match)" : "🟡 Medium (state fallback)"}</strong>
          {source ? ` · Source: ${source}` : ""}
        </span>
      </div>
      <div className="prefill-banner__actions">
        <button className="btn-text" onClick={onRefresh} type="button">
          ↻ Refresh
        </button>
        <button className="btn-text btn-text--muted" onClick={onDismiss} type="button">
          ✕
        </button>
      </div>
    </div>
  );
}

export function PrefillErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="prefill-banner prefill-banner--error">
      <div className="prefill-banner__icon">⚠️</div>
      <div className="prefill-banner__text">
        <span className="prefill-banner__title">Could not load national averages</span>
        <span className="prefill-banner__sub">
          Fields are left unchanged. Enter the client&apos;s actual monthly expenses.
        </span>
      </div>
      <button className="btn-text" onClick={onRetry} type="button">
        Retry
      </button>
    </div>
  );
}

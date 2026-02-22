# Market Snapshot API — Backend Implementation Spec

> **Created:** February 12, 2026
>
> This document provides the complete specification for the backend team to implement the Market Snapshot API. The frontend will call this API to display a live S&P 500 market context card during the financial interview (Investments & Assets section).

---

## 1. Purpose

During the client interview, when the advisor reaches the **Investments & Assets** section (specifically the brokerage accounts area), the frontend will display a compact "Market Snapshot" card showing:

- Current S&P 500 index value
- Today's change ($ and %)
- 2-day price trend (% change)
- A simple sentiment label (e.g., "Market performing well", "Market under pressure")
- Timestamp of last update

This gives the advisor a real-time conversation anchor to discuss market conditions, risk, and diversification without switching to another app.

---

## 2. Endpoint Specification

### `GET /api/v1/market/snapshot`

Returns the current S&P 500 market snapshot.

#### Authentication

```
Authorization: Bearer <jwt_token>
```

Standard JWT auth — same as all other platform endpoints.

#### Query Parameters

| Parameter | Type   | Required | Default  | Description                                      |
|-----------|--------|----------|----------|--------------------------------------------------|
| `symbol`  | string | No       | `^GSPC`  | Market index symbol. Default is S&P 500.         |
| `days`    | int    | No       | `2`      | Number of trailing days to compute trend.         |

> **Note:** For Phase 1, only S&P 500 (`^GSPC`) is needed. The `symbol` parameter is included for future extensibility (Dow, NASDAQ, etc.).

#### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "symbol": "^GSPC",
    "name": "S&P 500",
    "current_price": 5842.31,
    "previous_close": 5806.14,
    "change_amount": 36.17,
    "change_percent": 0.62,
    "trend": {
      "days": 2,
      "start_price": 5778.50,
      "end_price": 5842.31,
      "change_percent": 1.10,
      "direction": "up"
    },
    "sentiment": "positive",
    "sentiment_label": "Market performing well",
    "market_status": "open",
    "last_updated": "2026-02-12T14:35:00-05:00",
    "source": "Alpha Vantage",
    "cached": false
  }
}
```

#### Field Definitions

| Field                    | Type     | Description                                                                |
|--------------------------|----------|----------------------------------------------------------------------------|
| `symbol`                 | string   | Ticker symbol of the index                                                 |
| `name`                   | string   | Human-readable name                                                        |
| `current_price`          | float    | Latest index price                                                         |
| `previous_close`         | float    | Previous trading day's close price                                         |
| `change_amount`          | float    | `current_price - previous_close`                                           |
| `change_percent`         | float    | Percentage change from previous close (positive = up, negative = down)     |
| `trend.days`             | int      | Number of days the trend covers                                            |
| `trend.start_price`      | float    | Closing price N days ago                                                   |
| `trend.end_price`        | float    | Current / most recent price                                                |
| `trend.change_percent`   | float    | Percentage change over the N-day window                                    |
| `trend.direction`        | string   | `"up"`, `"down"`, or `"flat"`                                              |
| `sentiment`              | string   | `"positive"`, `"negative"`, or `"neutral"`                                 |
| `sentiment_label`        | string   | Human-readable sentiment for frontend display                              |
| `market_status`          | string   | `"open"`, `"closed"`, or `"pre_market"` / `"after_hours"`                  |
| `last_updated`           | datetime | ISO 8601 timestamp of data freshness                                       |
| `source`                 | string   | Name of upstream data provider                                             |
| `cached`                 | bool     | Whether the response was served from cache                                 |

#### Error Response — `503 Service Unavailable`

When the upstream market data API is unreachable or rate-limited:

```json
{
  "success": false,
  "error": {
    "code": "MARKET_DATA_UNAVAILABLE",
    "message": "Market data is temporarily unavailable. Please try again later."
  }
}
```

> **Important:** The frontend treats this gracefully — it simply hides the market snapshot card. This should never block the interview flow.

---

## 3. Sentiment Logic

The backend should compute the `sentiment` and `sentiment_label` based on the **2-day trend percentage**, not just today's change. Suggested thresholds:

| Condition                          | `sentiment`  | `sentiment_label`                  |
|------------------------------------|-------------|-------------------------------------|
| `trend.change_percent >= 1.0`      | `positive`  | `"Market performing well"`          |
| `0.0 <= trend.change_percent < 1.0`| `positive`  | `"Market slightly up"`              |
| `-0.5 < trend.change_percent < 0.0`| `neutral`   | `"Market relatively flat"`          |
| `-1.0 <= trend.change_percent <= -0.5` | `negative`  | `"Market slightly down"`        |
| `trend.change_percent < -1.0`      | `negative`  | `"Market under pressure"`           |
| `trend.change_percent < -3.0`      | `negative`  | `"Significant market decline"`      |

These thresholds can be adjusted. The key is the frontend only consumes the label string — all logic stays backend.

---

## 4. Recommended Free Market Data APIs

The backend should evaluate and choose one of these free providers. Listed in order of recommendation:

### Option 1: Alpha Vantage (Recommended)

- **Website:** https://www.alphavantage.co/
- **Free tier:** 25 requests/day (standard), 75 requests/day (with free key)
- **Endpoints needed:**
  - `GLOBAL_QUOTE` — current price, change, volume for a symbol
  - `TIME_SERIES_DAILY` — daily close prices for trend calculation
- **Example calls:**

```bash
# Current quote
GET https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=%5EGSPC&apikey=YOUR_KEY

# Daily historical (for 2-day trend)
GET https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=%5EGSPC&outputsize=compact&apikey=YOUR_KEY
```

- **Pros:** Reliable, well-documented, supports market indices
- **Cons:** Rate-limited on free tier (caching essential)

### Option 2: Twelve Data

- **Website:** https://twelvedata.com/
- **Free tier:** 800 API credits/day, 8 per minute
- **Endpoints needed:**
  - `GET /quote` — real-time quote
  - `GET /time_series` — historical data
- **Example:**

```bash
GET https://api.twelvedata.com/quote?symbol=SPX&apikey=YOUR_KEY
GET https://api.twelvedata.com/time_series?symbol=SPX&interval=1day&outputsize=5&apikey=YOUR_KEY
```

- **Pros:** Generous free tier, fast
- **Cons:** Uses `SPX` instead of `^GSPC` for S&P 500

### Option 3: Yahoo Finance (Unofficial via yfinance)

- **Library:** `pip install yfinance`
- **Usage:**

```python
import yfinance as yf

sp500 = yf.Ticker("^GSPC")
hist = sp500.history(period="5d")  # last 5 trading days
current = hist['Close'].iloc[-1]
prev_close = hist['Close'].iloc[-2]
two_days_ago = hist['Close'].iloc[-3]
```

- **Pros:** No API key needed, very simple, full historical data
- **Cons:** Unofficial — Yahoo can block or change at any time. Not recommended for production if reliability is critical, but perfectly fine for an internal advisor tool.

### Option 4: Financial Modeling Prep

- **Website:** https://financialmodelingprep.com/
- **Free tier:** 250 requests/day
- **Endpoint:** `GET /api/v3/quote/%5EGSPC?apikey=YOUR_KEY`
- **Pros:** Clean JSON, includes change and percent
- **Cons:** Smaller community

**Recommendation:** Start with **Alpha Vantage** or **yfinance** (Python library). Alpha Vantage is more "proper" for a production API; yfinance is faster to prototype and doesn't require managing an API key.

---

## 5. Caching Strategy

Market data doesn't need to be real-time to the second. Implement caching to stay within free-tier rate limits:

| Market Status     | Cache Duration | Rationale                                        |
|-------------------|---------------|--------------------------------------------------|
| Market open       | 5 minutes     | Prices change, but advisors don't need tick-level |
| Market closed     | 60 minutes    | Data won't change until next open                 |
| Weekends/holidays | 6 hours       | No trading activity                               |

### Implementation

```python
# Pseudocode
import redis  # or use Django/FastAPI cache, or even a simple dict with TTL

CACHE_KEY = "market_snapshot:^GSPC"

def get_market_snapshot(symbol="^GSPC", trend_days=2):
    cached = cache.get(CACHE_KEY)
    if cached:
        cached["cached"] = True
        return cached

    # Fetch from upstream API
    data = fetch_from_provider(symbol, trend_days)
    data["cached"] = False

    ttl = determine_cache_ttl(data["market_status"])
    cache.set(CACHE_KEY, data, ttl=ttl)

    return data
```

---

## 6. Market Status Detection

The backend should detect whether the US stock market is currently open:

| Condition                                  | `market_status`  |
|--------------------------------------------|------------------|
| Weekday, 9:30 AM – 4:00 PM ET             | `"open"`         |
| Weekday, 4:00 AM – 9:30 AM ET             | `"pre_market"`   |
| Weekday, 4:00 PM – 8:00 PM ET             | `"after_hours"`  |
| Otherwise (nights, weekends, holidays)     | `"closed"`       |

Use `pytz` or `zoneinfo` for timezone handling (`America/New_York`).

For US market holidays, either:
- Hardcode the NYSE holiday calendar for the current year, or
- Use the `exchange_calendars` or `pandas_market_calendars` Python package

---

## 7. Backend Implementation Steps

1. **Choose a data provider** — Alpha Vantage or yfinance (see Section 4)
2. **Store API key** (if Alpha Vantage) in environment variable: `MARKET_DATA_API_KEY`
3. **Create the service module:**
   ```
   app/services/market_data.py
   ```
   - `fetch_quote(symbol)` → calls upstream API for current price
   - `fetch_daily_history(symbol, days)` → calls upstream for N days of daily closes
   - `compute_trend(history, days)` → calculates N-day trend direction and %
   - `compute_sentiment(trend_pct)` → returns sentiment + label
   - `get_market_status()` → returns current market open/closed status
   - `get_market_snapshot(symbol, days)` → orchestrates all above + caching

4. **Create the API route:**
   ```
   app/api/v1/endpoints/market.py
   ```
   - `GET /api/v1/market/snapshot` — calls `get_market_snapshot()`, returns JSON

5. **Register the router** in the main app (`app/api/v1/router.py` or equivalent)

6. **Add caching** — Redis if available, or in-memory with TTL (see Section 5)

7. **Add error handling** — If upstream fails, return 503 with `MARKET_DATA_UNAVAILABLE`

---

## 8. Frontend Integration (For Reference)

Once the backend API is ready, the frontend will:

1. **Call the API** via React Query hook:
   ```typescript
   // GET /api/v1/market/snapshot
   // Only called when Investments & Assets section is active
   // Refetch interval: 5 minutes when market is open
   ```

2. **Display a compact card** near the brokerage fields:
   ```
   ┌─────────────────────────────────────────────────────┐
   │  📊 Market Snapshot              S&P 500            │
   │  5,842.31  ▲ +0.62% today                          │
   │  2-day trend: ▲ +1.1%  · Market performing well    │
   │  Last updated: 2:35 PM ET                           │
   └─────────────────────────────────────────────────────┘
   ```

3. **Graceful fallback** — If API returns 503 or network error, the card is simply not shown. No error messages, no broken UI.

---

## 9. Testing Checklist

- [ ] Returns valid data during market hours (weekday 9:30 AM–4:00 PM ET)
- [ ] Returns last known close when market is closed
- [ ] Cache works — second request within TTL returns `"cached": true`
- [ ] Returns 503 gracefully when upstream provider is unreachable
- [ ] `sentiment` and `sentiment_label` match the thresholds in Section 3
- [ ] `market_status` correctly identifies open/closed/pre-market/after-hours
- [ ] `trend.change_percent` is calculated correctly over the requested number of days
- [ ] API key is read from environment variable, not hardcoded
- [ ] Response time < 500ms for cached responses, < 3s for uncached

---

## 10. Future Enhancements (Not Required Now)

- Support additional indices (Dow Jones `^DJI`, NASDAQ `^IXIC`)
- Add VIX (volatility index) as an additional fear/greed indicator
- Support sector performance (Tech, Healthcare, Financials) for more targeted conversations
- Add 5-day and 30-day sparkline data for a mini chart

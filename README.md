# WealthArchitect - Frontend Application

An insurance-centric financial intelligence platform designed to help financial advisors conduct structured discovery, compute defensible needs analysis, validate insurance funding designs, and generate client-ready recommendation packages.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **Component Library** | shadcn/ui (New York style) |
| **Forms** | React Hook Form + Zod validation |
| **Server State** | TanStack Query (React Query) |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **HTTP Client** | Axios |
| **Date Utilities** | date-fns |
| **Theming** | next-themes |
| **Notifications** | Sonner |

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Python FastAPI backend URL | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | Application display name | `WealthArchitect` |
| `NEXT_PUBLIC_APP_URL` | Frontend application URL | `http://localhost:3000` |

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Authentication pages (login, register)
│   │   ├── login/
│   │   └── register/
│   ├── (platform)/               # Authenticated platform pages
│   │   ├── dashboard/            # Dashboard overview
│   │   ├── cases/                # Case management
│   │   │   ├── new/              # Create new case
│   │   │   └── [caseId]/         # Case detail & workflow
│   │   │       ├── discovery/    # Client discovery wizard
│   │   │       ├── needs-analysis/ # Insurance needs computation
│   │   │       ├── recommendations/ # Product recommendations
│   │   │       └── report/       # PDF report generation
│   │   └── settings/             # User & company settings
│   └── api/                      # API route handlers (gateway to FastAPI)
│       ├── auth/
│       ├── cases/
│       ├── computation/
│       └── reports/
│
├── components/
│   ├── ui/                       # shadcn/ui primitives (auto-generated)
│   ├── shared/                   # Reusable shared components
│   │   ├── page-header.tsx       # Page title + actions
│   │   ├── loading-spinner.tsx   # Loading indicators
│   │   ├── empty-state.tsx       # Empty state displays
│   │   ├── confirm-dialog.tsx    # Confirmation modal
│   │   ├── status-badge.tsx      # Case status badges
│   │   └── data-table.tsx        # Generic data table
│   ├── layouts/                  # Layout components
│   │   ├── platform-sidebar.tsx  # Main navigation sidebar
│   │   ├── platform-header.tsx   # Top header bar
│   │   └── case-nav.tsx          # Case workflow navigation
│   ├── features/                 # Feature-specific components
│   │   ├── dashboard/            # Dashboard widgets
│   │   ├── cases/                # Case management UI
│   │   ├── discovery/            # Discovery forms
│   │   ├── needs-analysis/       # Analysis visualizations
│   │   ├── recommendations/      # Recommendation UI
│   │   └── reports/              # Report preview & actions
│   └── charts/                   # Chart components (Recharts)
│
├── lib/
│   ├── api/                      # API client & service functions
│   │   ├── client.ts             # Axios instance configuration
│   │   ├── cases.ts              # Case CRUD operations
│   │   ├── discovery.ts          # Discovery data operations
│   │   ├── computation.ts        # Needs analysis computation
│   │   └── reports.ts            # Report generation & download
│   ├── validators/               # Zod validation schemas
│   │   ├── case.ts               # Case form validation
│   │   ├── discovery.ts          # Discovery form validation
│   │   └── client.ts             # Client data validation
│   ├── constants/                # Application constants
│   │   ├── navigation.ts         # Navigation menu items
│   │   └── case-status.ts        # Case status configuration
│   ├── formatters/               # Display formatting utilities
│   │   ├── currency.ts           # Currency formatting
│   │   ├── date.ts               # Date formatting (date-fns)
│   │   └── percentage.ts         # Percentage formatting
│   └── utils.ts                  # General utilities (cn helper)
│
├── hooks/                        # Custom React hooks
│   ├── use-cases.ts              # Case query/mutation hooks
│   ├── use-discovery.ts          # Discovery query/mutation hooks
│   ├── use-needs-analysis.ts     # Needs analysis hooks
│   ├── use-debounce.ts           # Debounce utility hook
│   └── use-mobile.ts             # Mobile detection hook
│
├── types/                        # TypeScript type definitions
│   ├── api.ts                    # API response types
│   ├── case.ts                   # Case management types
│   ├── client.ts                 # Client profile types
│   ├── discovery.ts              # Discovery workflow types
│   ├── needs-analysis.ts         # Needs analysis types
│   ├── recommendation.ts         # Recommendation types
│   └── report.ts                 # Report types
│
├── stores/                       # Client-side state
│   └── case-store.tsx            # Active case context store
│
└── providers/                    # React context providers
    ├── query-provider.tsx        # TanStack Query provider
    └── theme-provider.tsx        # Theme (light/dark) provider
```

## Application Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/dashboard` |
| `/login` | Advisor login |
| `/register` | Advisor registration |
| `/dashboard` | Overview with stats, recent cases, activity |
| `/cases` | Case list with search, filters, grid/table views |
| `/cases/new` | Create a new case |
| `/cases/[id]` | Case overview & workflow progress |
| `/cases/[id]/discovery` | 4-step client discovery wizard |
| `/cases/[id]/needs-analysis` | Insurance needs computation & results |
| `/cases/[id]/recommendations` | Product recommendations & funding validation |
| `/cases/[id]/report` | Configure & generate PDF recommendation pack |
| `/settings` | Profile, preferences, company settings |

## Case Workflow

The platform follows a structured 5-step workflow for each case:

```
Overview → Discovery → Needs Analysis → Recommendations → Report
```

1. **Overview** - Case details, client info, status tracking
2. **Discovery** - Structured 4-step data collection wizard:
   - Personal Information
   - Financial Profile
   - Existing Insurance Coverage
   - Goals & Priorities
3. **Needs Analysis** - Deterministic computation of insurance needs with AI-powered explanations
4. **Recommendations** - Insurance product selection, comparison, and funding validation
5. **Report** - Configurable client-ready PDF generation

## Architecture Notes

- **Frontend Only**: This project handles UI, routing, and API orchestration. Financial computations are performed by the separate Python FastAPI backend service.
- **Server Components by Default**: Pages use React Server Components where possible, with `"use client"` only where interactivity is needed.
- **Type Safety**: All API calls, form validation, and component props are fully typed with TypeScript and Zod.
- **Optimistic Updates**: TanStack Query handles caching, background refetching, and optimistic mutations.

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Backend Integration

This frontend expects a Python FastAPI backend running at `NEXT_PUBLIC_API_URL` with the following endpoint groups:

- `GET/POST/PATCH/DELETE /cases` - Case CRUD
- `GET/PUT /cases/:id/discovery` - Discovery data
- `POST /computation/needs-analysis/:id` - Trigger needs computation
- `GET /computation/ai-explanation/:id/:analysisId` - AI explanations
- `POST /computation/validate-funding/:id/:recommendationId` - Funding validation
- `POST /reports/:id/generate` - Generate PDF report
- `GET /reports/:id/:reportId/download` - Download PDF

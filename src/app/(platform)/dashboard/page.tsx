import { PageHeader } from "@/components/shared/page-header";
import { StatsCards } from "@/components/features/dashboard/stats-cards";
import { RecentCases } from "@/components/features/dashboard/recent-cases";
import { ActivityChart } from "@/components/features/dashboard/activity-chart";

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-4 sm:space-y-8 sm:p-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your cases and activity"
      />
      <div className="space-y-6 sm:space-y-8">
        <StatsCards />
        <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2">
          <RecentCases />
          <ActivityChart />
        </div>
      </div>
    </div>
  );
}

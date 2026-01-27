import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { FraudChart } from "@/components/dashboard/fraud-chart"
import { RiskDistribution } from "@/components/dashboard/risk-distribution"
import { RecentAlerts } from "@/components/dashboard/recent-alerts"
import { LiveFeed } from "@/components/dashboard/live-feed"
import {
  ArrowLeftRight,
  ShieldAlert,
  ShieldCheck,
  DollarSign,
  Timer,
} from "lucide-react"

export default function OverviewPage() {
  return (
    <DashboardLayout
      title="Overview"
      description="Real-time fraud detection monitoring dashboard"
    >
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="Total Transactions"
          value="61,826"
          description="Today"
          icon={ArrowLeftRight}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Fraud Detected"
          value="276"
          description="0.45% rate"
          icon={ShieldAlert}
          variant="danger"
          trend={{ value: 8.2, isPositive: false }}
        />
        <StatsCard
          title="Approved"
          value="57,362"
          description="92.8% approval"
          icon={ShieldCheck}
          variant="success"
          trend={{ value: 3.1, isPositive: true }}
        />
        <StatsCard
          title="Fraud Prevented"
          value="$2.4M"
          description="This month"
          icon={DollarSign}
          variant="success"
          trend={{ value: 18.4, isPositive: true }}
        />
        <StatsCard
          title="Avg Response Time"
          value="124ms"
          description="Target: <300ms"
          icon={Timer}
          trend={{ value: 5.2, isPositive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FraudChart />
        <RiskDistribution />
      </div>

      {/* Alerts and Live Feed */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <RecentAlerts />
        <LiveFeed />
      </div>
    </DashboardLayout>
  )
}

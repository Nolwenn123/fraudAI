"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const monthlyData = [
  { month: "Jan", fraudDetected: 2100, falsePositives: 180, transactions: 1250000 },
  { month: "Feb", fraudDetected: 1980, falsePositives: 165, transactions: 1180000 },
  { month: "Mar", fraudDetected: 2340, falsePositives: 142, transactions: 1420000 },
  { month: "Apr", fraudDetected: 2180, falsePositives: 128, transactions: 1380000 },
  { month: "May", fraudDetected: 1890, falsePositives: 115, transactions: 1290000 },
  { month: "Jun", fraudDetected: 2450, falsePositives: 98, transactions: 1520000 },
]

const fraudTypeData = [
  { name: "Card Not Present", value: 42, color: "oklch(0.65 0.2 25)" },
  { name: "Account Takeover", value: 28, color: "oklch(0.8 0.16 80)" },
  { name: "Identity Theft", value: 18, color: "oklch(0.65 0.18 250)" },
  { name: "Synthetic ID", value: 12, color: "oklch(0.72 0.19 160)" },
]

const channelData = [
  { channel: "Mobile App", approved: 45000, blocked: 120, review: 340 },
  { channel: "Web Portal", approved: 32000, blocked: 85, review: 210 },
  { channel: "POS Terminal", approved: 28000, blocked: 45, review: 89 },
  { channel: "ATM", approved: 18000, blocked: 62, review: 156 },
  { channel: "Wire Transfer", approved: 8500, blocked: 98, review: 245 },
]

const kpiData = [
  { label: "Fraud Detection Rate", value: "99.4%", change: "+0.3%", positive: true },
  { label: "False Positive Rate", value: "0.8%", change: "-0.2%", positive: true },
  { label: "False Negative Rate", value: "0.6%", change: "-0.1%", positive: true },
  { label: "Avg Decision Time", value: "124ms", change: "-12ms", positive: true },
]

export default function AnalyticsPage() {
  return (
    <DashboardLayout
      title="Analytics"
      description="Fraud detection performance metrics and insights"
    >
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.label} className="border-border bg-card">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-card-foreground">{kpi.value}</span>
                <span className={kpi.positive ? "text-success text-sm" : "text-danger text-sm"}>
                  {kpi.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="patterns">Fraud Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Monthly Trend */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Monthly Fraud Trend</CardTitle>
                <CardDescription>
                  Fraud detected vs false positives over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <XAxis
                        dataKey="month"
                        stroke="oklch(0.65 0 0)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="oklch(0.65 0 0)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(0.17 0.005 260)",
                          border: "1px solid oklch(0.28 0.005 260)",
                          borderRadius: "8px",
                          color: "oklch(0.95 0 0)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="fraudDetected"
                        stroke="oklch(0.65 0.2 25)"
                        strokeWidth={2}
                        dot={{ fill: "oklch(0.65 0.2 25)" }}
                        name="Fraud Detected"
                      />
                      <Line
                        type="monotone"
                        dataKey="falsePositives"
                        stroke="oklch(0.8 0.16 80)"
                        strokeWidth={2}
                        dot={{ fill: "oklch(0.8 0.16 80)" }}
                        name="False Positives"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Fraud Types Pie Chart */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Fraud by Type</CardTitle>
                <CardDescription>
                  Distribution of fraud types detected this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fraudTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {fraudTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "oklch(0.17 0.005 260)",
                          border: "1px solid oklch(0.28 0.005 260)",
                          borderRadius: "8px",
                          color: "oklch(0.95 0 0)",
                        }}
                        formatter={(value: number) => [`${value}%`, "Share"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {fraudTypeData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.name}: {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Volume */}
          <Card className="mt-6 border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Transaction Volume</CardTitle>
              <CardDescription>
                Total transactions processed per month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.72 0.19 160)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.72 0.19 160)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      stroke="oklch(0.65 0 0)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="oklch(0.65 0 0)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.17 0.005 260)",
                        border: "1px solid oklch(0.28 0.005 260)",
                        borderRadius: "8px",
                        color: "oklch(0.95 0 0)",
                      }}
                      formatter={(value: number) => [value.toLocaleString(), "Transactions"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="transactions"
                      stroke="oklch(0.72 0.19 160)"
                      fillOpacity={1}
                      fill="url(#colorVolume)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="mt-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Performance by Channel</CardTitle>
              <CardDescription>
                Transaction outcomes across different payment channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData} layout="vertical">
                    <XAxis
                      type="number"
                      stroke="oklch(0.65 0 0)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="channel"
                      stroke="oklch(0.65 0 0)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.17 0.005 260)",
                        border: "1px solid oklch(0.28 0.005 260)",
                        borderRadius: "8px",
                        color: "oklch(0.95 0 0)",
                      }}
                    />
                    <Bar dataKey="approved" stackId="a" fill="oklch(0.72 0.19 160)" name="Approved" />
                    <Bar dataKey="review" stackId="a" fill="oklch(0.8 0.16 80)" name="Review" />
                    <Bar dataKey="blocked" stackId="a" fill="oklch(0.65 0.2 25)" name="Blocked" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span className="text-sm text-muted-foreground">Approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-warning" />
                  <span className="text-sm text-muted-foreground">Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-danger" />
                  <span className="text-sm text-muted-foreground">Blocked</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Common Fraud Indicators</CardTitle>
                <CardDescription>Most frequently triggered fraud signals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { indicator: "Unusual Transaction Amount", count: 2340, percentage: 28 },
                    { indicator: "Geographic Anomaly", count: 1890, percentage: 23 },
                    { indicator: "Velocity Threshold Exceeded", count: 1560, percentage: 19 },
                    { indicator: "Device Fingerprint Mismatch", count: 1240, percentage: 15 },
                    { indicator: "Time Pattern Deviation", count: 980, percentage: 12 },
                  ].map((item) => (
                    <div key={item.indicator} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-card-foreground">{item.indicator}</span>
                        <span className="text-sm text-muted-foreground">{item.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">High-Risk Regions</CardTitle>
                <CardDescription>Fraud rate by geographic region</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { region: "Nigeria", rate: 4.2, transactions: 12500 },
                    { region: "Ukraine", rate: 3.8, transactions: 8900 },
                    { region: "Indonesia", rate: 2.9, transactions: 15600 },
                    { region: "Brazil", rate: 2.4, transactions: 23400 },
                    { region: "Vietnam", rate: 2.1, transactions: 11200 },
                  ].map((item) => (
                    <div
                      key={item.region}
                      className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"
                    >
                      <div>
                        <p className="font-medium text-card-foreground">{item.region}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.transactions.toLocaleString()} transactions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-danger">{item.rate}%</p>
                        <p className="text-xs text-muted-foreground">Fraud rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

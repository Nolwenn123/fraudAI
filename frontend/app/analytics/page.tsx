"use client"

import { useEffect, useMemo, useState } from "react"
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api"

type TransactionRow = {
  step: number | string
  type: string
  amount: number | string
  nameOrig: string
  isFraud?: boolean | string | number
  predictedIsFraud?: boolean | string | number
}

type StatsResponse = {
  total: number
  fraud: number
  approved: number
  fraud_rate: number
  approval_rate: number
  avg_response_time_ms: number
}

const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`
const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value)

const chartColors = [
  "oklch(0.65 0.2 25)",
  "oklch(0.8 0.16 80)",
  "oklch(0.65 0.18 250)",
  "oklch(0.72 0.19 160)",
  "oklch(0.55 0.2 305)",
]

export default function AnalyticsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [sample, setSample] = useState<TransactionRow[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/stats`)
        if (!res.ok) throw new Error(`status ${res.status}`)
        setStats((await res.json()) as StatsResponse)
      } catch {
        setStats(null)
      }
    }

    const fetchSample = async () => {
      try {
        const [resList, resFraud] = await Promise.all([
          fetch(`${API_BASE_URL}/transactions/list?limit=400&offset=0&use_model=true`),
          fetch(`${API_BASE_URL}/transactions/fraud?limit=50&use_model=true`),
        ])
        if (!resList.ok) throw new Error(`status ${resList.status}`)
        if (!resFraud.ok) throw new Error(`status ${resFraud.status}`)
        const listData = (await resList.json()) as TransactionRow[]
        const fraudData = (await resFraud.json()) as TransactionRow[]
        const merged = new Map<string, TransactionRow>()
        for (const row of listData) {
          merged.set(`${row.nameOrig}-${row.step}`, row)
        }
        for (const row of fraudData) {
          merged.set(`${row.nameOrig}-${row.step}`, row)
        }
        setSample(Array.from(merged.values()))
      } catch {
        setSample([])
      }
    }

    fetchStats()
    fetchSample()
  }, [])

  const metrics = useMemo(() => {
    const rows = sample.map((row) => {
      const predicted = row.predictedIsFraud ?? row.isFraud
      const predFlag = typeof predicted === "boolean" ? predicted : String(predicted) === "1"
      const actualFlag = String(row.isFraud ?? "0") === "1"
      return {
        type: row.type || "UNKNOWN",
        amount: Number(row.amount || 0),
        step: Number(row.step || 0),
        predicted: predFlag,
        actual: actualFlag,
      }
    })

    let tp = 0
    let fp = 0
    let fn = 0
    let tn = 0
    rows.forEach((r) => {
      if (r.predicted && r.actual) tp += 1
      else if (r.predicted && !r.actual) fp += 1
      else if (!r.predicted && r.actual) fn += 1
      else tn += 1
    })

    const detectionRate = tp + fn > 0 ? tp / (tp + fn) : stats?.fraud_rate ?? 0
    const falsePositiveRate = fp + tn > 0 ? fp / (fp + tn) : 0
    const falseNegativeRate = tp + fn > 0 ? fn / (tp + fn) : 0

    const byType = new Map<string, { total: number; fraud: number; fp: number }>()
    rows.forEach((r) => {
      const entry = byType.get(r.type) ?? { total: 0, fraud: 0, fp: 0 }
      entry.total += 1
      if (r.actual) entry.fraud += 1
      if (r.predicted && !r.actual) entry.fp += 1
      byType.set(r.type, entry)
    })

    const typeData = Array.from(byType.entries()).map(([type, value]) => ({
      type,
      fraudDetected: value.fraud,
      falsePositives: value.fp,
      transactions: value.total,
      fraudRate: value.total ? value.fraud / value.total : 0,
    }))

    const sortedTypes = [...typeData].sort((a, b) => b.transactions - a.transactions)

    const steps = rows.map((r) => r.step)
    const minStep = steps.length ? Math.min(...steps) : 0
    const maxStep = steps.length ? Math.max(...steps) : 0
    const bucketCount = 5
    const bucketSize = Math.max(1, Math.ceil((maxStep - minStep + 1) / bucketCount))
    const buckets = Array.from({ length: bucketCount }, (_, idx) => ({
      label: `${minStep + idx * bucketSize}-${minStep + (idx + 1) * bucketSize - 1}`,
      transactions: 0,
    }))
    rows.forEach((r) => {
      const index = Math.min(
        bucketCount - 1,
        Math.floor((r.step - minStep) / bucketSize)
      )
      buckets[index].transactions += 1
    })

    const amountBuckets = [
      { label: "0-100", min: 0, max: 100, total: 0, fraud: 0 },
      { label: "100-1k", min: 100, max: 1000, total: 0, fraud: 0 },
      { label: "1k-10k", min: 1000, max: 10000, total: 0, fraud: 0 },
      { label: "10k+", min: 10000, max: Number.POSITIVE_INFINITY, total: 0, fraud: 0 },
    ]
    rows.forEach((r) => {
      const bucket = amountBuckets.find((b) => r.amount >= b.min && r.amount < b.max)
      if (bucket) {
        bucket.total += 1
        if (r.actual) bucket.fraud += 1
      }
    })

    return {
      detectionRate,
      falsePositiveRate,
      falseNegativeRate,
      typeData: sortedTypes,
      buckets,
      amountBuckets,
    }
  }, [sample, stats])

  const kpiData = [
    {
      label: "Fraud Detection Rate",
      value: formatPercent(metrics.detectionRate),
      change: "sample",
      positive: true,
    },
    {
      label: "False Positive Rate",
      value: formatPercent(metrics.falsePositiveRate),
      change: "sample",
      positive: true,
    },
    {
      label: "False Negative Rate",
      value: formatPercent(metrics.falseNegativeRate),
      change: "sample",
      positive: true,
    },
    {
      label: "Avg Decision Time",
      value: stats?.avg_response_time_ms ? `${Math.round(stats.avg_response_time_ms)}ms` : "—",
      change: "runtime",
      positive: true,
    },
  ]

  const trendData = metrics.typeData.length
    ? metrics.typeData
    : [{ type: "N/A", fraudDetected: 0, falsePositives: 0, transactions: 0 }]

  const fraudTypeData = metrics.typeData.length
    ? metrics.typeData.map((item, index) => ({
        name: item.type,
        value: Math.round(item.fraudRate * 100),
        color: chartColors[index % chartColors.length],
      }))
    : [{ name: "N/A", value: 100, color: chartColors[0] }]

  const volumeData = metrics.buckets.length
    ? metrics.buckets
    : [{ label: "N/A", transactions: 0 }]

  const channelData = metrics.typeData.length
    ? metrics.typeData.map((item) => ({
        channel: item.type,
        approved: item.transactions - item.fraudDetected,
        blocked: item.fraudDetected,
      }))
    : [{ channel: "N/A", approved: 0, blocked: 0 }]

  const indicators = metrics.typeData.length
    ? metrics.typeData.slice(0, 5).map((item) => ({
        indicator: `${item.type} transactions`,
        count: item.transactions,
        percentage: Math.min(100, Math.round((item.transactions / (stats?.total || 1)) * 100)),
      }))
    : [{ indicator: "No data", count: 0, percentage: 0 }]

  const highRisk = metrics.amountBuckets.map((bucket) => ({
    label: bucket.label,
    rate: bucket.total ? (bucket.fraud / bucket.total) * 100 : 0,
    transactions: bucket.total,
  }))

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
            <CardTitle className="text-card-foreground">Fraud by Type</CardTitle>
            <CardDescription>
              Fraud detected vs false positives across transaction types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                    <XAxis
                        dataKey="type"
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
            <CardTitle className="text-card-foreground">Fraud Share by Type</CardTitle>
            <CardDescription>
              Fraud rate by transaction type (sample)
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
            <CardTitle className="text-card-foreground">Transaction Volume by Step Range</CardTitle>
            <CardDescription>
              Transactions grouped by step buckets (sample)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.72 0.19 160)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.72 0.19 160)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
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
                      tickFormatter={(value) => formatNumber(value)}
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
          <CardTitle className="text-card-foreground">Outcomes by Type</CardTitle>
          <CardDescription>
            Approved vs blocked by transaction type (sample)
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
            <CardTitle className="text-card-foreground">Most Common Types</CardTitle>
            <CardDescription>Transaction type frequency (sample)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {indicators.map((item) => (
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
            <CardTitle className="text-card-foreground">Fraud Rate by Amount</CardTitle>
            <CardDescription>Fraud rate by amount bucket (sample)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highRisk.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"
                >
                  <div>
                    <p className="font-medium text-card-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(item.transactions)} transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-danger">{item.rate.toFixed(2)}%</p>
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

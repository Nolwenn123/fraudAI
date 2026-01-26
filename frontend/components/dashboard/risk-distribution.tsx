"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"

const data = [
  { score: "0-20", count: 45000, color: "oklch(0.72 0.19 160)" },
  { score: "21-40", count: 12500, color: "oklch(0.72 0.19 160)" },
  { score: "41-60", count: 3200, color: "oklch(0.8 0.16 80)" },
  { score: "61-80", count: 850, color: "oklch(0.8 0.16 80)" },
  { score: "81-100", count: 276, color: "oklch(0.65 0.2 25)" },
]

export function RiskDistribution() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Risk Score Distribution</CardTitle>
        <CardDescription>
          Distribution of transactions by AI risk score (0-100)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="score"
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
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
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
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-success/10 p-3">
            <p className="text-lg font-semibold text-success">93.2%</p>
            <p className="text-xs text-muted-foreground">Low Risk (0-40)</p>
          </div>
          <div className="rounded-lg bg-warning/10 p-3">
            <p className="text-lg font-semibold text-warning">6.4%</p>
            <p className="text-xs text-muted-foreground">Medium Risk (41-80)</p>
          </div>
          <div className="rounded-lg bg-danger/10 p-3">
            <p className="text-lg font-semibold text-danger">0.4%</p>
            <p className="text-xs text-muted-foreground">High Risk (81-100)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

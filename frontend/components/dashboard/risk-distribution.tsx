"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"

const data = [
  { score: "Low Risk", count: 57600, color: "oklch(0.72 0.19 160)" },
  { score: "High Risk", count: 276, color: "oklch(0.65 0.2 25)" },
]

export function RiskDistribution() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Risk Score Distribution</CardTitle>
        <CardDescription>
          Distribution of transactions by fraud risk
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
        <div className="mt-4 grid grid-cols-2 gap-4 text-center">
          <div className="rounded-lg bg-success/10 p-3">
            <p className="text-lg font-semibold text-success">99.52%</p>
            <p className="text-xs text-muted-foreground">Low Risk</p>
          </div>
          <div className="rounded-lg bg-danger/10 p-3">
            <p className="text-lg font-semibold text-danger">0.48%</p>
            <p className="text-xs text-muted-foreground">High Risk</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

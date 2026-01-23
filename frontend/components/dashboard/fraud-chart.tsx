"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const data = [
  { time: "00:00", transactions: 1250, fraudulent: 12 },
  { time: "02:00", transactions: 890, fraudulent: 8 },
  { time: "04:00", transactions: 450, fraudulent: 3 },
  { time: "06:00", transactions: 780, fraudulent: 6 },
  { time: "08:00", transactions: 2100, fraudulent: 18 },
  { time: "10:00", transactions: 3400, fraudulent: 28 },
  { time: "12:00", transactions: 4200, fraudulent: 35 },
  { time: "14:00", transactions: 3800, fraudulent: 31 },
  { time: "16:00", transactions: 4500, fraudulent: 38 },
  { time: "18:00", transactions: 5200, fraudulent: 42 },
  { time: "20:00", transactions: 4100, fraudulent: 33 },
  { time: "22:00", transactions: 2800, fraudulent: 22 },
]

export function FraudChart() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Transaction Volume</CardTitle>
        <CardDescription>
          Real-time transaction monitoring with fraud detection overlay
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.18 250)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.65 0.18 250)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.65 0.2 25)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="oklch(0.65 0.2 25)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
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
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.17 0.005 260)",
                  border: "1px solid oklch(0.28 0.005 260)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0 0)",
                }}
              />
              <Area
                type="monotone"
                dataKey="transactions"
                stroke="oklch(0.65 0.18 250)"
                fillOpacity={1}
                fill="url(#colorTransactions)"
                strokeWidth={2}
                name="Total Transactions"
              />
              <Area
                type="monotone"
                dataKey="fraudulent"
                stroke="oklch(0.65 0.2 25)"
                fillOpacity={1}
                fill="url(#colorFraud)"
                strokeWidth={2}
                name="Flagged as Fraud"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-info" />
            <span className="text-sm text-muted-foreground">Total Transactions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-danger" />
            <span className="text-sm text-muted-foreground">Flagged as Fraud</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

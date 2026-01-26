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
  { type: "PAYMENT", transactions: 4200, fraudulent: 12 },
  { type: "TRANSFER", transactions: 1800, fraudulent: 48 },
  { type: "CASH_OUT", transactions: 2300, fraudulent: 36 },
  { type: "DEBIT", transactions: 900, fraudulent: 4 },
]

const FRAUD_SCALE_FACTOR = 10
const chartData = data.map((item) => ({
  ...item,
  fraudulentDisplay: Math.min(item.fraudulent * FRAUD_SCALE_FACTOR, item.transactions * 0.9),
}))

export function FraudChart() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Transaction Volume</CardTitle>
        <CardDescription>
          Transactions by type with fraud detection overlay
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
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
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.17 0.005 260)",
                  border: "1px solid oklch(0.28 0.005 260)",
                  borderRadius: "8px",
                  color: "oklch(0.95 0 0)",
                }}
                formatter={(value, name, props) => {
                  if (name === "Flagged as Fraud") {
                    return [props.payload.fraudulent, name]
                  }
                  return [value, name]
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
                dataKey="fraudulentDisplay"
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

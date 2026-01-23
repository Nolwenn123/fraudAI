"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Activity, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface Transaction {
  id: string
  amount: string
  merchant: string
  status: "approved" | "blocked" | "review"
  score: number
  time: string
}

const initialTransactions: Transaction[] = [
  { id: "TXN-89234", amount: "$124.50", merchant: "Amazon.com", status: "approved", score: 12, time: "Just now" },
  { id: "TXN-89233", amount: "$2,340.00", merchant: "Unknown Merchant", status: "blocked", score: 94, time: "10s ago" },
  { id: "TXN-89232", amount: "$89.99", merchant: "Netflix", status: "approved", score: 5, time: "25s ago" },
  { id: "TXN-89231", amount: "$567.00", merchant: "First Time Vendor", status: "review", score: 62, time: "1m ago" },
  { id: "TXN-89230", amount: "$45.00", merchant: "Uber", status: "approved", score: 8, time: "2m ago" },
  { id: "TXN-89229", amount: "$1,200.00", merchant: "Wire Transfer", status: "review", score: 71, time: "3m ago" },
  { id: "TXN-89228", amount: "$32.50", merchant: "Starbucks", status: "approved", score: 3, time: "4m ago" },
]

const statusConfig = {
  approved: {
    icon: CheckCircle,
    label: "Approved",
    className: "bg-success/10 text-success border-success/20",
  },
  blocked: {
    icon: XCircle,
    label: "Blocked",
    className: "bg-danger/10 text-danger border-danger/20",
  },
  review: {
    icon: AlertCircle,
    label: "Review",
    className: "bg-warning/10 text-warning border-warning/20",
  },
}

export function LiveFeed() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      const newTransaction: Transaction = {
        id: `TXN-${Math.floor(Math.random() * 100000)}`,
        amount: `$${(Math.random() * 5000).toFixed(2)}`,
        merchant: ["Amazon.com", "PayPal", "Stripe", "Unknown Vendor", "Wire Transfer", "Apple Store"][
          Math.floor(Math.random() * 6)
        ],
        status: ["approved", "approved", "approved", "blocked", "review"][
          Math.floor(Math.random() * 5)
        ] as Transaction["status"],
        score: Math.floor(Math.random() * 100),
        time: "Just now",
      }

      setTransactions((prev) => [newTransaction, ...prev.slice(0, 6)])
    }, 3000)

    return () => clearInterval(interval)
  }, [isLive])

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Activity className="h-5 w-5 text-primary" />
            Live Transaction Feed
          </CardTitle>
          <CardDescription>
            Real-time transactions processed by the AI engine
          </CardDescription>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors",
            isLive ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", isLive ? "animate-pulse bg-success" : "bg-muted-foreground")} />
          {isLive ? "Live" : "Paused"}
        </button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((transaction, index) => {
            const StatusIcon = statusConfig[transaction.status].icon
            return (
              <div
                key={`${transaction.id}-${index}`}
                className={cn(
                  "flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3 transition-all",
                  index === 0 && isLive && "animate-in fade-in slide-in-from-top-2 duration-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("rounded-lg p-1.5", statusConfig[transaction.status].className)}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{transaction.merchant}</p>
                    <p className="text-xs text-muted-foreground">{transaction.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-card-foreground">{transaction.amount}</p>
                  <div className="flex items-center justify-end gap-2">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", statusConfig[transaction.status].className)}
                    >
                      {statusConfig[transaction.status].label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Score: {transaction.score}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Activity, CheckCircle, XCircle } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api"
const POLL_INTERVAL_MS = 2000
const DISPLAY_LIMIT = 7

interface Transaction {
  id: string
  amount: string
  merchant: string
  status: "approved" | "blocked"
  time: string
}

interface TransactionRow {
  step: number | string
  type: string
  amount: number | string
  nameOrig: string
  isFraud?: boolean | string | number
  predictedIsFraud?: boolean | string | number
}

const formatAmount = (amount: string) =>
  Number(amount).toLocaleString("en-US", { style: "currency", currency: "USD" })

const toTransaction = (row: TransactionRow): Transaction => {
  const fraudValue = row.predictedIsFraud ?? row.isFraud
  const isFraudFlag = typeof fraudValue === "boolean" ? fraudValue : String(fraudValue) === "1"

  return {
    id: row.nameOrig,
    amount: formatAmount(String(row.amount)),
    merchant: row.type,
    status: isFraudFlag ? "blocked" : "approved",
    time: `#${row.step}`,
  }
}

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
}

export function LiveFeed() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLive, setIsLive] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLive) return

    let cancelled = false

    const fetchLive = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/transactions/live?limit=${DISPLAY_LIMIT}`)
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data: TransactionRow[] = await res.json()
        if (cancelled) return
        setLoadError(null)
        if (Array.isArray(data)) {
          setTransactions(data.map(toTransaction))
        }
      } catch (error) {
        console.error("Failed to load live transactions:", error)
        if (!cancelled) setLoadError("Impossible de charger les transactions depuis le backend.")
      }
    }

    fetchLive()
    const interval = setInterval(fetchLive, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
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
          {loadError && transactions.length === 0 && (
            <div className="rounded-lg border border-dashed border-danger/30 bg-danger/5 p-4 text-sm text-danger">
              {loadError}
            </div>
          )}
          {!loadError && transactions.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
              En attente de transactions… Envoie un POST sur /api/predict ou /api/predict/wallet pour voir apparaître la transaction ici.
            </div>
          )}
          {transactions.map((transaction, index) => {
            const StatusIcon = statusConfig[transaction.status].icon
            return (
              <div
                key={`${transaction.id}-${transaction.time}`}
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
                    <Badge variant="outline" className={cn("text-xs", statusConfig[transaction.status].className)}>
                      {statusConfig[transaction.status].label}
                    </Badge>
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

"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Activity, CheckCircle, XCircle } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api"

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
    time: `Step ${row.step}`,
  }
}


const initialTransactions: Transaction[] = []

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
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [isLive, setIsLive] = useState(true)
  const [sourceRows, setSourceRows] = useState<TransactionRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const nextIndexRef = useRef<number>(initialTransactions.length)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true)
        setLoadError(null)
        const res = await fetch(`${API_BASE_URL}/transactions?limit=200&use_model=false`)
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data = await res.json()

        console.log("DATA FROM API 👇", data)

        if (Array.isArray(data) && data.length) {
          setSourceRows(data)
          setTransactions(data.slice(0, 7).map(toTransaction))
          nextIndexRef.current = 7
        }
      } catch (error) {
        console.error("Failed to load live transactions from backend:", error)
        setLoadError("Impossible de charger les transactions depuis le backend.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  useEffect(() => {
    if (!isLive || sourceRows.length === 0) return

    const interval = setInterval(() => {
      const current = sourceRows[nextIndexRef.current % sourceRows.length]
      const newTransaction = toTransaction(current)
      nextIndexRef.current += 1
      setTransactions((prev) => [newTransaction, ...prev.slice(0, 6)])
    }, 3000)

    return () => clearInterval(interval)
  }, [isLive, sourceRows])

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
          {isLoading && transactions.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
              Chargement des transactions depuis paysim.csv…
            </div>
          )}
          {!isLoading && loadError && transactions.length === 0 && (
            <div className="rounded-lg border border-dashed border-danger/30 bg-danger/5 p-4 text-sm text-danger">
              {loadError}
            </div>
          )}
          {!isLoading && !loadError && transactions.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
              Aucune transaction disponible pour le moment.
            </div>
          )}
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

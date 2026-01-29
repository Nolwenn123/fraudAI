"use client"

import { useEffect, useMemo, useState } from "react"
import * as XLSX from "xlsx"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Info,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api"
const PAGE_SIZE = 50

interface Transaction {
  id: string
  amount: number
  type: string
  status: "approved" | "blocked"
  riskScore: number
  step: number
  isFraud: boolean
}

interface TransactionRow {
  step: number | string
  type: string
  amount: number | string
  nameOrig: string
  isFraud?: boolean | string | number
  predictedIsFraud?: boolean | string | number
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

function getRiskColor(score: number) {
  if (score <= 30) return "text-success"
  if (score <= 70) return "text-warning"
  return "text-danger"
}

function getRiskBgColor(score: number) {
  if (score <= 30) return "bg-success/10"
  if (score <= 70) return "bg-warning/10"
  return "bg-danger/10"
}

function computeRiskScore(amount: number, isFraud: boolean) {
  if (isFraud) return 90
  const scaled = 5 + Math.log10(Math.max(amount, 1)) * 10
  return Math.max(1, Math.min(70, Math.round(scaled)))
}

export default function TransactionsPage() {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/stats`)
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data = await res.json()
        setTotal(data.total ?? 0)
      } catch {
        setTotal(0)
      }
    }
    fetchStats()
  }, [])

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true)
        const offset = (page - 1) * PAGE_SIZE
        const res = await fetch(
          `${API_BASE_URL}/transactions/list?limit=${PAGE_SIZE}&offset=${offset}&use_model=true`
        )
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data = (await res.json()) as TransactionRow[]
        const mapped = data.map((row) => {
          const fraudValue = row.predictedIsFraud ?? row.isFraud
          const isFraudFlag =
            typeof fraudValue === "boolean" ? fraudValue : String(fraudValue) === "1"
          const amount = Number(row.amount || 0)
          return {
            id: row.nameOrig,
            amount,
            type: row.type,
            status: isFraudFlag ? "blocked" : "approved",
            riskScore: computeRiskScore(amount, isFraudFlag),
            step: Number(row.step || 0),
            isFraud: isFraudFlag,
          }
        })
        setTransactions(mapped)
      } catch {
        setTransactions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [page])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.type.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || t.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [transactions, searchQuery, statusFilter])

  const handleExport = () => {
    const exportData = filteredTransactions.map((t) => ({
      "Transaction ID": t.id,
      "Type": t.type,
      "Amount": t.amount,
      "Risk Score": t.riskScore,
      "Status": statusConfig[t.status].label,
      "Step": t.step,
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions")
    XLSX.writeFile(workbook, "transactions.xlsx")
  }

  return (
    <DashboardLayout
      title="Transactions"
      description="Monitor and manage all transactions in real-time"
    >
      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-secondary pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-secondary">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="mt-6 border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Transaction
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Risk Score
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => {
                  const StatusIcon = statusConfig[transaction.status].icon
                  return (
                    <tr
                      key={transaction.id}
                      className="border-b border-border transition-colors hover:bg-secondary/30"
                    >
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-card-foreground">
                            {transaction.type}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{transaction.id}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              Step {transaction.step}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="font-semibold text-card-foreground">
                          ${transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Step {transaction.step}
                        </p>
                      </td>
                      <td className="py-4">
                        <div
                          className={cn(
                            "inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-semibold",
                            getRiskBgColor(transaction.riskScore),
                            getRiskColor(transaction.riskScore)
                          )}
                        >
                          {transaction.riskScore}
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge
                          className={cn(
                            "border",
                            statusConfig[transaction.status].className
                          )}
                        >
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusConfig[transaction.status].label}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTransactions.length} of {total || transactions.length} transactions
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                {page}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading || (total > 0 && page * PAGE_SIZE >= total)}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Transaction Details</DialogTitle>
            <DialogDescription>
              {selectedTransaction?.id} - {selectedTransaction?.type}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="mt-4 space-y-6">
              {/* Risk Assessment */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <h3 className="mb-3 font-semibold text-card-foreground">AI Risk Assessment</h3>
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold",
                      getRiskBgColor(selectedTransaction.riskScore),
                      getRiskColor(selectedTransaction.riskScore)
                    )}
                  >
                    {selectedTransaction.riskScore}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-card-foreground">
                      {selectedTransaction.riskScore <= 30
                        ? "Low Risk"
                        : selectedTransaction.riskScore <= 70
                        ? "Medium Risk"
                        : "High Risk"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Decision: {statusConfig[selectedTransaction.status].label}
                    </p>
                  </div>
                  <Badge className={cn("border", statusConfig[selectedTransaction.status].className)}>
                    {statusConfig[selectedTransaction.status].label}
                  </Badge>
                </div>
              </div>

              {/* Transaction Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Transaction Info</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Type:</span>
                      <span className="text-card-foreground">{selectedTransaction.type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Step:</span>
                      <span className="text-card-foreground">{selectedTransaction.step}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedTransaction.status === "blocked" && (
                <div className="flex gap-3 border-t border-border pt-4">
                  <Button variant="outline" className="flex-1">
                    <Info className="mr-2 h-4 w-4" />
                    Review Details
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

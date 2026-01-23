"use client"

import { useState } from "react"
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
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Smartphone,
  Globe,
  User,
  Info,
} from "lucide-react"

interface Transaction {
  id: string
  amount: number
  currency: string
  merchant: string
  merchantCategory: string
  status: "approved" | "blocked" | "review" | "pending"
  riskScore: number
  timestamp: string
  cardLast4: string
  country: string
  city: string
  channel: string
  device: string
  ip: string
  userId: string
  userName: string
  riskFactors: string[]
}

const transactions: Transaction[] = [
  {
    id: "TXN-89234",
    amount: 12450.0,
    currency: "USD",
    merchant: "Unknown Electronics Store",
    merchantCategory: "Electronics",
    status: "blocked",
    riskScore: 94,
    timestamp: "2024-01-22T14:32:15Z",
    cardLast4: "4521",
    country: "Nigeria",
    city: "Lagos",
    channel: "Online",
    device: "Unknown Device",
    ip: "102.89.45.xxx",
    userId: "USR-12345",
    userName: "John Smith",
    riskFactors: ["High-risk country", "Unknown merchant", "Unusual amount", "New device"],
  },
  {
    id: "TXN-89233",
    amount: 3200.0,
    currency: "USD",
    merchant: "Wire Transfer - International",
    merchantCategory: "Financial Services",
    status: "review",
    riskScore: 78,
    timestamp: "2024-01-22T14:28:45Z",
    cardLast4: "8832",
    country: "Russia",
    city: "Moscow",
    channel: "Web Portal",
    device: "Chrome on Windows",
    ip: "185.43.12.xxx",
    userId: "USR-67890",
    userName: "Alice Johnson",
    riskFactors: ["Geographic anomaly", "Large transfer", "First-time recipient"],
  },
  {
    id: "TXN-89232",
    amount: 89.99,
    currency: "USD",
    merchant: "Netflix",
    merchantCategory: "Entertainment",
    status: "approved",
    riskScore: 5,
    timestamp: "2024-01-22T14:25:12Z",
    cardLast4: "1234",
    country: "USA",
    city: "New York",
    channel: "Mobile App",
    device: "iPhone 15 Pro",
    ip: "72.45.xxx.xxx",
    userId: "USR-11111",
    userName: "Bob Williams",
    riskFactors: [],
  },
  {
    id: "TXN-89231",
    amount: 567.0,
    currency: "EUR",
    merchant: "Amazon DE",
    merchantCategory: "Retail",
    status: "approved",
    riskScore: 12,
    timestamp: "2024-01-22T14:22:33Z",
    cardLast4: "9087",
    country: "Germany",
    city: "Berlin",
    channel: "Mobile App",
    device: "Samsung Galaxy S24",
    ip: "89.12.xxx.xxx",
    userId: "USR-22222",
    userName: "Emma Davis",
    riskFactors: [],
  },
  {
    id: "TXN-89230",
    amount: 2150.0,
    currency: "USD",
    merchant: "First Time Vendor LLC",
    merchantCategory: "Professional Services",
    status: "review",
    riskScore: 62,
    timestamp: "2024-01-22T14:18:45Z",
    cardLast4: "5566",
    country: "Hong Kong",
    city: "Hong Kong",
    channel: "Web Portal",
    device: "Safari on MacOS",
    ip: "203.145.xxx.xxx",
    userId: "USR-33333",
    userName: "Michael Chen",
    riskFactors: ["First-time merchant", "Large amount", "Unusual time"],
  },
  {
    id: "TXN-89229",
    amount: 45.0,
    currency: "USD",
    merchant: "Uber",
    merchantCategory: "Transportation",
    status: "approved",
    riskScore: 3,
    timestamp: "2024-01-22T14:15:22Z",
    cardLast4: "7788",
    country: "USA",
    city: "San Francisco",
    channel: "Mobile App",
    device: "iPhone 14",
    ip: "64.23.xxx.xxx",
    userId: "USR-44444",
    userName: "Sarah Miller",
    riskFactors: [],
  },
  {
    id: "TXN-89228",
    amount: 8900.0,
    currency: "USD",
    merchant: "Suspicious Crypto Exchange",
    merchantCategory: "Financial Services",
    status: "blocked",
    riskScore: 98,
    timestamp: "2024-01-22T14:12:18Z",
    cardLast4: "3344",
    country: "Unknown",
    city: "VPN Detected",
    channel: "Online",
    device: "Unknown Browser",
    ip: "VPN/Proxy",
    userId: "USR-55555",
    userName: "David Brown",
    riskFactors: ["VPN/Proxy detected", "Known fraud merchant", "High amount", "Crypto exchange"],
  },
  {
    id: "TXN-89227",
    amount: 125.5,
    currency: "GBP",
    merchant: "Tesco",
    merchantCategory: "Groceries",
    status: "approved",
    riskScore: 8,
    timestamp: "2024-01-22T14:08:55Z",
    cardLast4: "2211",
    country: "UK",
    city: "London",
    channel: "POS Terminal",
    device: "Card Present",
    ip: "N/A",
    userId: "USR-66666",
    userName: "James Wilson",
    riskFactors: [],
  },
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
    icon: AlertTriangle,
    label: "Review",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    className: "bg-info/10 text-info border-info/20",
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

export default function TransactionsPage() {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleExport = () => {
    const exportData = filteredTransactions.map((t) => ({
      "Transaction ID": t.id,
      "User": t.userName,
      "Amount": `${t.amount} ${t.currency}`,
      "Location": `${t.city}, ${t.country}`,
      "Risk Score": t.riskScore,
      "Status": statusConfig[t.status].label,
      "Date": new Date(t.timestamp).toLocaleString(),
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
                placeholder="Search by ID, merchant, or user..."
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
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
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
                    User
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Location
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
                            {transaction.merchant}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{transaction.id}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              ****{transaction.cardLast4}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-sm text-card-foreground">
                          {transaction.userName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.userId}
                        </p>
                      </td>
                      <td className="py-4">
                        <p className="font-semibold text-card-foreground">
                          {transaction.currency === "USD" ? "$" : transaction.currency === "EUR" ? "€" : "£"}
                          {transaction.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.timestamp).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1 text-sm text-card-foreground">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {transaction.city}, {transaction.country}
                        </div>
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
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                1
              </Button>
              <Button variant="outline" size="sm">
                2
              </Button>
              <Button variant="outline" size="sm">
                3
              </Button>
              <Button variant="outline" size="sm">
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
              {selectedTransaction?.id} - {selectedTransaction?.merchant}
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

              {/* Risk Factors */}
              {selectedTransaction.riskFactors.length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold text-card-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Risk Factors Detected
                  </h3>
                  <div className="grid gap-2">
                    {selectedTransaction.riskFactors.map((factor) => (
                      <div
                        key={factor}
                        className="flex items-center gap-2 rounded-lg border border-warning/20 bg-warning/5 p-2 text-sm"
                      >
                        <Info className="h-4 w-4 text-warning" />
                        <span className="text-card-foreground">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transaction Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Transaction Info</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Card:</span>
                      <span className="text-card-foreground">****{selectedTransaction.cardLast4}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Channel:</span>
                      <span className="text-card-foreground">{selectedTransaction.channel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Time:</span>
                      <span className="text-card-foreground">
                        {new Date(selectedTransaction.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Device & Location</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Device:</span>
                      <span className="text-card-foreground">{selectedTransaction.device}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Location:</span>
                      <span className="text-card-foreground">
                        {selectedTransaction.city}, {selectedTransaction.country}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">IP:</span>
                      <span className="text-card-foreground">{selectedTransaction.ip}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedTransaction.status === "review" && (
                <div className="flex gap-3 border-t border-border pt-4">
                  <Button className="flex-1 bg-success text-success-foreground hover:bg-success/90">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Transaction
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    <XCircle className="mr-2 h-4 w-4" />
                    Block Transaction
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

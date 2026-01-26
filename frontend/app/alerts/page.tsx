"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  CreditCard,
  Filter,
  MapPin,
  MessageSquare,
  Shield,
  ThumbsDown,
  ThumbsUp,
  XCircle,
  ChevronRight,
  User,
} from "lucide-react"

interface Alert {
  id: string
  type: "high" | "medium" | "low"
  category: string
  title: string
  description: string
  transactionId: string
  amount: string
  location: string
  timestamp: string
  score: number
  status: "pending" | "resolved" | "false_positive" | "confirmed"
  userName: string
  userResponse?: "confirmed_fraud" | "legitimate" | null
}

const alerts: Alert[] = [
  {
    id: "ALT-001",
    type: "high",
    category: "Unusual Pattern",
    title: "Multiple High-Value Transactions",
    description: "15 transactions totaling $48,000 detected from new device in the last 30 minutes",
    transactionId: "TXN-89234",
    amount: "$48,000.00",
    location: "Lagos, Nigeria",
    timestamp: "2024-01-22T14:32:15Z",
    score: 96,
    status: "pending",
    userName: "John Smith",
    userResponse: null,
  },
  {
    id: "ALT-002",
    type: "high",
    category: "Account Takeover",
    title: "Suspicious Login Attempt",
    description: "Login from unknown device followed by password change and large withdrawal",
    transactionId: "TXN-89233",
    amount: "$12,500.00",
    location: "Moscow, Russia",
    timestamp: "2024-01-22T14:28:45Z",
    score: 92,
    status: "pending",
    userName: "Alice Johnson",
    userResponse: null,
  },
  {
    id: "ALT-003",
    type: "medium",
    category: "Velocity",
    title: "Transaction Velocity Exceeded",
    description: "Card used 8 times in 5 minutes across different merchants",
    transactionId: "TXN-89231",
    amount: "$3,240.00",
    location: "Hong Kong",
    timestamp: "2024-01-22T14:18:45Z",
    score: 74,
    status: "pending",
    userName: "Michael Chen",
    userResponse: null,
  },
  {
    id: "ALT-004",
    type: "medium",
    category: "Geographic",
    title: "Impossible Travel Detected",
    description: "Transaction in Paris 2 hours after transaction in New York",
    transactionId: "TXN-89230",
    amount: "$890.00",
    location: "Paris, France",
    timestamp: "2024-01-22T14:15:22Z",
    score: 68,
    status: "resolved",
    userName: "Emma Davis",
    userResponse: "legitimate",
  },
  {
    id: "ALT-005",
    type: "low",
    category: "First-Time",
    title: "New Merchant Category",
    description: "First cryptocurrency exchange transaction for this user",
    transactionId: "TXN-89228",
    amount: "$2,500.00",
    location: "Online",
    timestamp: "2024-01-22T14:12:18Z",
    score: 42,
    status: "false_positive",
    userName: "David Brown",
    userResponse: "legitimate",
  },
  {
    id: "ALT-006",
    type: "high",
    category: "Card Testing",
    title: "Potential Card Testing",
    description: "Multiple small transactions ($1-$5) followed by large purchase attempt",
    transactionId: "TXN-89227",
    amount: "$5,600.00",
    location: "Unknown VPN",
    timestamp: "2024-01-22T14:08:55Z",
    score: 88,
    status: "confirmed",
    userName: "James Wilson",
    userResponse: "confirmed_fraud",
  },
]

const typeStyles = {
  high: "bg-danger/10 text-danger border-danger/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-info/10 text-info border-info/20",
}

const statusStyles = {
  pending: "bg-warning/10 text-warning border-warning/20",
  resolved: "bg-success/10 text-success border-success/20",
  false_positive: "bg-info/10 text-info border-info/20",
  confirmed: "bg-danger/10 text-danger border-danger/20",
}

const statusLabels = {
  pending: "Pending Review",
  resolved: "Resolved",
  false_positive: "False Positive",
  confirmed: "Confirmed Fraud",
}

export default function AlertsPage() {
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredAlerts = alerts.filter((alert) => {
    const matchesType = typeFilter === "all" || alert.type === typeFilter
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter
    return matchesType && matchesStatus
  })

  const pendingCount = alerts.filter((a) => a.status === "pending").length
  const highRiskCount = alerts.filter((a) => a.type === "high" && a.status === "pending").length

  return (
    <DashboardLayout
      title="Alerts"
      description="Review and manage fraud alerts"
    >
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-warning/10 p-3">
                <Bell className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-danger/10 p-3">
                <AlertTriangle className="h-6 w-6 text-danger" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{highRiskCount}</p>
                <p className="text-sm text-muted-foreground">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-success/10 p-3">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">
                  {alerts.filter((a) => a.status === "resolved").length}
                </p>
                <p className="text-sm text-muted-foreground">Resolved Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-info/10 p-3">
                <Shield className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">
                  {alerts.filter((a) => a.status === "confirmed").length}
                </p>
                <p className="text-sm text-muted-foreground">Confirmed Fraud</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card className="mt-6 border-border bg-card">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-card-foreground">Fraud Alerts</CardTitle>
              <CardDescription>
                Review and take action on flagged transactions
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] bg-secondary">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-secondary">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="false_positive">False Positive</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-6 bg-secondary">
              <TabsTrigger value="all">All ({filteredAlerts.length})</TabsTrigger>
              <TabsTrigger value="action">
                Needs Action ({filteredAlerts.filter((a) => a.status === "pending").length})
              </TabsTrigger>
              <TabsTrigger value="user">
                User Response ({filteredAlerts.filter((a) => a.userResponse).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </TabsContent>

            <TabsContent value="action" className="space-y-4">
              {filteredAlerts
                .filter((a) => a.status === "pending")
                .map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
            </TabsContent>

            <TabsContent value="user" className="space-y-4">
              {filteredAlerts
                .filter((a) => a.userResponse)
                .map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

function AlertCard({ alert }: { alert: Alert }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={cn("rounded-lg p-2", typeStyles[alert.type])}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-card-foreground">{alert.title}</h3>
              <Badge variant="outline" className="text-xs">
                {alert.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{alert.description}</p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                {alert.amount}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {alert.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(alert.timestamp).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {alert.userName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Badge className={cn("border", typeStyles[alert.type])}>
              Score: {alert.score}
            </Badge>
            <Badge className={cn("border", statusStyles[alert.status])}>
              {statusLabels[alert.status]}
            </Badge>
          </div>

          {/* User Response */}
          {alert.userResponse && (
            <div className="flex items-center gap-2 text-xs">
              <MessageSquare className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">User:</span>
              {alert.userResponse === "confirmed_fraud" ? (
                <span className="flex items-center gap-1 text-danger">
                  <ThumbsDown className="h-3 w-3" />
                  Confirmed Fraud
                </span>
              ) : (
                <span className="flex items-center gap-1 text-success">
                  <ThumbsUp className="h-3 w-3" />
                  Legitimate
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          {alert.status === "pending" && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-success hover:bg-success/10 bg-transparent">
                <CheckCircle className="mr-1 h-3 w-3" />
                Approve
              </Button>
              <Button size="sm" variant="outline" className="text-danger hover:bg-danger/10 bg-transparent">
                <XCircle className="mr-1 h-3 w-3" />
                Block
              </Button>
              <Button size="sm" variant="ghost">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

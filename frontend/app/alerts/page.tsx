"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Smartphone,
  Globe,
  Zap,
  Activity,
  ShieldAlert,
  Ban,
  TrendingUp,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api"

interface RiskFactor {
  category: string
  description: string
  severity: "high" | "medium" | "low"
  icon: "velocity" | "geographic" | "device" | "amount" | "pattern" | "identity"
}

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
  userEmail?: string
  userResponse?: "confirmed_fraud" | "legitimate" | null
  // AI Explainability data
  riskFactors: RiskFactor[]
  device?: string
  ipAddress?: string
  userLocation?: string
  transactionCount?: number
  timeWindow?: string
}

interface TransactionRow {
  step: number | string
  type: string
  amount: number | string
  nameOrig: string
  isFraud?: boolean | string | number
  predictedIsFraud?: boolean | string | number
}

const formatAmount = (amount: number) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" })

const computeScore = (amount: number) => {
  const scaled = 70 + Math.log10(Math.max(amount, 1)) * 10
  return Math.max(70, Math.min(99, Math.round(scaled)))
}

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

const riskIconMap = {
  velocity: Zap,
  geographic: Globe,
  device: Smartphone,
  amount: TrendingUp,
  pattern: Activity,
  identity: ShieldAlert,
}

const severityStyles = {
  high: "border-danger/30 bg-danger/5",
  medium: "border-warning/30 bg-warning/5",
  low: "border-info/30 bg-info/5",
}

const severityTextStyles = {
  high: "text-danger",
  medium: "text-warning",
  low: "text-info",
}

function getRiskLabel(score: number) {
  if (score >= 80) return "High Risk"
  if (score >= 50) return "Medium Risk"
  return "Low Risk"
}

function getRiskColor(score: number) {
  if (score >= 80) return "text-danger"
  if (score >= 50) return "text-warning"
  return "text-success"
}

function getRiskBgColor(score: number) {
  if (score >= 80) return "bg-danger/10"
  if (score >= 50) return "bg-warning/10"
  return "bg-success/10"
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/transactions/fraud?limit=20&use_model=true`
        )
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data = (await res.json()) as TransactionRow[]
        const fraudRows = data.filter((row) => {
          const flag = row.predictedIsFraud ?? row.isFraud
          return typeof flag === "boolean" ? flag : String(flag) === "1"
        })

        const mapped: Alert[] = fraudRows.slice(0, 12).map((row, index) => {
          const amount = Number(row.amount || 0)
          const score = computeScore(amount)
          return {
            id: `ALT-${index + 1}`,
            type: "high",
            category: "Fraud",
            title: `Suspected ${row.type} Fraud`,
            description: "Transaction flagged as fraudulent by the model",
            transactionId: row.nameOrig,
            amount: formatAmount(amount),
            location: "PaySim",
            timestamp: `Step ${row.step}`,
            score,
            status: "pending",
            userName: row.nameOrig || "Unknown",
            userEmail: undefined,
            userResponse: null,
            device: undefined,
            ipAddress: undefined,
            userLocation: undefined,
            transactionCount: undefined,
            timeWindow: undefined,
            riskFactors: [
              {
                category: "Model Flag",
                description: "Transaction predicted as fraud",
                severity: "high",
                icon: "pattern",
              },
              {
                category: "Amount",
                description: `Amount ${formatAmount(amount)}`,
                severity: "high",
                icon: "amount",
              },
            ],
          }
        })

        setAlerts(mapped)
      } catch {
        setAlerts([])
      }
    }

    fetchAlerts()
  }, [])

  const filteredAlerts = alerts.filter((alert) => {
    const matchesType = typeFilter === "all" || alert.type === typeFilter
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter
    return matchesType && matchesStatus
  })

  const pendingCount = alerts.filter((a) => a.status === "pending").length
  const highRiskCount = alerts.filter((a) => a.type === "high" && a.status === "pending").length

  // Quick Action: Approve (False Positive)
  const handleApprove = (alertId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId
          ? { ...alert, status: "false_positive" as const, userResponse: "legitimate" as const }
          : alert
      )
    )
    toast.success("Transaction approved", {
      description: `Alert ${alertId} marked as false positive.`,
    })
    // Close modal if open
    if (selectedAlert?.id === alertId) {
      setSelectedAlert(null)
    }
  }

  // Quick Action: Block (Confirm Fraud)
  const handleBlock = (alertId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId
          ? { ...alert, status: "confirmed" as const, userResponse: "confirmed_fraud" as const }
          : alert
      )
    )
    toast.error("Transaction blocked & User suspended", {
      description: `Alert ${alertId} confirmed as fraud. User account has been suspended.`,
    })
    // Close modal if open
    if (selectedAlert?.id === alertId) {
      setSelectedAlert(null)
    }
  }

  // Open investigation modal
  const handleOpenInvestigation = (alert: Alert) => {
    setSelectedAlert(alert)
  }

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
                  {alerts.filter((a) => a.status === "resolved" || a.status === "false_positive").length}
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
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onApprove={handleApprove}
                  onBlock={handleBlock}
                  onOpenInvestigation={handleOpenInvestigation}
                />
              ))}
            </TabsContent>

            <TabsContent value="action" className="space-y-4">
              {filteredAlerts
                .filter((a) => a.status === "pending")
                .map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onApprove={handleApprove}
                    onBlock={handleBlock}
                    onOpenInvestigation={handleOpenInvestigation}
                  />
                ))}
            </TabsContent>

            <TabsContent value="user" className="space-y-4">
              {filteredAlerts
                .filter((a) => a.userResponse)
                .map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onApprove={handleApprove}
                    onBlock={handleBlock}
                    onOpenInvestigation={handleOpenInvestigation}
                  />
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Investigation Modal */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl bg-card">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-card-foreground text-xl">
                  Alert Investigation
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {selectedAlert?.id} - {selectedAlert?.title}
                </DialogDescription>
              </div>
              {selectedAlert && (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2",
                    getRiskBgColor(selectedAlert.score)
                  )}
                >
                  <span
                    className={cn(
                      "text-2xl font-bold",
                      getRiskColor(selectedAlert.score)
                    )}
                  >
                    {selectedAlert.score}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      getRiskColor(selectedAlert.score)
                    )}
                  >
                    {getRiskLabel(selectedAlert.score)}
                  </span>
                </div>
              )}
            </div>
          </DialogHeader>

          {selectedAlert && (
            <div className="mt-4 space-y-6">
              {/* AI Risk Analysis Section */}
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-card-foreground">
                  <ShieldAlert className="h-5 w-5 text-warning" />
                  AI Risk Analysis
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Our AI detected the following risk factors that triggered this alert:
                </p>
                <div className="space-y-3">
                  {selectedAlert.riskFactors.map((factor, index) => {
                    const IconComponent = riskIconMap[factor.icon]
                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start gap-3 rounded-lg border p-3",
                          severityStyles[factor.severity]
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-lg p-2",
                            factor.severity === "high"
                              ? "bg-danger/10"
                              : factor.severity === "medium"
                              ? "bg-warning/10"
                              : "bg-info/10"
                          )}
                        >
                          <IconComponent
                            className={cn("h-4 w-4", severityTextStyles[factor.severity])}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-card-foreground">
                              {factor.category}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs capitalize",
                                severityTextStyles[factor.severity]
                              )}
                            >
                              {factor.severity}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {factor.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Transaction & User Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Transaction Details
                  </h4>
                  <div className="space-y-2 rounded-lg border border-border bg-secondary/20 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold text-card-foreground">
                        {selectedAlert.amount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Location:</span>
                      <span className="text-card-foreground">{selectedAlert.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Time:</span>
                      <span className="text-card-foreground">
                        {new Date(selectedAlert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Transactions:</span>
                      <span className="text-card-foreground">
                        {selectedAlert.transactionCount} in {selectedAlert.timeWindow}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    User & Device Info
                  </h4>
                  <div className="space-y-2 rounded-lg border border-border bg-secondary/20 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">User:</span>
                      <span className="text-card-foreground">{selectedAlert.userName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">User Location:</span>
                      <span className="text-card-foreground">
                        {selectedAlert.userLocation || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Device:</span>
                      <span className="text-card-foreground">
                        {selectedAlert.device || "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">IP:</span>
                      <span className="text-card-foreground">
                        {selectedAlert.ipAddress || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedAlert.status === "pending" && (
                <div className="flex gap-3 border-t border-border pt-4">
                  <Button
                    className="flex-1 bg-danger text-danger-foreground hover:bg-danger/90"
                    onClick={() => handleBlock(selectedAlert.id)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Confirm Fraud (Block)
                  </Button>
                  <Button
                    className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                    onClick={() => handleApprove(selectedAlert.id)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    False Positive (Approve)
                  </Button>
                </div>
              )}

              {/* Status indicator for already processed alerts */}
              {selectedAlert.status !== "pending" && (
                <div className="flex items-center justify-center gap-2 border-t border-border pt-4">
                  <Badge className={cn("border", statusStyles[selectedAlert.status])}>
                    {statusLabels[selectedAlert.status]}
                  </Badge>
                  {selectedAlert.userResponse && (
                    <span className="text-sm text-muted-foreground">
                      - User confirmed:{" "}
                      {selectedAlert.userResponse === "confirmed_fraud"
                        ? "Fraud"
                        : "Legitimate"}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

interface AlertCardProps {
  alert: Alert
  onApprove: (alertId: string, e?: React.MouseEvent) => void
  onBlock: (alertId: string, e?: React.MouseEvent) => void
  onOpenInvestigation: (alert: Alert) => void
}

function AlertCard({ alert, onApprove, onBlock, onOpenInvestigation }: AlertCardProps) {
  return (
    <div
      className="cursor-pointer rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
      onClick={() => onOpenInvestigation(alert)}
    >
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
              <Button
                size="sm"
                variant="outline"
                className="bg-transparent text-success hover:bg-success/10"
                onClick={(e) => onApprove(alert.id, e)}
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-transparent text-danger hover:bg-danger/10"
                onClick={(e) => onBlock(alert.id, e)}
              >
                <XCircle className="mr-1 h-3 w-3" />
                Block
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenInvestigation(alert)
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

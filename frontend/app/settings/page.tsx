"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Shield,
  Bell,
  Key,
  Sliders,
  Globe,
  Mail,
  Webhook,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Check,
  FileText,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  User,
  Bot,
  ShieldAlert,
  Lock,
} from "lucide-react"

// Types for API Keys
interface ApiKey {
  id: string
  name: string
  key: string
  status: "active" | "test"
  createdAt: string
  lastUsed: string
}

// Types for Webhooks
interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  status: "active" | "inactive"
  lastTriggered: string
}

// Types for Audit Logs
interface AuditLog {
  id: string
  timestamp: string
  user: string
  userType: "user" | "system" | "admin" | "unknown"
  action: string
  resource: string
  status: "success" | "failed" | "warning"
}

// Mock Audit Logs data
const auditLogs: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "Jan 22, 2024 14:30:05",
    user: "John Doe",
    userType: "user",
    action: "VIEW_SENSITIVE_DATA",
    resource: "Transaction TXN-89234",
    status: "success",
  },
  {
    id: "LOG-002",
    timestamp: "Jan 22, 2024 14:25:12",
    user: "System",
    userType: "system",
    action: "AUTO_BLOCK",
    resource: "User USR-9988 (Fraud detected)",
    status: "success",
  },
  {
    id: "LOG-003",
    timestamp: "Jan 22, 2024 14:18:45",
    user: "Admin",
    userType: "admin",
    action: "UPDATE_THRESHOLDS",
    resource: "Changed 'Auto-Block' to 85",
    status: "warning",
  },
  {
    id: "LOG-004",
    timestamp: "Jan 22, 2024 14:12:33",
    user: "Unknown",
    userType: "unknown",
    action: "LOGIN_ATTEMPT",
    resource: "IP 192.168.1.55",
    status: "failed",
  },
  {
    id: "LOG-005",
    timestamp: "Jan 22, 2024 13:55:20",
    user: "Sofia Martinez",
    userType: "user",
    action: "EXPORT_REPORT",
    resource: "Monthly_Fraud_Report.pdf",
    status: "success",
  },
]

const auditStatusConfig = {
  success: {
    icon: CheckCircle,
    label: "Success",
    className: "bg-success/10 text-success border-success/20",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    className: "bg-danger/10 text-danger border-danger/20",
  },
  warning: {
    icon: AlertTriangle,
    label: "Warning",
    className: "bg-warning/10 text-warning border-warning/20",
  },
}

const getUserIcon = (userType: AuditLog["userType"]) => {
  switch (userType) {
    case "system":
      return Bot
    case "admin":
      return ShieldAlert
    case "unknown":
      return AlertTriangle
    default:
      return User
  }
}

const getUserInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function SettingsPage() {
  // Notification email state
  const [notificationEmail, setNotificationEmail] = useState("alerts@company.com")
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [emailInputValue, setEmailInputValue] = useState("")

  // API Keys state - using Set for visible keys and Map for copied status
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: "prod-1",
      name: "Production API Key",
      key: "prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      status: "active",
      createdAt: "Jan 15, 2024",
      lastUsed: "2 minutes ago",
    },
    {
      id: "test-1",
      name: "Test API Key",
      key: "test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      status: "test",
      createdAt: "Jan 10, 2024",
      lastUsed: "1 hour ago",
    },
  ])

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([
    {
      id: "wh-1",
      url: "https://api.yourcompany.com/webhooks/fraud",
      events: ["fraud.detected", "alert.created", "transaction.blocked"],
      status: "active",
      lastTriggered: "2 minutes ago",
    },
    {
      id: "wh-2",
      url: "https://slack.yourcompany.com/webhooks/alerts",
      events: ["fraud.detected"],
      status: "active",
      lastTriggered: "15 minutes ago",
    },
    {
      id: "wh-3",
      url: "https://backup.yourcompany.com/fraud-alerts",
      events: ["fraud.detected", "alert.created"],
      status: "inactive",
      lastTriggered: "3 days ago",
    },
  ])
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null)
  const [editingWebhookUrl, setEditingWebhookUrl] = useState("")

  // Audit Logs state
  const [auditSearchQuery, setAuditSearchQuery] = useState("")
  const [auditDateRange, setAuditDateRange] = useState("all")

  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(auditSearchQuery.toLowerCase())
    return matchesSearch
  })

  const [riskThresholds, setRiskThresholds] = useState({
    autoApprove: 30,
    reviewRequired: 70,
  })

  // Country-Based Rules state
  const [highRiskCountries, setHighRiskCountries] = useState<string[]>([
    "Nigeria",
    "Russia",
    "Ukraine",
    "Indonesia",
  ])
  const [blockedCountries, setBlockedCountries] = useState<string[]>([
    "North Korea",
    "Iran",
    "Cuba",
  ])
  const [addingHighRisk, setAddingHighRisk] = useState(false)
  const [addingBlocked, setAddingBlocked] = useState(false)
  const [newCountryInput, setNewCountryInput] = useState("")

  // Add country to a list
  const addCountry = (
    list: "highRisk" | "blocked",
    country: string
  ) => {
    const trimmedCountry = country.trim()
    if (!trimmedCountry) return

    if (list === "highRisk") {
      if (!highRiskCountries.includes(trimmedCountry)) {
        setHighRiskCountries([...highRiskCountries, trimmedCountry])
      }
      setAddingHighRisk(false)
    } else {
      if (!blockedCountries.includes(trimmedCountry)) {
        setBlockedCountries([...blockedCountries, trimmedCountry])
      }
      setAddingBlocked(false)
    }
    setNewCountryInput("")
  }

  // Remove country from a list
  const removeCountry = (list: "highRisk" | "blocked", country: string) => {
    if (list === "highRisk") {
      setHighRiskCountries(highRiskCountries.filter((c) => c !== country))
    } else {
      setBlockedCountries(blockedCountries.filter((c) => c !== country))
    }
  }

  // Handle key press in input
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    list: "highRisk" | "blocked"
  ) => {
    if (e.key === "Enter") {
      addCountry(list, newCountryInput)
    } else if (e.key === "Escape") {
      setNewCountryInput("")
      if (list === "highRisk") {
        setAddingHighRisk(false)
      } else {
        setAddingBlocked(false)
      }
    }
  }

  // Handle blur (cancel adding)
  const handleBlur = (list: "highRisk" | "blocked") => {
    setNewCountryInput("")
    if (list === "highRisk") {
      setAddingHighRisk(false)
    } else {
      setAddingBlocked(false)
    }
  }

  // Email update handlers
  const handleEditEmail = () => {
    setEmailInputValue(notificationEmail)
    setIsEditingEmail(true)
  }

  const handleSaveEmail = () => {
    setNotificationEmail(emailInputValue)
    setIsEditingEmail(false)
  }

  // API Key handlers
  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  const copyApiKey = (keyId: string, keyValue: string) => {
    navigator.clipboard.writeText(keyValue)
    setCopiedKeyId(keyId)
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  const generateNewKey = () => {
    const newKeyId = `dev-${Date.now()}`
    const newKey: ApiKey = {
      id: newKeyId,
      name: `Dev Key ${apiKeys.length}`,
      key: `dev_${Math.random().toString(36).substring(2, 34)}`,
      status: "test",
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      lastUsed: "Never",
    }
    setApiKeys([...apiKeys, newKey])
  }

  // Webhook handlers
  const addWebhook = () => {
    const newWebhook: WebhookEndpoint = {
      id: `wh-${Date.now()}`,
      url: "https://new-endpoint.com/webhook",
      events: ["fraud.detected"],
      status: "active",
      lastTriggered: "Never",
    }
    setWebhooks([...webhooks, newWebhook])
  }

  const deleteWebhook = (webhookId: string) => {
    setWebhooks(webhooks.filter((wh) => wh.id !== webhookId))
  }

  const startEditingWebhook = (webhook: WebhookEndpoint) => {
    setEditingWebhookId(webhook.id)
    setEditingWebhookUrl(webhook.url)
  }

  const saveWebhookEdit = (webhookId: string) => {
    setWebhooks(
      webhooks.map((wh) =>
        wh.id === webhookId ? { ...wh, url: editingWebhookUrl } : wh
      )
    )
    setEditingWebhookId(null)
    setEditingWebhookUrl("")
  }

  return (
    <DashboardLayout
      title="Settings"
      description="Configure fraud detection rules and preferences"
    >
      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="rules" className="gap-2">
            <Sliders className="h-4 w-4" />
            Detection Rules
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <FileText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        {/* Detection Rules */}
        <TabsContent value="rules">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Risk Thresholds */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Shield className="h-5 w-5 text-primary" />
                  Risk Score Thresholds
                </CardTitle>
                <CardDescription>
                  Configure automatic decision thresholds based on AI risk scores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-card-foreground">Auto-Approve Threshold</Label>
                      <Badge className="bg-success/10 text-success border-success/20">
                        Score: 0-{riskThresholds.autoApprove}
                      </Badge>
                    </div>
                    <Slider
                      value={[riskThresholds.autoApprove]}
                      onValueChange={([value]) =>
                        setRiskThresholds((prev) => ({ ...prev, autoApprove: value }))
                      }
                      max={100}
                      step={5}
                      className="py-4"
                    />
                    <p className="text-xs text-muted-foreground">
                      Transactions below this score will be automatically approved
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-card-foreground">Review Required Threshold</Label>
                      <Badge className="bg-warning/10 text-warning border-warning/20">
                        Score: {riskThresholds.autoApprove + 1}-{riskThresholds.reviewRequired}
                      </Badge>
                    </div>
                    <Slider
                      value={[riskThresholds.reviewRequired]}
                      onValueChange={([value]) =>
                        setRiskThresholds((prev) => ({
                          ...prev,
                          reviewRequired: Math.max(value, prev.autoApprove + 10),
                        }))
                      }
                      min={riskThresholds.autoApprove + 10}
                      max={100}
                      step={5}
                      className="py-4"
                    />
                    <p className="text-xs text-muted-foreground">
                      Transactions in this range will require manual review
                    </p>
                  </div>

                  <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-danger" />
                      <span className="font-medium text-card-foreground">Auto-Block Zone</span>
                      <Badge className="bg-danger/10 text-danger border-danger/20">
                        Score: {riskThresholds.reviewRequired + 1}-100
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Transactions above {riskThresholds.reviewRequired} will be automatically blocked
                    </p>
                  </div>
                </div>

                <Button className="w-full">Save Thresholds</Button>
              </CardContent>
            </Card>

            {/* Detection Features */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">Detection Features</CardTitle>
                <CardDescription>Enable or disable specific fraud detection checks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    id: "velocity",
                    label: "Velocity Checks",
                    description: "Monitor transaction frequency patterns",
                    enabled: true,
                  },
                  {
                    id: "geo",
                    label: "Geographic Analysis",
                    description: "Detect impossible travel and location anomalies",
                    enabled: true,
                  },
                  {
                    id: "device",
                    label: "Device Fingerprinting",
                    description: "Track and verify device identities",
                    enabled: true,
                  },
                  {
                    id: "behavior",
                    label: "Behavioral Analysis",
                    description: "Analyze user spending patterns",
                    enabled: true,
                  },
                  {
                    id: "merchant",
                    label: "Merchant Risk Scoring",
                    description: "Assess merchant reputation and risk",
                    enabled: false,
                  },
                  {
                    id: "network",
                    label: "Network Analysis",
                    description: "Detect coordinated fraud rings",
                    enabled: false,
                  },
                  {
                    id: "partner_intelligence",
                    label: "Partner Intelligence Network",
                    description: "Share and receive anonymized fraud signals from authorized financial partners to block known threats.",
                    enabled: false,
                  },
                ].map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
                  >
                    <div className="space-y-0.5">
                      <Label htmlFor={feature.id} className="text-card-foreground">
                        {feature.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                    <Switch id={feature.id} defaultChecked={feature.enabled} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Country Rules */}
            <Card className="border-border bg-card lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Globe className="h-5 w-5 text-primary" />
                  Country-Based Rules
                </CardTitle>
                <CardDescription>
                  Configure risk modifiers and blocking rules by country
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* High-Risk Countries */}
                  <div className="space-y-3">
                    <Label className="text-card-foreground">High-Risk Countries (Auto-Review)</Label>
                    <div className="flex flex-wrap gap-2">
                      {highRiskCountries.map((country) => (
                        <Badge
                          key={country}
                          className="bg-warning/10 text-warning border-warning/20 gap-1"
                        >
                          {country}
                          <button
                            className="ml-1 hover:text-warning-foreground"
                            onClick={() => removeCountry("highRisk", country)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {addingHighRisk ? (
                        <Input
                          type="text"
                          value={newCountryInput}
                          onChange={(e) => setNewCountryInput(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, "highRisk")}
                          onBlur={() => handleBlur("highRisk")}
                          placeholder="Country name..."
                          className="h-6 w-32 text-sm bg-secondary"
                          autoFocus
                        />
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 bg-transparent"
                          onClick={() => setAddingHighRisk(true)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Blocked Countries */}
                  <div className="space-y-3">
                    <Label className="text-card-foreground">Blocked Countries</Label>
                    <div className="flex flex-wrap gap-2">
                      {blockedCountries.map((country) => (
                        <Badge
                          key={country}
                          className="bg-danger/10 text-danger border-danger/20 gap-1"
                        >
                          {country}
                          <button
                            className="ml-1 hover:text-danger-foreground"
                            onClick={() => removeCountry("blocked", country)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {addingBlocked ? (
                        <Input
                          type="text"
                          value={newCountryInput}
                          onChange={(e) => setNewCountryInput(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, "blocked")}
                          onBlur={() => handleBlur("blocked")}
                          placeholder="Country name..."
                          className="h-6 w-32 text-sm bg-secondary"
                          autoFocus
                        />
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 bg-transparent"
                          onClick={() => setAddingBlocked(true)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Bell className="h-5 w-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive fraud alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-card-foreground">Alert Channels</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      id: "email",
                      label: "Email Notifications",
                      description: "Receive alerts via email",
                      icon: Mail,
                      enabled: true,
                    },
                    {
                      id: "webhook",
                      label: "Webhook Alerts",
                      description: "Push alerts to your systems",
                      icon: Webhook,
                      enabled: true,
                    },
                    {
                      id: "sms",
                      label: "SMS Alerts",
                      description: "Critical alerts via SMS",
                      icon: Bell,
                      enabled: false,
                    },
                  ].map((channel) => (
                    <div
                      key={channel.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <channel.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <Label htmlFor={channel.id} className="text-card-foreground">
                            {channel.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">{channel.description}</p>
                        </div>
                      </div>
                      <Switch id={channel.id} defaultChecked={channel.enabled} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-card-foreground">Alert Triggers</h3>
                <div className="space-y-3">
                  {[
                    { id: "high", label: "High-Risk Alerts (Score > 80)", defaultChecked: true },
                    { id: "medium", label: "Medium-Risk Alerts (Score 50-80)", defaultChecked: true },
                    { id: "blocked", label: "Blocked Transactions", defaultChecked: true },
                    { id: "volume", label: "Unusual Volume Spikes", defaultChecked: false },
                    { id: "model", label: "Model Performance Degradation", defaultChecked: true },
                  ].map((trigger) => (
                    <div
                      key={trigger.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <Label htmlFor={trigger.id} className="text-card-foreground">
                        {trigger.label}
                      </Label>
                      <Switch id={trigger.id} defaultChecked={trigger.defaultChecked} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-card-foreground">
                  Notification Email
                </Label>
                <div className="flex gap-3">
                  {isEditingEmail ? (
                    <>
                      <Input
                        id="email"
                        type="email"
                        value={emailInputValue}
                        onChange={(e) => setEmailInputValue(e.target.value)}
                        className="bg-secondary"
                        autoFocus
                      />
                      <Button onClick={handleSaveEmail}>Save</Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 rounded-md border border-border bg-secondary px-3 py-2 text-card-foreground">
                        {notificationEmail}
                      </div>
                      <Button onClick={handleEditEmail}>Update</Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Key className="h-5 w-5 text-primary" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage your API keys for integrating with the fraud detection API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-card-foreground">{apiKey.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {apiKey.status === "active"
                          ? "Use this key for production transactions"
                          : "Use this key for testing and development"}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        apiKey.status === "active"
                          ? "bg-success/10 text-success border-success/20"
                          : "bg-info/10 text-info border-info/20"
                      )}
                    >
                      {apiKey.status === "active" ? "Active" : "Test Mode"}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Input
                      type={visibleKeys.has(apiKey.id) ? "text" : "password"}
                      value={apiKey.key}
                      readOnly
                      className="bg-background font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyApiKey(apiKey.id, apiKey.key)}
                    >
                      {copiedKeyId === apiKey.id ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Created: {apiKey.createdAt} | Last used: {apiKey.lastUsed}
                  </p>
                </div>
              ))}

              <div className="flex gap-3">
                <Button variant="outline" onClick={generateNewKey}>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate New Key
                </Button>
                <Button variant="outline" className="text-danger hover:bg-danger/10 bg-transparent">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Revoke All Keys
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-card-foreground">
                    <Webhook className="h-5 w-5 text-primary" />
                    Webhook Endpoints
                  </CardTitle>
                  <CardDescription>
                    Configure webhook endpoints for real-time fraud alerts
                  </CardDescription>
                </div>
                <Button onClick={addWebhook}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Endpoint
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="rounded-lg border border-border bg-secondary/30 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1 mr-4">
                      <div className="flex items-center gap-2">
                        {editingWebhookId === webhook.id ? (
                          <Input
                            type="url"
                            value={editingWebhookUrl}
                            onChange={(e) => setEditingWebhookUrl(e.target.value)}
                            className="bg-background font-mono text-sm"
                            autoFocus
                          />
                        ) : (
                          <code className="flex items-center gap-1.5 rounded bg-background px-2 py-1 text-sm text-card-foreground">
                            <Lock
                              className="h-4 w-4 text-emerald-500 flex-shrink-0"
                              title="TLS 1.3 Encrypted Connection"
                            />
                            {webhook.url}
                          </code>
                        )}
                        <Badge
                          className={cn(
                            "border",
                            webhook.status === "active"
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-muted text-muted-foreground border-border"
                          )}
                        >
                          {webhook.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last triggered: {webhook.lastTriggered}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {editingWebhookId === webhook.id ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => saveWebhookEdit(webhook.id)}
                        >
                          Save
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditingWebhook(webhook)}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-danger hover:bg-danger/10 bg-transparent"
                        onClick={() => deleteWebhook(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {webhooks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No webhook endpoints configured. Click "Add Endpoint" to create one.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs */}
        <TabsContent value="audit">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Audit Logs
              </CardTitle>
              <CardDescription>
                Track all sensitive actions for RGPD/DPIA compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    className="bg-secondary pl-9"
                  />
                </div>
                <Select value={auditDateRange} onValueChange={setAuditDateRange}>
                  <SelectTrigger className="w-[180px] bg-secondary">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="quarter">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Audit Logs Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                        Timestamp
                      </th>
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                        User / Actor
                      </th>
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                        Action
                      </th>
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                        Resource / Details
                      </th>
                      <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditLogs.map((log) => {
                      const StatusIcon = auditStatusConfig[log.status].icon
                      const UserIcon = getUserIcon(log.userType)
                      return (
                        <tr
                          key={log.id}
                          className="border-b border-border transition-colors hover:bg-secondary/30"
                        >
                          <td className="py-4">
                            <p className="text-sm text-card-foreground font-mono">
                              {log.timestamp}
                            </p>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback
                                  className={cn(
                                    "text-xs",
                                    log.userType === "system"
                                      ? "bg-info/20 text-info"
                                      : log.userType === "admin"
                                      ? "bg-primary/20 text-primary"
                                      : log.userType === "unknown"
                                      ? "bg-danger/20 text-danger"
                                      : "bg-secondary text-card-foreground"
                                  )}
                                >
                                  {log.userType === "user" ? (
                                    getUserInitials(log.user)
                                  ) : (
                                    <UserIcon className="h-4 w-4" />
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-card-foreground font-medium">
                                {log.user}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {log.action}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <p className="text-sm text-muted-foreground">
                              {log.resource}
                            </p>
                          </td>
                          <td className="py-4">
                            <Badge
                              className={cn(
                                "border",
                                auditStatusConfig[log.status].className
                              )}
                            >
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {auditStatusConfig[log.status].label}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {filteredAuditLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No audit logs found matching your search criteria.
                </div>
              )}

              {/* Footer info */}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredAuditLogs.length} of {auditLogs.length} logs
                </p>
                <p className="text-xs text-muted-foreground">
                  Logs are retained for 90 days per RGPD compliance policy
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

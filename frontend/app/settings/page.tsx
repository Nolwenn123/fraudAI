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
} from "lucide-react"

export default function SettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [riskThresholds, setRiskThresholds] = useState({
    autoApprove: 30,
    reviewRequired: 70,
  })

  const apiKey = "your-api-key-here"

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
                  <div className="space-y-3">
                    <Label className="text-card-foreground">High-Risk Countries (Auto-Review)</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Nigeria", "Russia", "Ukraine", "Indonesia"].map((country) => (
                        <Badge
                          key={country}
                          className="bg-warning/10 text-warning border-warning/20 gap-1"
                        >
                          {country}
                          <button className="ml-1 hover:text-warning-foreground">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <Button variant="outline" size="sm" className="h-6 bg-transparent">
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-card-foreground">Blocked Countries</Label>
                    <div className="flex flex-wrap gap-2">
                      {["North Korea", "Iran", "Cuba"].map((country) => (
                        <Badge
                          key={country}
                          className="bg-danger/10 text-danger border-danger/20 gap-1"
                        >
                          {country}
                          <button className="ml-1 hover:text-danger-foreground">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <Button variant="outline" size="sm" className="h-6 bg-transparent">
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
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
                <div className="grid gap-4 md:grid-cols-2">
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
                      id: "slack",
                      label: "Slack Integration",
                      description: "Post alerts to Slack channels",
                      icon: Bell,
                      enabled: false,
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
                  <Input
                    id="email"
                    type="email"
                    defaultValue="alerts@company.com"
                    className="bg-secondary"
                  />
                  <Button>Update</Button>
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
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-card-foreground">Production API Key</p>
                    <p className="text-sm text-muted-foreground">
                      Use this key for production transactions
                    </p>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    readOnly
                    className="bg-background font-mono"
                  />
                  <Button variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={copyApiKey}>
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Created: Jan 15, 2024 | Last used: 2 minutes ago
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-card-foreground">Test API Key</p>
                    <p className="text-sm text-muted-foreground">
                      Use this key for testing and development
                    </p>
                  </div>
                  <Badge className="bg-info/10 text-info border-info/20">Test Mode</Badge>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Input
                    type="password"
                    value="sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    readOnly
                    className="bg-background font-mono"
                  />
                  <Button variant="outline" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline">
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
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Endpoint
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  url: "https://api.yourcompany.com/webhooks/fraud",
                  events: ["fraud.detected", "alert.created", "transaction.blocked"],
                  status: "active",
                  lastTriggered: "2 minutes ago",
                },
                {
                  url: "https://slack.yourcompany.com/webhooks/alerts",
                  events: ["fraud.detected"],
                  status: "active",
                  lastTriggered: "15 minutes ago",
                },
                {
                  url: "https://backup.yourcompany.com/fraud-alerts",
                  events: ["fraud.detected", "alert.created"],
                  status: "inactive",
                  lastTriggered: "3 days ago",
                },
              ].map((webhook, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border bg-secondary/30 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-background px-2 py-1 text-sm text-card-foreground">
                          {webhook.url}
                        </code>
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
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-danger hover:bg-danger/10 bg-transparent">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}

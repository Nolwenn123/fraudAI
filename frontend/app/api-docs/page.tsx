"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  Code,
  Copy,
  Check,
  Play,
  FileJson,
  Shield,
  Zap,
  Globe,
  Key,
  ChevronRight,
} from "lucide-react"

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/transactions/analyze",
    description: "Submit a transaction for real-time fraud analysis",
    category: "Fraud Detection",
  },
  {
    method: "GET",
    path: "/api/v1/transactions/:id",
    description: "Retrieve transaction details and fraud analysis results",
    category: "Transactions",
  },
  {
    method: "POST",
    path: "/api/v1/transactions/batch",
    description: "Submit multiple transactions for batch analysis",
    category: "Fraud Detection",
  },
  {
    method: "GET",
    path: "/api/v1/alerts",
    description: "List all fraud alerts with optional filters",
    category: "Alerts",
  },
  {
    method: "PUT",
    path: "/api/v1/alerts/:id/resolve",
    description: "Mark an alert as resolved with resolution details",
    category: "Alerts",
  },
  {
    method: "POST",
    path: "/api/v1/feedback",
    description: "Submit feedback to improve AI model accuracy",
    category: "Feedback Loop",
  },
  {
    method: "GET",
    path: "/api/v1/analytics/summary",
    description: "Get fraud detection performance metrics",
    category: "Analytics",
  },
  {
    method: "GET",
    path: "/api/v1/webhooks",
    description: "List all configured webhook endpoints",
    category: "Webhooks",
  },
  {
    method: "POST",
    path: "/api/v1/webhooks",
    description: "Register a new webhook for fraud alerts",
    category: "Webhooks",
  },
]

const requestExample = `{
  "transaction_id": "txn_1234567890",
  "amount": 1250.00,
  "currency": "USD",
  "merchant": {
    "id": "merchant_abc123",
    "name": "Electronics Store",
    "category": "5732",
    "country": "US"
  },
  "card": {
    "last_four": "4521",
    "brand": "visa",
    "country": "US"
  },
  "customer": {
    "id": "cust_xyz789",
    "email": "john@example.com",
    "ip_address": "192.168.1.1",
    "device_fingerprint": "fp_abc123"
  },
  "metadata": {
    "channel": "mobile_app",
    "session_id": "sess_123"
  }
}`

const responseExample = `{
  "transaction_id": "txn_1234567890",
  "risk_score": 78,
  "decision": "review",
  "processing_time_ms": 124,
  "risk_factors": [
    {
      "code": "UNUSUAL_AMOUNT",
      "description": "Transaction amount significantly higher than user average",
      "impact": "high"
    },
    {
      "code": "NEW_DEVICE",
      "description": "Transaction from previously unseen device",
      "impact": "medium"
    },
    {
      "code": "VELOCITY_CHECK",
      "description": "Multiple transactions in short time window",
      "impact": "medium"
    }
  ],
  "recommendation": {
    "action": "request_verification",
    "reason": "Additional user verification recommended"
  },
  "model_version": "v2.4.1"
}`

const codeExamples = {
  curl: `curl -X POST https://api.fraudshield.io/v1/transactions/analyze \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "transaction_id": "txn_1234567890",
    "amount": 1250.00,
    "currency": "USD",
    "merchant": {
      "id": "merchant_abc123",
      "name": "Electronics Store"
    },
    "card": {
      "last_four": "4521"
    }
  }'`,
  javascript: `const response = await fetch(
  'https://api.fraudshield.io/v1/transactions/analyze',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transaction_id: 'txn_1234567890',
      amount: 1250.00,
      currency: 'USD',
      merchant: {
        id: 'merchant_abc123',
        name: 'Electronics Store',
      },
      card: {
        last_four: '4521',
      },
    }),
  }
);

const result = await response.json();
console.log(result.risk_score, result.decision);`,
  python: `import requests

response = requests.post(
    'https://api.fraudshield.io/v1/transactions/analyze',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'transaction_id': 'txn_1234567890',
        'amount': 1250.00,
        'currency': 'USD',
        'merchant': {
            'id': 'merchant_abc123',
            'name': 'Electronics Store',
        },
        'card': {
            'last_four': '4521',
        },
    }
)

result = response.json()
print(result['risk_score'], result['decision'])`,
}

const methodColors = {
  GET: "bg-success/10 text-success border-success/20",
  POST: "bg-info/10 text-info border-info/20",
  PUT: "bg-warning/10 text-warning border-warning/20",
  DELETE: "bg-danger/10 text-danger border-danger/20",
}

export default function ApiDocsPage() {
  const [copiedRequest, setCopiedRequest] = useState(false)
  const [copiedResponse, setCopiedResponse] = useState(false)
  const [selectedLang, setSelectedLang] = useState<keyof typeof codeExamples>("curl")

  const copyToClipboard = (text: string, type: "request" | "response") => {
    navigator.clipboard.writeText(text)
    if (type === "request") {
      setCopiedRequest(true)
      setTimeout(() => setCopiedRequest(false), 2000)
    } else {
      setCopiedResponse(true)
      setTimeout(() => setCopiedResponse(false), 2000)
    }
  }

  return (
    <DashboardLayout
      title="API Documentation"
      description="Integrate fraud detection into your payment system"
    >
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{"<"}300ms</p>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-success/10 p-3">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">99.99%</p>
                <p className="text-sm text-muted-foreground">Uptime SLA</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-info/10 p-3">
                <Globe className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">REST</p>
                <p className="text-sm text-muted-foreground">API Protocol</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-warning/10 p-3">
                <Key className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">OAuth 2.0</p>
                <p className="text-sm text-muted-foreground">Authentication</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {/* Endpoints List */}
        <Card className="border-border bg-card xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-card-foreground">API Endpoints</CardTitle>
            <CardDescription>Available API endpoints for integration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {endpoints.map((endpoint) => (
                <button
                  key={endpoint.path}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 text-left transition-colors hover:bg-secondary/50"
                >
                  <Badge
                    className={cn(
                      "border font-mono text-xs",
                      methodColors[endpoint.method as keyof typeof methodColors]
                    )}
                  >
                    {endpoint.method}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-mono text-sm text-card-foreground">
                      {endpoint.path}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {endpoint.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card className="border-border bg-card xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Code className="h-5 w-5 text-primary" />
                  Analyze Transaction
                </CardTitle>
                <CardDescription>
                  POST /api/v1/transactions/analyze
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Play className="mr-2 h-4 w-4" />
                Try it
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="request">
              <TabsList className="bg-secondary">
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
                <TabsTrigger value="code">Code Examples</TabsTrigger>
              </TabsList>

              <TabsContent value="request" className="mt-4">
                <div className="relative rounded-lg border border-border bg-background">
                  <div className="flex items-center justify-between border-b border-border px-4 py-2">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileJson className="h-4 w-4" />
                      Request Body (JSON)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(requestExample, "request")}
                    >
                      {copiedRequest ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="overflow-x-auto p-4 text-sm">
                    <code className="text-muted-foreground">{requestExample}</code>
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="response" className="mt-4">
                <div className="relative rounded-lg border border-border bg-background">
                  <div className="flex items-center justify-between border-b border-border px-4 py-2">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileJson className="h-4 w-4" />
                      Response (JSON)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(responseExample, "response")}
                    >
                      {copiedResponse ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="overflow-x-auto p-4 text-sm">
                    <code className="text-muted-foreground">{responseExample}</code>
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="code" className="mt-4">
                <div className="mb-4 flex gap-2">
                  {(Object.keys(codeExamples) as Array<keyof typeof codeExamples>).map((lang) => (
                    <Button
                      key={lang}
                      variant={selectedLang === lang ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedLang(lang)}
                    >
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </Button>
                  ))}
                </div>
                <div className="relative rounded-lg border border-border bg-background">
                  <div className="flex items-center justify-between border-b border-border px-4 py-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedLang.toUpperCase()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(codeExamples[selectedLang], "request")}
                    >
                      {copiedRequest ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="overflow-x-auto p-4 text-sm">
                    <code className="text-muted-foreground">{codeExamples[selectedLang]}</code>
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Response Codes */}
      <Card className="mt-6 border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Response Codes</CardTitle>
          <CardDescription>Standard HTTP response codes used by the API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { code: "200", label: "OK", description: "Request successful", color: "success" },
              { code: "201", label: "Created", description: "Resource created", color: "success" },
              { code: "400", label: "Bad Request", description: "Invalid request format", color: "warning" },
              { code: "401", label: "Unauthorized", description: "Missing or invalid API key", color: "danger" },
              { code: "403", label: "Forbidden", description: "Insufficient permissions", color: "danger" },
              { code: "404", label: "Not Found", description: "Resource not found", color: "warning" },
              { code: "429", label: "Rate Limited", description: "Too many requests", color: "warning" },
              { code: "500", label: "Server Error", description: "Internal server error", color: "danger" },
            ].map((item) => (
              <div
                key={item.code}
                className="rounded-lg border border-border bg-secondary/30 p-4"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      "border font-mono",
                      item.color === "success" && "bg-success/10 text-success border-success/20",
                      item.color === "warning" && "bg-warning/10 text-warning border-warning/20",
                      item.color === "danger" && "bg-danger/10 text-danger border-danger/20"
                    )}
                  >
                    {item.code}
                  </Badge>
                  <span className="font-medium text-card-foreground">{item.label}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}

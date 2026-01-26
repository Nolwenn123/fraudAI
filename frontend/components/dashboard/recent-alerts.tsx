"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ChevronRight, Clock, CreditCard, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

const alerts = [
  {
    id: "ALT-001",
    type: "high",
    title: "Unusual Transaction Pattern",
    description: "Multiple high-value transactions detected from new device",
    amount: "$12,450.00",
    location: "Lagos, Nigeria",
    time: "2 min ago",
    score: 92,
  },
  {
    id: "ALT-002",
    type: "high",
    title: "Velocity Check Failed",
    description: "15 transactions in 5 minutes exceeds threshold",
    amount: "$3,200.00",
    location: "Unknown VPN",
    time: "8 min ago",
    score: 88,
  },
  {
    id: "ALT-003",
    type: "medium",
    title: "Geographic Anomaly",
    description: "Transaction location inconsistent with user profile",
    amount: "$890.00",
    location: "Moscow, Russia",
    time: "15 min ago",
    score: 67,
  },
  {
    id: "ALT-004",
    type: "medium",
    title: "First-time Merchant",
    description: "Large purchase at previously unknown merchant",
    amount: "$2,150.00",
    location: "Hong Kong",
    time: "32 min ago",
    score: 58,
  },
  {
    id: "ALT-005",
    type: "low",
    title: "Unusual Transaction Time",
    description: "Transaction outside normal user activity hours",
    amount: "$450.00",
    location: "Paris, France",
    time: "45 min ago",
    score: 34,
  },
]

const typeStyles = {
  high: "bg-danger/10 text-danger border-danger/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-info/10 text-info border-info/20",
}

const typeLabels = {
  high: "High Risk",
  medium: "Medium Risk",
  low: "Low Risk",
}

export function RecentAlerts() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-card-foreground">Recent Alerts</CardTitle>
          <CardDescription>
            Latest fraud alerts requiring attention
          </CardDescription>
        </div>
        <Button variant="outline" size="sm">
          View All
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-4 rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
            >
              <div className={cn("rounded-lg p-2", typeStyles[alert.type as keyof typeof typeStyles])}>
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-card-foreground">{alert.title}</p>
                  <Badge className={cn("border", typeStyles[alert.type as keyof typeof typeStyles])}>
                    Score: {alert.score}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{alert.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                    {alert.time}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {typeLabels[alert.type as keyof typeof typeLabels]}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

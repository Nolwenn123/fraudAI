"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Mail, Shield, Calendar, Building } from "lucide-react"

export default function ProfilePage() {
  return (
    <DashboardLayout
      title="Profile"
      description="View and manage your account information"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info Card */}
        <Card className="border-border bg-card md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <User className="h-5 w-5 text-primary" />
              User Information
            </CardTitle>
            <CardDescription>
              Your personal account details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
                  JD
                </div>
                <Button variant="outline" size="sm">
                  Change Avatar
                </Button>
              </div>

              {/* Details */}
              <div className="flex-1 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium text-card-foreground">John Doe</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-card-foreground">john.doe@company.com</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Role</p>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-card-foreground">Risk Analyst</p>
                      <Badge className="bg-primary/10 text-primary border-primary/20">Admin</Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Department</p>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-card-foreground">Fraud Prevention</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-card-foreground">January 15, 2024</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Account Actions</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Edit Profile Information
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Two-Factor Authentication
            </Button>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Activity Summary</CardTitle>
            <CardDescription>Your recent activity overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                <span className="text-sm text-muted-foreground">Transactions Reviewed</span>
                <span className="font-semibold text-card-foreground">1,247</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                <span className="text-sm text-muted-foreground">Alerts Resolved</span>
                <span className="font-semibold text-card-foreground">89</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                <span className="text-sm text-muted-foreground">Last Login</span>
                <span className="font-semibold text-card-foreground">Today, 9:30 AM</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

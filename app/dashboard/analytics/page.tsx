"use client"

import { useState, useEffect, useCallback } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { IconTrendingUp, IconUsers, IconClock, IconCalendar, IconMicrophone, IconVideo, IconLoader2 } from "@tabler/icons-react"
import { useApiWithAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface StatsData {
  meetings: {
    total: number
    completed: number
    pending: number
    processing: number
    failed: number
  }
  totalMinutes: number
  totalHours: number
  tasks: {
    todo: number
    'in-progress': number
    done: number
  }
  totalTasks: number
}

export default function AnalyticsPage() {
  const { api, isReady } = useApiWithAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [trends, setTrends] = useState<any[]>([])
  const [platforms, setPlatforms] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!isReady) return
    
    try {
      setIsLoading(true)
      
      const [statsRes, trendsRes, platformsRes, activityRes] = await Promise.all([
        api.getStats(),
        api.getTrends('30d'),
        api.getPlatformStats(),
        api.getRecentActivity(10)
      ])
      
      setStats((statsRes as any).data)
      setTrends((trendsRes as any).data || [])
      setPlatforms((platformsRes as any).data || [])
      setRecentActivity((activityRes as any).data || [])
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast.error("Gagal memuat data analytics")
    } finally {
      setIsLoading(false)
    }
  }, [isReady, api])

  useEffect(() => {
    if (isReady) {
      fetchAnalytics()
    }
  }, [isReady, fetchAnalytics])

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  // Fallback to demo data if no real data
  const analyticsData = stats ? {
    totalMeetings: stats.meetings.total,
    totalDuration: formatDuration(stats.totalMinutes),
    completedMeetings: stats.meetings.completed,
    pendingMeetings: stats.meetings.pending + stats.meetings.processing,
    totalTasks: stats.totalTasks,
    completedTasks: stats.tasks.done,
    completionRate: stats.meetings.total > 0 
      ? Math.round((stats.meetings.completed / stats.meetings.total) * 100) 
      : 0,
    satisfactionScore: 4.2,
  } : {
    totalMeetings: 0,
    totalDuration: "0h 0m",
    completedMeetings: 0,
    pendingMeetings: 0,
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
    satisfactionScore: 0,
  }

  const meetingTypes = platforms.length > 0 ? platforms.map((p: any) => ({
    type: p.platform || 'Unknown',
    count: p.count,
    percentage: p.percentage
  })) : [
    { type: "Google Meet", count: 45, percentage: 60 },
    { type: "Zoom", count: 20, percentage: 26.7 },
    { type: "Teams", count: 10, percentage: 13.3 }
  ]

  const topParticipants = [
    { name: "Ahmad Rizki", meetings: 12, duration: "5h 30m" },
    { name: "Sarah Johnson", meetings: 10, duration: "4h 45m" },
    { name: "Budi Santoso", meetings: 8, duration: "3h 20m" },
  ]

  if (isLoading) {
    return (
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <IconLoader2 className="h-12 w-12 animate-spin text-[#6b4eff]" />
              <p className="text-muted-foreground">Memuat analytics...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header */}
              <div className="px-4 lg:px-6">
                <div>
                  <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                  <p className="text-muted-foreground">Insights and metrics for your meetings</p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="px-4 lg:px-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
                      <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analyticsData.totalMeetings}</div>
                      <p className="text-xs text-muted-foreground">
                        {analyticsData.completedMeetings} completed
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
                      <IconClock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analyticsData.totalDuration}</div>
                      <p className="text-xs text-muted-foreground">
                        Across all meetings
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending</CardTitle>
                      <IconLoader2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analyticsData.pendingMeetings}</div>
                      <p className="text-xs text-muted-foreground">
                        In progress or waiting
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                      <IconMicrophone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analyticsData.totalTasks}</div>
                      <p className="text-xs text-muted-foreground">
                        {analyticsData.completedTasks} completed
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Charts */}
              <div className="px-4 lg:px-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Meeting Trends</CardTitle>
                      <CardDescription>Weekly meeting count and duration</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartAreaInteractive />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Meeting Types Distribution</CardTitle>
                      <CardDescription>Breakdown by meeting type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {meetingTypes.map((type, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                index === 0 ? 'bg-blue-500' :
                                index === 1 ? 'bg-green-500' :
                                index === 2 ? 'bg-yellow-500' :
                                index === 3 ? 'bg-purple-500' :
                                index === 4 ? 'bg-pink-500' : 'bg-gray-500'
                              }`} />
                              <span className="text-sm font-medium">{type.type}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{type.count}</span>
                              <span className="text-sm font-medium">{type.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="px-4 lg:px-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Participants</CardTitle>
                      <CardDescription>Most active meeting participants</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {topParticipants.map((participant, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                                {participant.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="font-medium">{participant.name}</p>
                                <p className="text-sm text-muted-foreground">{participant.meetings} meetings</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{participant.duration}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                      <CardDescription>Meeting effectiveness indicators</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Completion Rate</p>
                            <p className="text-sm text-muted-foreground">Meetings successfully processed</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">{analyticsData.completionRate}%</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Satisfaction Score</p>
                            <p className="text-sm text-muted-foreground">Average participant rating</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">{analyticsData.satisfactionScore}/5.0</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Recording Quality</p>
                            <p className="text-sm text-muted-foreground">Audio/video clarity</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-purple-600">92%</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

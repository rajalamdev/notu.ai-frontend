"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconClock, IconCheck, IconX, IconAlertCircle, IconRefresh, IconEye, IconLoader2 } from "@tabler/icons-react"
import { useApiWithAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface Meeting {
  _id: string
  title: string
  platform: string
  status: string
  duration?: number
  createdAt: string
  processingProgress?: number
  participants?: any[]
  summary?: string
  actionItems?: any[]
}

export default function StatusMeetingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const meetingIdFromUrl = searchParams.get('id')
  
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { api, isReady } = useApiWithAuth()

  const fetchMeetings = useCallback(async () => {
    if (!isReady) return
    
    try {
      const response = await api.getMeetings({ limit: 20 })
      setMeetings(response.meetings || [])
    } catch (error) {
      console.error("Error fetching meetings:", error)
      toast.error("Gagal memuat status meeting")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [isReady, api])

  // Initial fetch
  useEffect(() => {
    if (isReady) {
      fetchMeetings()
    } else {
      setIsLoading(false)
    }
  }, [isReady, fetchMeetings])

  // Polling for active meetings
  useEffect(() => {
    const hasActiveMeetings = meetings.some(m => 
      m.status === 'pending' || m.status === 'recording' || m.status === 'processing'
    )
    
    if (!hasActiveMeetings) return

    const interval = setInterval(() => {
      fetchMeetings()
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [meetings, fetchMeetings])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchMeetings()
  }

  const handleRetry = async (meetingId: string) => {
    try {
      await api.retryTranscription(meetingId)
      toast.success("Transkripsi ulang dimulai")
      fetchMeetings()
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Gagal memulai ulang transkripsi")
    }
  }

  const handleViewSummary = (meetingId: string) => {
    router.push(`/dashboard/meeting/${meetingId}`)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <IconCheck className="h-5 w-5 text-green-500" />
      case "recording":
      case "processing":
        return <IconLoader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case "pending":
        return <IconClock className="h-5 w-5 text-yellow-500" />
      case "cancelled":
        return <IconX className="h-5 w-5 text-gray-500" />
      case "failed":
        return <IconAlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <IconClock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "recording":
        return <Badge className="bg-blue-100 text-blue-800">Recording</Badge>
      case "processing":
        return <Badge className="bg-orange-100 text-orange-800">Processing</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}min`
    return `${minutes} min`
  }

  const statusCounts = {
    completed: meetings.filter(m => m.status === "completed").length,
    active: meetings.filter(m => m.status === "recording" || m.status === "processing").length,
    pending: meetings.filter(m => m.status === "pending").length,
    cancelled: meetings.filter(m => m.status === "cancelled").length,
    failed: meetings.filter(m => m.status === "failed").length
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
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Meeting Status</h1>
                    <p className="text-muted-foreground">Track and monitor your meeting progress</p>
                  </div>
                  <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                    <IconRefresh className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Status
                  </Button>
                </div>
              </div>

              {/* Status Overview */}
              <div className="px-4 lg:px-6">
                <div className="grid gap-4 md:grid-cols-5">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed</CardTitle>
                      <IconCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{statusCounts.completed}</div>
                      <p className="text-xs text-muted-foreground">Meetings finished</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active</CardTitle>
                      <IconLoader2 className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{statusCounts.active}</div>
                      <p className="text-xs text-muted-foreground">Recording/Processing</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending</CardTitle>
                      <IconClock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
                      <p className="text-xs text-muted-foreground">Waiting to start</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                      <IconX className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-600">{statusCounts.cancelled}</div>
                      <p className="text-xs text-muted-foreground">Cancelled meetings</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Failed</CardTitle>
                      <IconAlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{statusCounts.failed}</div>
                      <p className="text-xs text-muted-foreground">Technical issues</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Meeting List */}
              <div className="px-4 lg:px-6">
                <h2 className="text-lg font-semibold mb-4">All Meetings</h2>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <IconLoader2 className="h-8 w-8 animate-spin text-[#6b4eff]" />
                  </div>
                ) : meetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-lg font-medium text-gray-900">Belum ada meeting</p>
                    <p className="text-sm text-gray-500 mt-1">Mulai dengan membuat meeting baru</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {meetings.map((meeting) => (
                      <Card key={meeting._id} className={meetingIdFromUrl === meeting._id ? 'ring-2 ring-[#6b4eff]' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              {getStatusIcon(meeting.status)}
                              <div className="flex-1">
                                <h3 className="font-semibold">{meeting.title || 'Untitled Meeting'}</h3>
                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                  <span>{formatDate(meeting.createdAt)}</span>
                                  <span>{formatDuration(meeting.duration)}</span>
                                  <span>{meeting.platform || 'Google Meet'}</span>
                                  {meeting.actionItems && meeting.actionItems.length > 0 && (
                                    <span>{meeting.actionItems.length} action items</span>
                                  )}
                                </div>
                                {meeting.summary && (
                                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{meeting.summary}</p>
                                )}
                                {meeting.processingProgress !== undefined && meeting.status === 'processing' && (
                                  <div className="mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-[#6b4eff] h-2 rounded-full transition-all" 
                                        style={{ width: `${meeting.processingProgress}%` }}
                                      />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Processing: {meeting.processingProgress}%</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(meeting.status)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {meeting.status === "completed" && (
                                <Button size="sm" variant="outline" onClick={() => handleViewSummary(meeting._id)}>
                                  <IconEye className="h-4 w-4 mr-1" />
                                  View Summary
                                </Button>
                              )}
                              {meeting.status === "failed" && (
                                <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleRetry(meeting._id)}>
                                  <IconRefresh className="h-4 w-4 mr-1" />
                                  Retry
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

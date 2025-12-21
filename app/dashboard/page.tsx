"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import MeetingCard from "@/components/custom/MeetingCard"
import { IconCamera, IconMicrophone, IconFileUpload, IconChartBar, IconSearch, IconDotsVertical, IconChevronRight, IconChevronDown, IconList, IconGrid4x4, IconLoader2 } from "@tabler/icons-react"
import { OnlineMeetingDialog } from "@/components/dialogs/online-meeting-dialog"
import { RealtimeMeetingDialog } from "@/components/dialogs/realtime-meeting-dialog"
import { useAuth, useApiWithAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

const quickActions = [
  {
    title: "Take Notes From Online Meeting",
    description: "Using Online Bot For Google Meet",
    icon: IconCamera,
    color: "bg-[#6b4eff]/10",
  },
  {
    title: "Take Notes From Realtime Meeting",
    description: "Using Online Bot For Google Meet",
    icon: IconMicrophone,
    color: "bg-[#6b4eff]/10",
  },
  {
    title: "Take Notes From Upload File",
    description: "Using Online Bot For Google Meet",
    icon: IconFileUpload,
    color: "bg-[#6b4eff]/10",
  },
  {
    title: "Analytics Your Meeting",
    description: "Using Online Bot For Google Meet",
    icon: IconChartBar,
    color: "bg-[#6b4eff]/10",
  },
]

interface Meeting {
  _id: string
  title: string
  description?: string
  platform: string
  status: string
  duration?: number
  createdAt: string
  type?: string
}

export default function Page() {
  const [isOnlineMeetingOpen, setIsOnlineMeetingOpen] = useState(false)
  const [isRealtimeMeetingOpen, setIsRealtimeMeetingOpen] = useState(false)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { api, isReady } = useApiWithAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch meetings on mount
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setIsLoadingMeetings(true)
        const response = await api.getMeetings({ limit: 10 })
        setMeetings(response.meetings || [])
      } catch (error) {
        console.error("Error fetching meetings:", error)
        setMeetings([])
      } finally {
        setIsLoadingMeetings(false)
      }
    }

    // Only fetch when auth is done AND we have a token
    if (!authLoading) {
      if (isReady) {
        fetchMeetings()
      } else {
        // No token available, stop loading
        setIsLoadingMeetings(false)
      }
    }
  }, [isReady, authLoading])

  // Format meeting data for MeetingCard
  const formatMeetingForCard = (meeting: Meeting) => ({
    id: meeting._id,
    tag: "#My Meeting",
    platform: meeting.platform || "Google Meet",
    date: new Date(meeting.createdAt).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    title: meeting.title || "Untitled Meeting",
    description: meeting.description || "Meeting sedang diproses...",
    type: meeting.type || "online",
    status: meeting.status
  })

  // Filter meetings by search
  const filteredMeetings = meetings.filter(meeting => 
    meeting.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <div className="flex flex-col gap-6 py-6">
              {/* Top welcome */}
              <div className="px-4 lg:px-6">
                <h2 className="text-3xl font-bold text-[#2b1152]">Welcome Abroad, {user?.name?.split(' ')[0] || 'User'}</h2>
                <p className="text-sm text-muted-foreground">Notu Siap Untuk Menjadi Asisten Anda😊</p>
              </div>

              {/* Quick action cards */}
              <div className="px-4 lg:px-6">
                <h3 className="text-base font-medium text-[#2b1152] mb-4">Quick Action For Your Meeting</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
                  {quickActions.map((action, idx) => {
                    const handleClick = () => {
                      if (action.title === "Take Notes From Online Meeting") {
                        setIsOnlineMeetingOpen(true)
                      } else if (action.title === "Take Notes From Realtime Meeting") {
                        setIsRealtimeMeetingOpen(true)
                      } else if (action.title === "Take Notes From Upload File") {
                        router.push("/dashboard/uploads")
                      } else if (action.title === "Analytics Your Meeting") {
                        router.push("/dashboard/analytics")
                      }
                    }

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer group"
                        onClick={handleClick}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-4">
                            <div className={`rounded-lg ${action.color} p-2`}>
                              {<action.icon className="h-5 w-5 text-[#6b4eff]" />}
                            </div>
                            <div className="flex flex-col items-start text-left gap-1.5">
                              <h3 className="font-semibold text-[#2b1152]">{action.title}</h3>
                              <p className="text-sm text-muted-foreground">{action.description}</p>
                            </div>
                          </div>
                          <div>
                            <IconChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Meeting History Section */}
              <div className="px-4 lg:px-6">
                <h2 className="mb-2 text-xl font-bold text-gray-900">Meeting History</h2>
                <p className="mb-6 text-sm text-gray-600">Cari Meeting Anda Yang Telah Dibuat</p>

                {/* Search and Filter Bar */}
                <div className="mb-6 flex items-center gap-4">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input 
                      placeholder="Search Notes.." 
                      className="pl-10 pr-4"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" className="flex items-center gap-2 bg-background-2 border-border">
                    All Notes
                    <IconChevronDown className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 bg-background-2 border-border">
                    All Kind
                    <IconChevronDown className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 bg-background-2 border-border">
                    Today
                    <IconChevronDown className="h-4 w-4" />
                  </Button>
                  <div className="flex rounded-lg border border-gray-300 p-1">
                    <Button 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-[#6b4eff] text-white hover:bg-[#5a3ee6]"
                    >
                      <IconList className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
                    >
                      <IconGrid4x4 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Meeting Cards Grid */}
                {isLoadingMeetings ? (
                  <div className="flex items-center justify-center py-12">
                    <IconLoader2 className="h-8 w-8 animate-spin text-[#6b4eff]" />
                  </div>
                ) : filteredMeetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-lg font-medium text-gray-900">Belum ada meeting</p>
                    <p className="text-sm text-gray-500 mt-1">Mulai dengan membuat meeting baru</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredMeetings.map((meeting) => (
                      <MeetingCard key={meeting._id} data={formatMeetingForCard(meeting)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
        <OnlineMeetingDialog
          isOpen={isOnlineMeetingOpen}
          onClose={() => setIsOnlineMeetingOpen(false)}
        />
        <RealtimeMeetingDialog
          isOpen={isRealtimeMeetingOpen}
          onClose={() => setIsRealtimeMeetingOpen(false)}
        />
    </SidebarProvider>
  )
}

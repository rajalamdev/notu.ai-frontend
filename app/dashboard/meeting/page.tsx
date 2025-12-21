"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { IconSearch, IconVideo, IconMicrophone, IconBell, IconPlus, IconChevronDown, IconDots, IconList, IconGrid4x4 } from "@tabler/icons-react"
import { SiteHeader } from "@/components/site-header"
import MeetingCard from "@/components/custom/MeetingCard"

export default function MeetingPage() {
  const meetingHistory = [
    { 
      id: 1,
      tag: "#My Meeting",
      platform: "Google Meet",
      date: "Senin, 8 September 2025 12:55",
      title: "Rapat HMIF Periode 2025/2026",
      description: "Pada rapat ini membahas tentang pengkajian ad/art periode himpunan 2025/2026, banyak sekali perubahan ad/art karena sudah tidak relevannya dengan zamannya.",
      type: "online"
    },
    {
      id: 2,
      tag: "#Shared With Me",
      platform: "Google Meet",
      date: "Senin, 8 September 2025 12:55",
      title: "Rapat HMIF Periode 2025/2026",
      description: "Pada rapat ini membahas tentang pengkajian ad/art periode himpunan 2025/2026, banyak sekali perubahan ad/art karena sudah tidak relevannya dengan zamannya.",
      type: "online"
    },
    {
      id: 3,
      tag: "#My Meeting",
      platform: "Google Meet",
      date: "Senin, 8 September 2025 12:55",
      title: "Rapat HMIF Periode 2025/2026",
      description: "Pada rapat ini membahas tentang pengkajian ad/art periode himpunan 2025/2026, banyak sekali perubahan ad/art karena sudah tidak relevannya dengan zamannya.",
      type: "online"
    },
    {
      id: 4,
      tag: "#Shared With Me",
      platform: "Google Meet",
      date: "Senin, 8 September 2025 12:55",
      title: "Rapat HMIF Periode 2025/2026",
      description: "Pada rapat ini membahas tentang pengkajian ad/art periode himpunan 2025/2026, banyak sekali perubahan ad/art karena sudah tidak relevannya dengan zamannya.",
      type: "online"
    }
  ]

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
        <div className="flex flex-1 flex-col bg-gray-50">
          <div className="flex-1 p-6 mt-4">
            {/* Generate Your Meeting Section */}
            <div className="mb-8 flex flex-col items-center">
              {/* Placeholder Animation */}
              <div className="mb-6 flex items-center bg-white py-8 px-8 rounded-[6px] shadow-lg gap-2">
                <div className="h-4 w-4 rounded-full bg-[#6b4eff]"></div>
                <div className="h-3 w-16 rounded-full bg-gray-300"></div>
                <div className="h-3 w-24 rounded-full bg-gray-300"></div>
                <div className="h-3 w-32 rounded-full bg-gray-300"></div>
              </div>

              <h1 className="mb-4 text-3xl font-bold text-gray-900">Generate Your Meeting...</h1>
              <p className="mb-6 text-gray-600">
                Berikan Link Google Meet Anda, Dan Biarkan Notu Meringkas Poin Poin Meeting Anda
              </p>

              <div className="flex gap-4">
                <Button className="bg-[#6b4eff] hover:bg-[#5a3ee6] text-white px-6 py-3">
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add To Live Meet
                </Button>
                <Button className="bg-purple-100 hover:bg-purple-200 text-[#6b4eff] px-6 py-3">
                  <IconMicrophone className="mr-2 h-4 w-4" />
                  Realtime Meet
                </Button>
              </div>
            </div>

            {/* Meeting History Section */}
            <div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">Meeting History</h2>
              <p className="mb-6 text-sm text-gray-600">Cari Meeting Anda Yang Telah Dibuat</p>

              {/* Search and Filter Bar */}
              <div className="mb-6 flex items-center gap-4">
                <div className="relative flex-1">
                  <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="Search Notes.." 
                    className="pl-10 pr-4"
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-2 bg-background-2 border-border">
                  All Notes
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
              <div className="grid gap-4 md:grid-cols-2">
                {meetingHistory.map((meeting) => (
                  <MeetingCard key={meeting.id} data={meeting} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

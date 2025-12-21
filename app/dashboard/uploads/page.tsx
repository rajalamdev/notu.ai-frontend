"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import MeetingCard from "@/components/custom/MeetingCard"
import { IconCloudUpload, IconSearch, IconLayoutGrid, IconList, IconLoader2, IconX } from "@tabler/icons-react"
import { useApiWithAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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

export default function UploadsPage() {
  const { api, isReady } = useApiWithAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Fetch uploaded meetings
  const fetchMeetings = useCallback(async () => {
    if (!isReady) return
    
    try {
      setIsLoading(true)
      const response = await api.getMeetings({ limit: 20 })
      // Filter to show only uploaded meetings (platform uses Title Case: 'Upload')
      const uploadedMeetings = (response.meetings || []).filter(
        (m: Meeting) => m.type === 'upload' || m.platform === 'Upload'
      )
      setMeetings(uploadedMeetings)
    } catch (error) {
      console.error("Error fetching meetings:", error)
      toast.error("Gagal memuat meeting")
    } finally {
      setIsLoading(false)
    }
  }, [isReady, api])

  useEffect(() => {
    if (isReady) {
      fetchMeetings()
    } else {
      setIsLoading(false)
    }
  }, [isReady, fetchMeetings])

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/wave', 'video/mp4', 'video/webm']
    const maxSize = 100 * 1024 * 1024 // 100MB
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format file tidak didukung. Gunakan MP3, WAV, atau MP4.")
      return
    }
    
    if (file.size > maxSize) {
      toast.error("Ukuran file terlalu besar. Maksimal 100MB.")
      return
    }
    
    setSelectedFile(file)
  }

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !isReady) return
    
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 500)
      
      const response = await api.uploadFile(selectedFile, {
        title: selectedFile.name.replace(/\.[^/.]+$/, ""),
      })
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      toast.success("File berhasil diupload! Transkripsi sedang diproses.")
      setSelectedFile(null)
      
      // Navigate to status page
      router.push(`/dashboard/status-meeting?id=${response.meeting._id}`)
    } catch (error: any) {
      console.error("Error uploading file:", error)
      toast.error(error.response?.data?.error || "Gagal mengupload file")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Format meeting data for MeetingCard
  const formatMeetingForCard = (meeting: Meeting) => ({
    id: meeting._id,
    tag: "#My Meeting",
    platform: "Upload",
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
    type: "upload",
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
              {/* Upload Dropzone */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardContent className="p-6">
                    <div 
                      className={`border-2 border-dashed rounded-xl transition-colors ${
                        isDragging 
                          ? 'border-[#6b4eff] bg-[#EFE8FF]' 
                          : 'border-[#E2D9FF] bg-[#FBFAFF]'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mp3,.wav,.mp4,.webm,audio/*,video/*"
                        className="hidden"
                        onChange={handleInputChange}
                      />
                      
                      {selectedFile ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="rounded-full bg-[#EFE8FF] p-3 text-[#6b4eff] mb-4">
                            <IconCloudUpload className="h-6 w-6" />
                          </div>
                          <h2 className="text-[15px] font-semibold text-[#1E1E1E]">{selectedFile.name}</h2>
                          <p className="mt-1 text-xs text-[#6B6B6B]">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          
                          {isUploading && (
                            <div className="w-64 mt-4">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-[#6b4eff] h-2 rounded-full transition-all" 
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <p className="text-xs text-[#6B6B6B] mt-2">Uploading... {uploadProgress}%</p>
                            </div>
                          )}
                          
                          <div className="flex gap-2 mt-5">
                            <Button 
                              variant="outline"
                              onClick={() => setSelectedFile(null)}
                              disabled={isUploading}
                            >
                              <IconX className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button 
                              className="bg-[#6b4eff] hover:bg-[#5b41ff] text-white"
                              onClick={handleUpload}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <>
                                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                "Upload & Transcribe"
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="rounded-full bg-[#EFE8FF] p-3 text-[#6b4eff] mb-4">
                            <IconCloudUpload className="h-6 w-6" />
                          </div>
                          <h2 className="text-[15px] font-semibold text-[#1E1E1E]">Upload A File To Generate A Transcript</h2>
                          <p className="mt-1 text-xs text-[#6B6B6B]">Browse Or Drag And Drop MP3, WAV, Or MP4 Files. (Max Video Size 100MB)</p>
                          <Button 
                            className="mt-5 bg-[#6b4eff] hover:bg-[#5b41ff] text-white"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Upload Your Meeting
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Meeting History Header */}
              <div className="px-4 lg:px-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-[16px] font-semibold text-[#1E1E1E]">Meeting History</h3>
                    <p className="text-xs text-[#6B6B6B]">Cari Meeting Anda Yang Telah Dibuat</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-[260px]">
                      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-9" 
                        placeholder="Search Notes..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="All Notes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Notes</SelectItem>
                        <SelectItem value="mine">My Notes</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="today">
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Today" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center rounded-md border bg-white p-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6B6B6B]">
                        <IconList className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#6B6B6B]">
                        <IconLayoutGrid className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meeting Cards */}
              <div className="px-4 lg:px-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <IconLoader2 className="h-8 w-8 animate-spin text-[#6b4eff]" />
                  </div>
                ) : filteredMeetings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-lg font-medium text-gray-900">Belum ada file yang diupload</p>
                    <p className="text-sm text-gray-500 mt-1">Upload file audio/video untuk memulai transkripsi</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
    </SidebarProvider>
  )
}

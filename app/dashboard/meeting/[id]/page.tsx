"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useApiWithAuth, useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { IconLoader2, IconMenu2, IconShare, IconLink, IconPlus, IconDownload, IconCopy, IconPencil, IconChevronDown } from "@tabler/icons-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import dynamic from "next/dynamic"

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
)

interface Segment {
  speaker: string
  text: string
  start: number
  end: number
}

interface TalkTimeData {
  speaker: string
  words: number
  talks: number
  total: number
}

interface TopicKeyword {
  name: string
  color: string
}

interface Task {
  title: string
  deadline: string
  color: string
}

interface MeetingData {
  _id: string
  title: string
  description?: string
  platform: string
  status: string
  duration?: number
  createdAt: string
  transcription?: {
    transcript?: string
    summary?: string
    highlights?: Record<string, string> // Dynamic object with sub-headers as keys
    conclusion?: string
    segments?: Segment[]
    language?: string
  }
  actionItems?: Array<{
    id: string
    title: string
    description?: string
    assignee?: string | null
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    dueDate?: Date | string | null
    status?: 'todo' | 'in_progress' | 'done'
    labels?: string[]
  }>
  participants?: number
  videoUrl?: string
  audioUrl?: string
  tags?: string[]
  originalFile?: {
    mimetype?: string
    originalName?: string
  }
}

interface AnalyticsData {
  talkTime: TalkTimeData[]
  topics: TopicKeyword[]
  actionItems?: Array<{
    id: string
    title: string
    description?: string
    assignee?: string | null
    priority?: string
    status?: string
  }>
}

export default function MeetingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const meetingId = params.id as string
  
  const { api, isReady } = useApiWithAuth()
  const { user } = useAuth()
  
  const [meeting, setMeeting] = useState<MeetingData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isVideoFile, setIsVideoFile] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{
    executiveSummary?: string
    highlights?: string[]
    conclusion?: string
    actionItems?: string[]
  }>({})
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [activeTab, setActiveTab] = useState("transcript")
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null)
  const [autoFollow, setAutoFollow] = useState(true)
  const transcriptContainerRef = useRef<HTMLDivElement>(null)

  // Fetch meeting data
  const fetchMeeting = useCallback(async () => {
    if (!isReady || !meetingId) return
    
    try {
      setIsLoading(true)
      const response = await api.getMeeting(meetingId) as { success: boolean; meeting: MeetingData; actionItems?: any[]; fileUrl?: string }
      const meetingData = response.meeting || (response as any).data?.meeting || response
      
      // Merge actionItems from response if available (from Task collection)
      const actionItems = response.actionItems || (response as any).data?.actionItems || []
      if (meetingData) {
        meetingData.actionItems = actionItems
      }

      setMeeting(meetingData)
      
      // Determine file type
      const mimetype = meetingData.originalFile?.mimetype || ''
      const filename = meetingData.originalFile?.originalName || ''
      const isVideo = mimetype.startsWith('video/') || filename.toLowerCase().endsWith('.mp4')
      setIsVideoFile(isVideo)
      
      // Set audio/video URL if available
      if (response.fileUrl) {
        if (isVideo) {
          setVideoUrl(response.fileUrl)
          setAudioUrl(response.fileUrl) // Video files also have audio track
        } else {
          setAudioUrl(response.fileUrl)
        }
      }
      if (meetingData.audioUrl) {
        setAudioUrl(meetingData.audioUrl)
      }
      if (meetingData.videoUrl) {
        setVideoUrl(meetingData.videoUrl)
        setIsVideoFile(true)
      }
    } catch (error: any) {
      console.error("Error fetching meeting:", error)
      toast.error("Gagal memuat data meeting")
      if (error.response?.status === 404) {
        router.push("/dashboard")
      }
    } finally {
      setIsLoading(false)
    }
  }, [isReady, meetingId, api, router])

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    if (!isReady || !meetingId) return
    
    try {
      const response = await api.getMeetingAnalytics(meetingId) as { success: boolean; data: AnalyticsData }
      const analyticsData = response.data || (response as any).data
      if (analyticsData) {
        setAnalytics(analyticsData)
        // Note: Action items are now managed independent of analytics
        // We rely on fetchMeeting (Task collection) for the canonical list
      }
    } catch (error: any) {
      console.error("Error fetching analytics:", error)
    }
  }, [isReady, meetingId, api])

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!isReady || !meetingId) return
    
    try {
      const response = await api.getTasks({ meetingId }) as { success: boolean; data: any[] }
      setTasks(response.data || [])
    } catch (error: any) {
      console.error("Error fetching tasks:", error)
    }
  }, [isReady, meetingId, api])

  useEffect(() => {
    if (isReady) {
      fetchMeeting()
      fetchAnalytics()
      fetchTasks()
    }
  }, [isReady, fetchMeeting, fetchAnalytics, fetchTasks])

  // Video/Audio player controls
  useEffect(() => {
    const video = videoRef.current
    const audio = audioRef.current
    
    const handleTimeUpdate = () => {
      const time = video?.currentTime || audio?.currentTime || 0
      setCurrentTime(time)
      
      // Find active segment
      if (meeting?.transcription?.segments) {
        const activeIndex = meeting.transcription.segments.findIndex(
          seg => seg.start <= time && seg.end >= time
        )
        if (activeIndex !== -1 && activeIndex !== activeSegmentIndex) {
          setActiveSegmentIndex(activeIndex)
          
          // Auto scroll to active segment
          if (autoFollow && transcriptContainerRef.current && !searchQuery) {
            const segmentElement = transcriptContainerRef.current.children[activeIndex] as HTMLElement
            if (segmentElement) {
              segmentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }
        }
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('ended', handleEnded)
    }
    if (audio) {
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('ended', handleEnded)
    }

    return () => {
      if (video) {
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('ended', handleEnded)
      }
      if (audio) {
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('ended', handleEnded)
      }
    }
  }, [videoUrl, audioUrl, meeting?.transcription?.segments, autoFollow, activeSegmentIndex])

  const togglePlayPause = () => {
    const video = videoRef.current
    const audio = audioRef.current
    
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
    } else if (audio) {
      if (isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
    }
    setIsPlaying(!isPlaying)
  }

  const jumpToTimestamp = (seconds: number) => {
    const video = videoRef.current
    const audio = audioRef.current
    
    if (video) {
      video.currentTime = seconds
      if (!isPlaying) {
        video.play()
        setIsPlaying(true)
      }
    } else if (audio) {
      audio.currentTime = seconds
      if (!isPlaying) {
        audio.play()
        setIsPlaying(true)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}jam ${minutes}menit ${secs}detik`
    }
    return `${minutes}menit ${secs}detik`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTimeOnly = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Handle export
  const handleExport = async (format: 'json' | 'txt' | 'srt' | 'vtt' | 'mp3' | 'mp4') => {
    if (!isReady || !meetingId) return
    
    try {
      if (format === 'mp3' || format === 'mp4') {
        // Download original file using api client
        const blob = await api.exportTranscript(meetingId, format)
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        const extension = meeting?.originalFile?.originalName?.split('.').pop() || format
        a.download = `${meeting?.title || 'meeting'}.${extension}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
        toast.success(`File ${format.toUpperCase()} berhasil didownload`)
      } else {
        // Download transcript
        const blob = await api.exportTranscript(meetingId, format)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transcript-${meetingId}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success("Transcript berhasil didownload")
      }
    } catch (error: any) {
      console.error("Error exporting:", error)
      toast.error(error.message || "Gagal mengexport")
    }
  }

  // Handle update content
  const handleUpdateContent = async (field: 'executiveSummary' | 'highlights' | 'notes' | 'conclusion' | 'actionItems', value: any) => {
    if (!isReady || !meetingId) return
    
    try {
      const updateData: any = {}
      if (field === 'executiveSummary') {
        updateData.executiveSummary = value
      } else if (field === 'highlights') {
        updateData.highlights = value
      } else if (field === 'notes') {
        updateData.notes = value
      } else if (field === 'conclusion') {
        updateData.conclusion = value
      }
      
      // actionItems are managed via Task API now
      
      await api.updateMeeting(meetingId, updateData)
      await fetchMeeting()
      setEditingField(null)
      toast.success("Berhasil memperbarui konten")
    } catch (error) {
      console.error("Error updating content:", error)
      toast.error("Gagal memperbarui konten")
    }
  }

  // Filter segments by search query
  const filteredSegments = meeting?.transcription?.segments?.filter(segment =>
    segment.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    segment.speaker.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <IconLoader2 className="h-12 w-12 animate-spin text-purple-600" />
          <p className="text-muted-foreground">Memuat data meeting...</p>
        </div>
      </div>
    )
  }

  // Meeting not found
  if (!meeting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-xl font-semibold">Meeting tidak ditemukan</p>
          <Button onClick={() => router.push("/dashboard")}>Kembali ke Dashboard</Button>
        </div>
      </div>
    )
  }

  const totalDuration = meeting.duration || 0
  const meetingDate = formatDate(meeting.createdAt)
  const meetingTime = formatTimeOnly(meeting.createdAt)

  const talkTimeData = analytics?.talkTime || []
  const topicsKeywords = analytics?.topics || []
  
  // Fix talktime display - ensure proper sorting and formatting
  const sortedTalkTime = [...talkTimeData].sort((a, b) => b.total - a.total)
  
  const tasksData: Task[] = tasks.map((task, index) => {
    const colors = ['bg-purple-500', 'bg-red-400', 'bg-emerald-500', 'bg-orange-400']
    let deadline = '-'
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate)
      const now = new Date()
      const diffTime = dueDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays < 0) {
        deadline = 'Terlambat'
      } else if (diffDays === 0) {
        deadline = 'Hari ini'
      } else if (diffDays === 1) {
        deadline = 'Besok'
      } else {
        deadline = `${diffDays} hari`
      }
    }
    return {
      title: task.title,
      deadline,
      color: colors[index % colors.length],
    }
  })

  const executiveSummary = meeting.transcription?.summary || ""
  const highlights = meeting.transcription?.highlights || {} // Now an object with sub-headers
  const actionItems = meeting.actionItems || []
  const conclusion = meeting.transcription?.conclusion || ""
  const transcriptSegments = meeting.transcription?.segments || []

  const handleGenerateKanban = async () => {
    if (!isReady || !meetingId) return
    try {
      toast.loading("Membuat Kanban board...")
      const res = await api.createBoardFromMeeting(meetingId)
      toast.dismiss()
      toast.success("Kanban board berhasil dibuat!")
      router.push(`/dashboard/kanban/${res.data._id}`)
    } catch (error) {
      toast.dismiss()
      toast.error("Gagal membuat Kanban board")
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <IconMenu2 className="h-5 w-5 text-gray-600" />
            </Button>
            <h1 className="text-lg font-medium">{meeting.title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button className="bg-[#6b4eff] hover:bg-[#5a3ee6] text-white rounded-full px-4 h-9 flex items-center gap-2">
              <IconShare className="h-4 w-4" />
              Share
            </Button>
            
            <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              toast.success("Link berhasil disalin")
            }}>
              <IconLink className="h-4 w-4" />
            </Button>

            <Button variant="outline" className="rounded-lg h-9 px-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h16v16H4V4z"/>
              </svg>
              <span className="text-sm">Notion</span>
              <span className="text-xs text-muted-foreground">Connect</span>
            </Button>

            <Button variant="ghost" size="icon" className="h-9 w-9">
              <IconPlus className="h-4 w-4" />
            </Button>

            <div className="relative group">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <IconDownload className="h-4 w-4" />
              </Button>
              <div className="hidden group-hover:block absolute right-0 mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                <button onClick={() => handleExport('txt')} className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left">
                  Text (.txt)
                </button>
                {isVideoFile && (
                  <button onClick={() => handleExport('mp4')} className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left">
                    Video (.mp4)
                  </button>
                )}
                {audioUrl && (
                  <button onClick={() => handleExport('mp3')} className="block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left">
                    Audio (.mp3)
                  </button>
                )}
              </div>
            </div>

            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => {
              navigator.clipboard.writeText(executiveSummary)
              toast.success("Summary berhasil disalin")
            }}>
              <IconCopy className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 ml-2">
              <div className="text-right">
                <div className="text-sm font-medium">{user?.name || 'User'}</div>
                <div className="text-xs text-muted-foreground">{user?.plan || 'Free'}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-57px)] bg-white">
        {/* Left Sidebar - Analytics */}
        <div className="w-72 border-r overflow-y-auto">
          <div className="p-4">
            {/* Analytics Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-base">Analytics</h2>
            </div>

            {/* TALKTIME Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">TALKTIME</h3>
                <IconChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
              
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground mb-2 px-1">
                <div>Speaker</div>
                <div>Kata</div>
                <div>Bicara</div>
                <div>Total</div>
              </div>

              {/* Speaker Rows */}
              <div className="space-y-3">
                {sortedTalkTime.length > 0 ? (
                  sortedTalkTime.map((item, index) => {
                    const circumference = 2 * Math.PI * 6 // radius = 6
                    const dashOffset = circumference - (circumference * item.total / 100)
                    return (
                      <div key={index} className="grid grid-cols-4 gap-2 items-center">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">
                            {item.speaker.charAt(item.speaker.length - 1)}
                          </div>
                          <span className="text-xs truncate">{item.speaker}</span>
                        </div>
                        <div className="text-xs">{item.words}</div>
                        <div className="text-xs">{item.talks}x</div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{item.total}%</span>
                          <div className="relative w-4 h-4">
                            <svg className="w-4 h-4 -rotate-90" viewBox="0 0 16 16">
                              <circle cx="8" cy="8" r="6" fill="none" stroke="#e5e7eb" strokeWidth="2"/>
                              <circle 
                                cx="8" 
                                cy="8" 
                                r="6" 
                                fill="none" 
                                stroke="#8b5cf6" 
                                strokeWidth="2" 
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-xs text-muted-foreground py-2">Tidak ada data</div>
                )}
              </div>
            </div>

            {/* TOPIK / KEYWORD Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">TOPIK / KEYWORD</h3>
                <IconChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {topicsKeywords.length > 0 ? (
                  topicsKeywords.map((topic, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${topic.color}`}></div>
                      <span className="text-sm">{topic.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground">Tidak ada topik</div>
                )}
              </div>
            </div>

            {/* ACTION Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">ACTION</h3>
                <IconChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Action Items from Analytics */}
              {analytics?.actionItems && analytics.actionItems.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground px-1">
                    <span>Action Items</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {analytics.actionItems.map((item, index) => {
                      const colors = ['bg-purple-500', 'bg-red-400', 'bg-emerald-500', 'bg-orange-400']
                      return (
                        <div key={item.id || index} className="flex items-start gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${colors[index % colors.length]} mt-1.5 flex-shrink-0`}></div>
                          <div className="text-sm leading-tight flex-1">
                            {item.title}
                            {item.description && (
                              <span className="text-xs text-muted-foreground block mt-0.5">{item.description}</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Todolist notification */}
              {tasks.length > 0 && (
                <div className="flex items-center justify-between mb-4 bg-purple-50 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-purple-500 flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    </div>
                    <span className="text-xs text-purple-700">
                      {tasks.some((t: any) => t.boardId) 
                        ? "Kanban board telah dibuat untuk meeting ini" 
                        : "Todolist siap dimigrasi ke kanban!"}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" className="h-6 text-xs px-2 rounded-full" onClick={handleGenerateKanban}>
                    {tasks.some((t: any) => t.boardId) ? "Buka" : "Buat"}
                    <IconPlus className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}

              {/* Tugas Header */}
              <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground px-1">
                <span>Tugas</span>
                <span>Deadline</span>
              </div>
              
              {/* Task List */}
              <div className="space-y-3">
                {tasksData.length > 0 ? (
                  tasksData.map((task, index) => (
                    <div key={index} className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${task.color} mt-1.5 flex-shrink-0`}></div>
                        <div className="text-sm leading-tight">{task.title}</div>
                      </div>
                      <span className="text-sm text-muted-foreground ml-2">{task.deadline}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground">Tidak ada tugas</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Meeting Header */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-semibold mb-1">{meeting.title}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {meetingDate} {meetingTime} ({formatDuration(totalDuration)})
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  {meeting.platform || "Google Meet"}
                </div>
                {meeting.participants && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    {meeting.participants} Orang
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="px-6 py-4 space-y-6 pb-24">
            {/* Executive Summary */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-purple-700">Executive Summary</h2>
                <Dialog open={editingField === 'executiveSummary'} onOpenChange={(open) => {
                  if (!open) setEditingField(null)
                  else setEditingField('executiveSummary')
                }}>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                      <IconPencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </DialogTrigger>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Edit Executive Summary</DialogTitle>
                    </DialogHeader>
                    <div data-color-mode="light">
                      <MDEditor
                        value={editValues.executiveSummary ?? executiveSummary}
                        onChange={(val) => setEditValues({ ...editValues, executiveSummary: val || "" })}
                        height={300}
                        preview="edit"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditingField(null)}>Batal</Button>
                      <Button onClick={() => handleUpdateContent('executiveSummary', editValues.executiveSummary || executiveSummary)}>Simpan</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="prose prose-sm prose-gray max-w-none text-muted-foreground">
                {executiveSummary ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{executiveSummary}</ReactMarkdown>
                ) : (
                  <p>Tidak ada summary tersedia</p>
                )}
              </div>
            </div>

            {/* Highlights - Dynamic sub-headers (replaces old Notes section) */}
            {Object.keys(highlights).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-purple-700">Catatan Rapat</h2>
                  <Dialog open={editingField === 'highlights'} onOpenChange={(open) => {
                    if (!open) setEditingField(null)
                    else setEditingField('highlights')
                  }}>
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                        <IconPencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Catatan Rapat</DialogTitle>
                      </DialogHeader>
                      <Textarea
                        defaultValue={Object.entries(highlights).map(([key, value]) => `${key}:\n${value}`).join('\n\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n')
                          const highlightsObj: Record<string, string> = {}
                          let currentKey = ''
                          let currentValue: string[] = []
                          
                          lines.forEach(line => {
                            if (line.trim().endsWith(':')) {
                              if (currentKey) {
                                highlightsObj[currentKey] = currentValue.join('\n').trim()
                              }
                              currentKey = line.replace(':', '').trim()
                              currentValue = []
                            } else {
                              currentValue.push(line)
                            }
                          })
                          if (currentKey) {
                            highlightsObj[currentKey] = currentValue.join('\n').trim()
                          }
                          setEditValues({ ...editValues, highlights: Object.values(highlightsObj) })
                        }}
                        className="min-h-[400px] font-mono text-sm"
                        placeholder="Format:\nGambaran Umum:\nisi catatan...\n\nTopik Lain:\nisi catatan..."
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditingField(null)}>Batal</Button>
                        <Button onClick={() => handleUpdateContent('highlights', highlights)}>Simpan</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="space-y-6">
                  {Object.entries(highlights).map(([header, content]) => (
                    <div key={header}>
                      <h3 className="font-medium text-sm mb-2 text-purple-700">{header}</h3>
                      <div className="prose prose-sm prose-gray max-w-none text-muted-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message when no highlights available */}
            {Object.keys(highlights).length === 0 && (
              <div>
                <h2 className="text-base font-semibold text-purple-700 mb-2">Catatan Rapat</h2>
                <p className="text-sm text-muted-foreground">Tidak ada catatan tersedia</p>
              </div>
            )}

            {/* Action Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-purple-700">Action Items</h2>
                  <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">Task Integration</span>
                </div>
              </div>
              {actionItems.length > 0 ? (
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {actionItems.map((item, index) => (
                    <li key={item.id || index} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{item.title}</span>
                          {item.priority && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {item.priority}
                            </span>
                          )}
                          {item.status && item.status !== 'todo' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.status === 'done' ? 'bg-green-100 text-green-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {item.status === 'done' ? 'Selesai' : 'Dalam Proses'}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                        )}
                        {item.labels && item.labels.length > 0 && (
                          <div className="flex gap-1 mt-1.5">
                            {item.labels.map((label, idx) => (
                              <span key={idx} className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">Tidak ada action items</div>
              )}
            </div>

            {/* Conclusion */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-purple-700">Conclusion</h2>
                <Dialog open={editingField === 'conclusion'} onOpenChange={(open) => {
                  if (!open) setEditingField(null)
                  else setEditingField('conclusion')
                }}>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                      <IconPencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Edit Conclusion</DialogTitle>
                    </DialogHeader>
                    <div data-color-mode="light">
                      <MDEditor
                        value={editValues.conclusion ?? conclusion}
                        onChange={(val) => setEditValues({ ...editValues, conclusion: val || "" })}
                        height={300}
                        preview="edit"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditingField(null)}>Batal</Button>
                      <Button onClick={() => handleUpdateContent('conclusion', editValues.conclusion || conclusion)}>Simpan</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="prose prose-sm prose-gray max-w-none text-muted-foreground">
                {conclusion ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{conclusion}</ReactMarkdown>
                ) : (
                  <p>Tidak ada conclusion tersedia</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Video & Transcript */}
        <div className="w-80 border-l flex flex-col">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="transcript" className="flex-1">Transkrip</TabsTrigger>
              <TabsTrigger value="ask-ai" className="flex-1 flex items-center justify-center gap-1.5">
                <div className="w-5 h-5 rounded bg-purple-600 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                Ask AI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="flex-1 flex flex-col overflow-hidden m-0">
              {/* Video Player - Only show if video file */}
              {isVideoFile && (
                <div className="p-3">
                  <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-teal-300 via-green-200 to-yellow-100 aspect-video">
                    {videoUrl ? (
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    ) : (
                      <>
                        {/* Video illustration */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            {/* Character illustration placeholder */}
                            <div className="w-16 h-16 mx-auto mb-2 bg-yellow-200 rounded-full relative">
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-8 bg-blue-400 rounded-t-full"></div>
                            </div>
                          </div>
                        </div>
                        {/* Subtitle */}
                        {transcriptSegments.length > 0 && (
                          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded max-w-[80%] text-center">
                            {transcriptSegments.find(s => s.start <= currentTime && s.end >= currentTime)?.text || ""}
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Video Controls */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      {/* Progress bar */}
                      <div className="w-full h-1 bg-white/30 rounded-full mb-2">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-white text-[10px]">
                        <div className="flex items-center gap-2">
                          <button onClick={togglePlayPause} className="hover:opacity-80">
                            {isPlaying ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="4" width="4" height="16"/>
                                <rect x="14" y="4" width="4" height="16"/>
                              </svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                              </svg>
                            )}
                          </button>
                          <span>{formatTime(currentTime)}/{formatTime(totalDuration)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Search and Auto Follow */}
              <div className="px-3 pb-3 space-y-2">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <Input 
                    placeholder="Cari transkrip..." 
                    className="pl-9 bg-gray-50 border-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAutoFollow(!autoFollow)}
                    className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                      autoFollow 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {autoFollow ? (
                        <path d="M5 13l4 4L19 7"/>
                      ) : (
                        <circle cx="12" cy="12" r="10"/>
                      )}
                    </svg>
                    Auto Follow
                  </button>
                </div>
              </div>

              {/* Transcript Items */}
              <div ref={transcriptContainerRef} className="flex-1 overflow-y-auto px-3 space-y-3 pb-20">
                {(searchQuery ? filteredSegments : transcriptSegments).length > 0 ? (
                  (searchQuery ? filteredSegments : transcriptSegments).map((segment, index) => {
                    const originalIndex = searchQuery 
                      ? transcriptSegments.findIndex(s => s.start === segment.start && s.text === segment.text)
                      : index
                    const isActive = activeSegmentIndex === originalIndex
                    
                    return (
                      <div 
                        key={index} 
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          isActive 
                            ? 'border-purple-500 border-2 bg-purple-50 shadow-sm' 
                            : 'border-purple-200 bg-purple-50/50 hover:bg-purple-100/50'
                        }`}
                        onClick={() => jumpToTimestamp(segment.start)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {segment.speaker.charAt(segment.speaker.length - 1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{segment.speaker}</span>
                                <span className="text-xs text-purple-600">{formatTime(segment.start)}</span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {segment.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">Tidak ada transkrip tersedia</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ask-ai" className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="#8b5cf6">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Ask AI</h3>
                <p className="text-sm text-muted-foreground">Fitur Ask AI akan segera hadir</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bottom Footer - Playback Controls */}
      {(videoUrl || audioUrl) && (
        <div className={`fixed bottom-0 ${isVideoFile ? 'left-72 right-80' : 'left-72 right-0'} bg-white border-t px-6 py-3 z-50`}>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground w-10">{formatTime(currentTime)}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const video = videoRef.current
                  const audio = audioRef.current
                  if (video) video.currentTime = Math.max(0, video.currentTime - 10)
                  if (audio) audio.currentTime = Math.max(0, audio.currentTime - 10)
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="19 20 9 12 19 4 19 20"/>
                  <line x1="5" y1="19" x2="5" y2="5"/>
                </svg>
              </button>
              <button 
                onClick={togglePlayPause}
                className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white"
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                )}
              </button>
              <button 
                onClick={() => {
                  const video = videoRef.current
                  const audio = audioRef.current
                  if (video) video.currentTime = Math.min(totalDuration, video.currentTime + 10)
                  if (audio) audio.currentTime = Math.min(totalDuration, audio.currentTime + 10)
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 4 15 12 5 20 5 4"/>
                  <line x1="19" y1="5" x2="19" y2="19"/>
                </svg>
              </button>
            </div>
            <div 
              className="flex-1 h-1 bg-gray-200 rounded-full relative cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const percentage = x / rect.width
                const newTime = percentage * totalDuration
                const video = videoRef.current
                const audio = audioRef.current
                if (video) video.currentTime = newTime
                if (audio) audio.currentTime = newTime
              }}
            >
              <div 
                className="absolute left-0 top-0 h-full bg-purple-600 rounded-full transition-all"
                style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
              ></div>
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-600 rounded-full border-2 border-white shadow transition-all"
                style={{ left: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
              ></div>
            </div>
            <span className="text-sm text-muted-foreground w-10 text-right">{formatTime(totalDuration)}</span>
          </div>
        </div>
      )}

      {/* Hidden audio element */}
      {audioUrl && !videoUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}
    </div>
  )
}
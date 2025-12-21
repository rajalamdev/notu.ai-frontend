"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { IconCopy, IconLoader2 } from "@tabler/icons-react"
import { useState } from "react"
import { useApiWithAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface OnlineMeetingDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function OnlineMeetingDialog({ isOpen, onClose }: OnlineMeetingDialogProps) {
  const [meetingName, setMeetingName] = useState("")
  const [meetingLink, setMeetingLink] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { api, isReady } = useApiWithAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!meetingLink) {
      toast.error("Silahkan masukkan link meeting")
      return
    }

    if (!isReady) {
      toast.error("Silahkan login terlebih dahulu")
      return
    }

    setIsLoading(true)
    try {
      const response = await api.createOnlineMeeting({
        meetingUrl: meetingLink,
        platform: 'google_meet',
      })
      
      toast.success("Bot berhasil dikirim ke meeting!")
      onClose()
      
      // Navigate to status meeting page
      router.push(`/dashboard/status-meeting?id=${response.meeting._id}`)
    } catch (error: any) {
      console.error("Error creating online meeting:", error)
      toast.error(error.response?.data?.error || "Gagal mengirim bot ke meeting")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setMeetingName("")
      setMeetingLink("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Take Notes From Online Meeting</DialogTitle>
          <DialogDescription>
            Using Online Bot For Google Meet
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Input
              placeholder="Nama meeting (opsional)"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Paste URL Google Meet anda disini
            </p>
            <div className="relative">
              <Input
                placeholder="Meeting link"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                disabled={isLoading}
                required
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => navigator.clipboard.writeText(meetingLink)}
                type="button"
                disabled={isLoading}
              >
                <IconCopy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-[#6b4eff] hover:bg-[#5a3ee6]"
            disabled={isLoading || !isReady}
          >
            {isLoading ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengirim Bot...
              </>
            ) : (
              "Mulai"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

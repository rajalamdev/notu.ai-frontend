"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { useState } from "react"

interface RealtimeMeetingDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function RealtimeMeetingDialog({ isOpen, onClose }: RealtimeMeetingDialogProps) {
  const [meetingName, setMeetingName] = useState("")
  const [timer, setTimer] = useState("00:00:00")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log({ meetingName, timer })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Take Notes From Realtime Meeting</DialogTitle>
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
            />
            <p className="text-xs text-muted-foreground">
              Paste URL Google Meet anda disini
            </p>
            <div className="flex items-center justify-center">
              <div className="text-4xl font-mono">{timer}</div>
            </div>
          </div>
          <Button type="submit" className="w-full bg-[#6b4eff] hover:bg-[#5a3ee6]">
            Mulai
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

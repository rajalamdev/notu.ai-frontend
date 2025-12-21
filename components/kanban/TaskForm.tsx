import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label" 
import { Badge } from "@/components/ui/badge"
import { IconPlus } from "@tabler/icons-react"
import * as Dialog from "@radix-ui/react-dialog"
import { useState } from "react"
import { BoardLabel } from "./types"

interface TaskFormProps {
  state: any
  setState: (updater: any) => void
  labels: BoardLabel[]
  setLabels: React.Dispatch<React.SetStateAction<BoardLabel[]>>
  invitedMembers: string[]
}

export function TaskForm({ state, setState, labels, setLabels, invitedMembers }: TaskFormProps) {
  const randomLabelColor = () => {
    const hue = Math.floor(Math.random() * 360)
    return `hsl(${hue} 90% 55%)`
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input 
          id="title" 
          value={state.title} 
          onChange={(e) => setState((s: any) => ({ ...s, title: e.target.value }))} 
          placeholder="Task title" 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="desc">Description</Label>
        <textarea 
          id="desc" 
          className="w-full rounded-md border bg-background p-2 text-sm" 
          rows={4} 
          value={state.description} 
          onChange={(e) => setState((s: any) => ({ ...s, description: e.target.value }))} 
          placeholder="Details" 
        />
      </div>
      
      {/* Members / Labels / Due date row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Members */}
        <div className="space-y-2">
          <Label>Members</Label>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-[10px] font-semibold text-white ring-2 ring-background">
                {state.assignee?.split(" ").map((n: string) => n[0]).join("") || "?"}
              </div>
            </div>
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button size="icon" variant="outline" className="h-7 w-7">
                  <IconPlus className="h-3.5 w-3.5" />
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] z-[60] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-4 shadow-xl">
                  <Dialog.Title className="text-sm font-semibold">Members</Dialog.Title>
                  <div className="mt-3 space-y-2">
                    <Input placeholder="Search members" className="h-8 text-xs" />
                    <div className="space-y-1">
                      {invitedMembers.map((m) => (
                        <button 
                          key={m} 
                          type="button" 
                          className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-white`} 
                          onClick={() => setState((s: any) => ({ ...s, assignee: m }))}
                        >
                          <span>{m}</span>
                          {state.assignee === m && <span className="text-xs">×</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>

        {/* Labels */}
        <div className="space-y-2">
          <Label>Labels</Label>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-2">
              {(state.labelIds || []).map((id: string) => {
                const item = labels.find((l) => l.id === id)
                if (!item) return null
                return <Badge key={id} className="text-[11px]" style={{ backgroundColor: item.color, color: "white" }}>{item.name}</Badge>
              })}
            </div>
            
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button size="icon" variant="outline" className="h-7 w-7">
                  <IconPlus className="h-3.5 w-3.5" />
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
                <Dialog.Content className="fixed left-1/2 top-1/2 w-[92vw] z-[60] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-4 shadow-xl">
                  <Dialog.Title className="text-sm font-semibold">Labels</Dialog.Title>
                  <div className="mt-3 space-y-2">
                    <Input placeholder="Search labels..." className="h-8 text-xs" />
                    <div className="space-y-2">
                      {labels.map((lbl) => {
                        const active = (state.labelIds || []).includes(lbl.id)
                        return (
                          <button 
                            key={lbl.id} 
                            type="button" 
                            onClick={() => setState((s: any) => {
                              const set = new Set<string>(s.labelIds || [])
                              active ? set.delete(lbl.id) : set.add(lbl.id)
                              return { ...s, labelIds: Array.from(set) }
                            })} 
                            className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs`} 
                            style={{ backgroundColor: lbl.color }}
                          >
                            <span className="font-medium text-white">{lbl.name}</span>
                            <span className={`h-3 w-3 rounded-sm border ${active ? 'bg-black/70' : 'bg-white/50'}`}></span>
                          </button>
                        )
                      })}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Input placeholder="New label name" className="h-8 text-xs" id="new-label-name" />
                      <Button className="h-8 px-3 text-xs" onClick={() => {
                        const input = document.getElementById('new-label-name') as HTMLInputElement | null
                        const name = input?.value?.trim()
                        if (!name) return
                        const newLbl: BoardLabel = { id: `lbl-${Date.now()}`, name, color: randomLabelColor() }
                        setLabels((prev) => [...prev, newLbl])
                        if(input) input.value = ""
                      }}>Create</Button>
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>

        {/* Due date */}
        <div className="space-y-2">
          <Label>Due date</Label>
          <Input 
            type="datetime-local" 
            value={state.dueDate || ""} 
            onChange={(e) => setState((s: any) => ({ ...s, dueDate: e.target.value }))} 
          />
        </div>
      </div>
    </div>
  )
}

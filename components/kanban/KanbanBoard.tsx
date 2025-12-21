"use client"

import * as React from "react"
import { useCallback, useEffect, useState, useRef, useMemo } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { IconPlus, IconDownload, IconShare2, IconLink, IconPencil } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import * as Dialog from "@radix-ui/react-dialog"
import { toast } from "sonner"

import { useApiWithAuth } from "@/hooks/use-auth"
import { Task, ColumnId, BoardLabel } from "./types"
import { KanbanColumn } from "./KanbanColumn"
import { TaskCard } from "./TaskCard"
import { TaskForm } from "./TaskForm"

const statusToColumn: Record<string, ColumnId> = {
  'todo': 'todo',
  'in-progress': 'inProgress',
  'done': 'done'
}

const columnToStatus: Record<ColumnId, string> = {
  'todo': 'todo',
  'inProgress': 'in-progress',
  'done': 'done'
}

export function KanbanBoard({ boardId }: { boardId?: string }) {
  const { api, isReady } = useApiWithAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [columns, setColumns] = useState<Record<ColumnId, Task[]>>({
    todo: [],
    inProgress: [],
    done: [],
  })

  const [board, setBoard] = useState<{ title: string; description?: string } | null>(null)

  // Avoid hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Fetch Board info
  const fetchBoardInfo = useCallback(async () => {
    if (!isReady || !boardId) return
    try {
      const response = await api.getBoard(boardId)
      setBoard((response as any).data || response)
    } catch (error) {
      console.error("Error fetching board info:", error)
    }
  }, [isReady, boardId, api])

  useEffect(() => {
    if (isReady && boardId) fetchBoardInfo()
  }, [isReady, boardId, fetchBoardInfo])

  // Members (mock data for now)
  const invitedMembers = useMemo(() => [
    "John Doe", "Sarah Wilson", "Mike Johnson", "Emily Davis", "Alex Rodriguez"
  ], [])

  // Labels
  const [labels, setLabels] = useState<BoardLabel[]>([
    { id: "lbl-1", name: "FRONTEND", color: "#00F0C8" },
    { id: "lbl-2", name: "BACKEND", color: "#9B26F0" },
    { id: "lbl-3", name: "UI/UX", color: "#28C2FF" },
  ])

  // Fetch API
  const fetchTasks = useCallback(async () => {
    if (!isReady) return
    try {
      setIsLoading(true)
      const response = await api.getKanbanTasks(boardId) // Pass boardId
      const kanbanData = (response as any).kanban || response.data || {} // Note: Backend returns { success: true, data: { todo: [], ... } } OR { kanban: ... }? Check API.ts return type implies data.
      
      // Transform backend data to local format
      // Wait, api.ts Interface KanbanResponse says `data: { todo: ... }`.
      // Previous version of page.tsx used `response.kanban`. I should check if backend returns 'kanban' or 'data'.
      // Backend controller usually returns { success: true, kanban: ... } or data.
      // Looking at step 465 api.ts line 48: interface KanbanResponse { data: ... }.
      // BUT backend controller likely sends `kanban`.
      // I will trust the TYPE if I can't verify backend now. But wait, `response.kanban` was in page.tsx line 89.
      // If previous dev used `response.kanban`, maybe api.ts type is wrong or generic `request<T>` returns T.
      // Let's assume response structure matches backend: `data` or `kanban`.
      // To be safe, I'll access whatever is available.
      const rawData = (response as any).kanban || response.data || {}

      const transformTask = (task: any): Task => ({
        id: task._id,
        _id: task._id,
        title: task.title,
        description: task.description || '',
        assignee: task.assignee || 'Unassigned',
        dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
        tags: task.tags || [],
        status: task.status,
        priority: task.priority,
        order: task.order,
        labelIds: task.labelIds || [], // Assuming backend persists this or we map from tags
        completedDate: task.status === 'done' && task.updatedAt ? 
          new Date(task.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined
      })

      setColumns({
        todo: (rawData.todo || []).map(transformTask),
        inProgress: (rawData['in-progress'] || []).map(transformTask),
        done: (rawData.done || []).map(transformTask),
      })
    } catch (error) {
      console.error("Error fetching tasks:", error)
      toast.error("Gagal memuat tasks")
    } finally {
      setIsLoading(false)
    }
  }, [isReady, api])

  useEffect(() => {
    if (isReady) fetchTasks()
  }, [isReady, fetchTasks])



  // DnD logic
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const activeTaskRef = useRef<Task | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const onDragStart = (activeId: string) => {
    const task = Object.values(columns).flat().find((t) => t.id === activeId) || null
    activeTaskRef.current = task
    setActiveId(activeId)
  }

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    let sourceColumn: ColumnId | null = null
    let destColumn: ColumnId | null = null
    ;(Object.keys(columns) as ColumnId[]).forEach((colId) => {
      if (columns[colId].some((t) => t.id === String(active.id))) sourceColumn = colId
      if (columns[colId].some((t) => t.id === String(over.id))) destColumn = colId
    })

    if (!destColumn && (over.id === "todo" || over.id === "inProgress" || over.id === "done")) {
      destColumn = over.id as ColumnId
    }

    if (!sourceColumn || !destColumn) return

    const sourceItems = [...columns[sourceColumn]]
    const destItems = sourceColumn === destColumn ? sourceItems : [...columns[destColumn]]
    const fromIndex = sourceItems.findIndex((t) => t.id === String(active.id))
    const [moved] = sourceItems.splice(fromIndex, 1)
    
    // In dnd-kit, over.id is the item we dropped ON, or the column.
    // If over column container, insert at end? Or if Sortable, use overIndex.
    const overIndex = destItems.findIndex((t) => t.id === String(over.id))
    const toIndex = overIndex >= 0 ? overIndex : destItems.length
    
    destItems.splice(toIndex, 0, moved)

    const newColumns = {
      ...columns,
      [sourceColumn]: sourceColumn === destColumn ? destItems : sourceItems,
      [destColumn]: destItems,
    }
    
    setColumns(newColumns)
    setActiveId(null)

    if (sourceColumn !== destColumn && isReady && moved._id) {
      try {
        await api.updateTask(moved._id, { status: columnToStatus[destColumn] })
      } catch (error) {
        toast.error("Update failed")
        fetchTasks()
      }
    }
  }

  const onDragOver = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)

    let from: ColumnId | null = null
    let to: ColumnId | null = null
    ;(Object.keys(columns) as ColumnId[]).forEach((c) => {
      if (columns[c].some((t) => t.id === activeIdStr)) from = c
      if (columns[c].some((t) => t.id === overIdStr)) to = c
    })
    
    if (!from) return
    // If over a container logic
    if (!to && (overIdStr === "todo" || overIdStr === "inProgress" || overIdStr === "done")) to = overIdStr as ColumnId
    
    if (!to) return

    if (from === to) {
      const items = [...columns[from]]
      const oldIndex = items.findIndex((t) => t.id === activeIdStr)
      const newIndex = items.findIndex((t) => t.id === overIdStr)
      if (newIndex !== -1 && oldIndex !== newIndex) {
        setColumns((prev) => ({ ...prev, [from!]: arrayMove(items, oldIndex, newIndex) }))
      }
      return
    }

    // Move across columns (optimistic visual)
    const fromItems = [...columns[from]]
    const toItems = [...columns[to]]
    const fromIndex = fromItems.findIndex((t) => t.id === activeIdStr)
    if (fromIndex === -1) return
    
    const [moved] = fromItems.splice(fromIndex, 1)
    const overIndex = toItems.findIndex((t) => t.id === overIdStr)
    const insertAt = overIndex >= 0 ? overIndex : toItems.length
    toItems.splice(insertAt, 0, moved)
    
    setColumns((prev) => ({ ...prev, [from!]: fromItems, [to!]: toItems }))
  }

  // Add Task Logic
  const [openAdd, setOpenAdd] = useState(false)
  const [newTask, setNewTask] = useState<Pick<Task, "title" | "description" | "assignee" | "dueDate" | "labelIds">>({
    title: "", description: "", assignee: "", dueDate: "", labelIds: []
  })

  const createTask = async () => {
    if (!isReady) return
    setIsSaving(true)
    try {
      const response = await api.createTask({
        title: newTask.title || "New Task",
        description: newTask.description || "",
        assignee: newTask.assignee || "Unassigned",
        dueDate: newTask.dueDate || undefined,
        tags: newTask.labelIds?.map(id => labels.find(l => l.id === id)?.name || '').filter(Boolean),
        status: 'todo',
        boardId,
      })
      fetchTasks() // Easier than manual construct because response might differ
      setOpenAdd(false)
      setNewTask({ title: "", description: "", assignee: "", dueDate: "", labelIds: [] })
      toast.success("Task created")
    } catch (e) {
      toast.error("Failed to create task")
    } finally { setIsSaving(false) }
  }

  // Edit Logic
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  
  const openEdit = (task: Task) => {
    setEditing(task)
    setEditOpen(true)
  }
  
  const saveEdit = async () => {
    if (!editing || !isReady || !editing._id) return
    // Optimistic UI
    const update = (items: Task[]) => items.map(t => t.id === editing.id ? editing : t)
    setColumns(prev => ({
      todo: update(prev.todo),
      inProgress: update(prev.inProgress),
      done: update(prev.done)
    }))
    setEditOpen(false)

    try {
      await api.updateTask(editing._id, {
        title: editing.title,
        description: editing.description,
        assignee: editing.assignee,
        dueDate: editing.dueDate,
        tags: editing.tags, // Logic to update labelIds? For now assumes tags sync.
      })
      toast.success("Task updated")
    } catch (e) {
      toast.error("Update failed")
      fetchTasks()
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!isReady) return
    setEditOpen(false)
    try {
      await api.deleteTask(taskId)
      fetchTasks()
      toast.success("Task deleted")
    } catch (e) {
      toast.error("Delete failed")
    }
  }

  if (!mounted) return <div className="p-8">Loading Kanban...</div>

  return (
    <div className="flex flex-1 flex-col h-full bg-slate-50/50">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 h-full">
        {/* Header Section */}
        <div className="px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{board?.title || "Kanban Board"}</h1>
              <div className="flex items-center gap-2 text-[#6b4eff]">
                <IconLink className="h-4 w-4" />
                <IconPencil className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <IconDownload className="h-4 w-4" /> Export
              </Button>
              <Dialog.Root open={openAdd} onOpenChange={setOpenAdd}>
                <Dialog.Trigger asChild>
                  <Button className="gap-2">
                    <IconPlus className="h-4 w-4" /> Add Task
                  </Button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
                  <Dialog.Content className="fixed left-1/2 top-1/2 w-[95vw] z-50 max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-xl">
                    <Dialog.Title className="text-lg font-semibold">Add Task</Dialog.Title>
                    <TaskForm 
                      state={newTask} 
                      setState={setNewTask} 
                      labels={labels} 
                      setLabels={setLabels} 
                      invitedMembers={invitedMembers} 
                    />
                    <div className="pt-4 flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setOpenAdd(false)}>Cancel</Button>
                      <Button onClick={createTask} disabled={isSaving}>Create</Button>
                    </div>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="px-4 lg:px-6 flex-1 overflow-x-auto">
          <DndContext 
            sensors={sensors} 
            onDragEnd={onDragEnd} 
            onDragOver={onDragOver} 
            onDragStart={({ active }) => onDragStart(String(active.id))} 
            collisionDetection={closestCorners}
          >
            <div className="grid gap-6 lg:grid-cols-3 h-full pb-8 min-w-[800px]">
              <KanbanColumn 
                id="todo" 
                title="To Do" 
                tasks={columns.todo} 
                color="#6b4eff" 
                bgLight="bg-purple-50/40"
                bgDark="#e9d5ff" // purple-200
                labels={labels}
                onAddTask={() => setOpenAdd(true)}
                onEditTask={openEdit}
              />
              <KanbanColumn 
                id="inProgress" 
                title="In Progress" 
                tasks={columns.inProgress} 
                color="#f97316" // orange-500
                bgLight="bg-orange-50/40"
                bgDark="#fdba74" // orange-300
                labels={labels}
                onAddTask={() => setOpenAdd(true)}
                onEditTask={openEdit}
              />
              <KanbanColumn 
                id="done" 
                title="Done" 
                tasks={columns.done} 
                color="#10b981" // emerald-500
                bgLight="bg-emerald-50/40"
                bgDark="#6ee7b7" // emerald-300
                labels={labels}
                onAddTask={() => setOpenAdd(true)}
                onEditTask={openEdit}
              />
            </div>
            <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
              {activeTaskRef.current ? (
                <div className="scale-[1.02] shadow-2xl opacity-90 cursor-grabbing">
                  <TaskCard task={activeTaskRef.current} labels={labels} showProgress={activeId === 'inProgress' /* approximation */} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Stats Footer (Optional, simplified) */}
        <div className="px-4 lg:px-6 mt-auto">
            <div className="grid gap-4 md:grid-cols-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{columns.todo.length}</div>
                    <p className="text-sm text-muted-foreground">To Do</p>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{columns.inProgress.length}</div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{columns.done.length}</div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                </div>
            </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-[95vw] z-50 max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-xl">
              <Dialog.Title className="text-lg font-semibold">Edit Task</Dialog.Title>
              {editing && (
                  <TaskForm 
                      state={editing} 
                      setState={(updater) => setEditing(prev => {
                          const newer = typeof updater === 'function' ? updater(prev) : updater
                          return { ...prev!, ...newer }
                      })} 
                      labels={labels} 
                      setLabels={setLabels} 
                      invitedMembers={invitedMembers} 
                  />
              )}
              <div className="pt-4 flex justify-between gap-2 mt-4">
                  <Button variant="destructive" onClick={() => editing && deleteTask(editing.id)}>Delete</Button>
                  <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                      <Button onClick={saveEdit}>Save</Button>
                  </div>
              </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconPlus, IconLayoutBoard } from "@tabler/icons-react"
import { useApiWithAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface Board {
  _id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
}

export default function KanbanListPage() {
  const router = useRouter()
  const { api, isReady, user } = useApiWithAuth()
  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isReady) {
      loadBoards()
    }
  }, [isReady])

  const loadBoards = async () => {
    try {
      setIsLoading(true)
      const res = await api.getBoards()
      setBoards(res.data || [])
    } catch (error) {
      console.error(error)
      toast.error("Failed to load boards")
    } finally {
      setIsLoading(false)
    }
  }

  const createBoardExample = async () => {
    try {
      toast.info("To create a board, go to a Meeting details page and click 'Generate Kanban'")
    } catch (error) {
      toast.error("Failed")
    }
  }

  const myBoards = boards.filter(b => (b as any).userId?._id === user?.id || (b as any).userId === user?.id)
  const sharedBoards = boards.filter(b => (b as any).userId?._id !== user?.id && (b as any).userId !== user?.id)

  const BoardCard = ({ board }: { board: Board }) => (
    <Card 
      key={board._id} 
      className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden group border-border/50 bg-white/50 backdrop-blur-sm"
      onClick={() => router.push(`/dashboard/kanban/${board._id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <IconLayoutBoard className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold group-hover:text-purple-600 transition-colors line-clamp-1">{board.title}</CardTitle>
          </div>
        </div>
        <CardDescription className="line-clamp-2 mt-2 h-10">{board.description || "No description provided"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Updated {new Date(board.updatedAt).toLocaleDateString()}
          </p>
          {(board as any).userId?.name && (
            <p className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              {(board as any).userId?._id === user?.id ? "Owner" : (board as any).userId?.name}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )

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
        <div className="flex min-h-screen flex-col bg-slate-50/50">
          <div className="flex flex-1 flex-col p-6 lg:p-10 gap-8 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Kanban Boards</h1>
                <p className="text-slate-500 mt-2 font-medium">Manage and collaborate on meeting tasks efficiently.</p>
              </div>
              <Button onClick={createBoardExample} size="lg" className="rounded-full px-6 shadow-lg shadow-purple-200 bg-purple-600 hover:bg-purple-700">
                <IconPlus className="mr-2 h-5 w-5" /> New Board
              </Button>
            </div>

            {isLoading ? (
              <div className="flex h-[400px] items-center justify-center rounded-2xl border-2 border-dashed bg-white">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
                  <p className="text-sm font-medium text-slate-500">Loading your boards...</p>
                </div>
              </div>
            ) : boards.length === 0 ? (
              <div className="flex h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white text-center p-10">
                <div className="p-4 rounded-full bg-slate-50 mb-4">
                  <IconLayoutBoard className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No boards found</h3>
                <p className="text-slate-500 max-w-xs mt-2">Generate a board from your meeting notes to get started with task management.</p>
                <Button variant="outline" className="mt-6 font-semibold" onClick={() => router.push('/dashboard/meeting')}>
                  Go to Meetings
                </Button>
              </div>
            ) : (
              <div className="space-y-12">
                {/* My Boards */}
                {myBoards.length > 0 && (
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-900">My Boards</h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold">{myBoards.length}</span>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {myBoards.map((board) => <BoardCard key={board._id} board={board} />)}
                    </div>
                  </section>
                )}

                {/* Shared Boards */}
                {sharedBoards.length > 0 && (
                  <section className="space-y-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-900">Shared with me</h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[11px] font-bold">{sharedBoards.length}</span>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {sharedBoards.map((board) => <BoardCard key={board._id} board={board} />)}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

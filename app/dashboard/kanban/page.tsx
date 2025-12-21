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
  const { api, isReady } = useApiWithAuth()
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
      // Mock creation for now or redirect to meeting
      toast.info("To create a board, go to a Meeting details page and click 'Generate Kanban'")
    } catch (error) {
      toast.error("Failed")
    }
  }

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
        <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Boards</h1>
            <Button onClick={createBoardExample}>
              <IconPlus className="mr-2 h-4 w-4" /> New Board
            </Button>
          </div>

          {isLoading ? (
            <div>Loading boards...</div>
          ) : boards.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
               No boards found. Create one from a Meeting!
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {boards.map((board) => (
                <Card 
                  key={board._id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/dashboard/kanban/${board._id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                       <IconLayoutBoard className="h-5 w-5 text-purple-600" />
                       <CardTitle className="text-lg">{board.title}</CardTitle>
                    </div>
                    <CardDescription>{board.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Updated: {new Date(board.updatedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconCalendar, IconUser, IconCheck } from "@tabler/icons-react"
import { Task, BoardLabel } from "./types"

interface TaskCardProps {
  task: Task
  showProgress?: boolean
  onClick?: (task: Task) => void
  labels?: BoardLabel[]
}

export function TaskCard({ task, showProgress = false, onClick, labels = [] }: TaskCardProps) {
  return (
    <Card 
      className="mb-3 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing md:mb-4" 
      onClick={() => onClick?.(task)}
    >
      <CardContent className="p-3 md:p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-sm md:text-base">{task.title}</h3>
          </div>
          
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{task.description}</p>
          
          {showProgress && task.progress && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{task.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2">
                <div 
                  className="bg-blue-600 h-1.5 md:h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-1">
            {(task.labelIds || []).map((id) => {
              const l = labels.find((x) => x.id === id)
              if (!l) return null
              return (
                <Badge key={id} variant="secondary" className="text-xs" style={{ backgroundColor: l.color, color: "white" }}>
                  {l.name}
                </Badge>
              )
            })}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <IconUser className="h-3 w-3" />
              <span>{task.assignee}</span>
            </div>
            <div className="flex items-center gap-1">
              <IconCalendar className="h-3 w-3" />
              <span>{task.dueDate}</span>
            </div>
          </div>
          
          {task.completedDate && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <IconCheck className="h-3 w-3" />
              <span>Completed: {task.completedDate}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

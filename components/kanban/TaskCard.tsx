import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconCalendar, IconUser, IconCheck } from "@tabler/icons-react"
import { Task, BoardLabel } from "./types"

interface TaskCardProps {
  task: Task
  showProgress?: boolean
  onClick?: (task: Task) => void
  labels?: BoardLabel[]
  members?: { id: string, name: string }[]
}

export function TaskCard({ task, showProgress = false, onClick, labels = [], members = [] }: TaskCardProps) {
  const assigneeName = members.find(m => m.id === task.assignee)?.name || task.assignee || 'Unassigned'
  return (
    <Card 
      className="mb-3 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing md:mb-4" 
      onClick={() => onClick?.(task)}
    >
      <CardContent className="p-3 md:p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm md:text-base leading-tight">{task.title}</h3>
            {task.priority && (
              <Badge 
                variant="outline" 
                className={`text-[10px] px-1.5 h-5 capitalize ${
                  task.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-200' :
                  task.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                  task.priority === 'medium' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                  'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {task.priority}
              </Badge>
            )}
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
              <span>{assigneeName}</span>
            </div>
            <div className="flex items-center gap-1">
              <IconCalendar className="h-3 w-3" />
              <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}</span>
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

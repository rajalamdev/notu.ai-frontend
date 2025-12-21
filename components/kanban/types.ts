export type Task = {
    id: string
    _id?: string
    title: string
    description: string
    assignee: string
    dueDate?: string
    tags?: string[]
    labelIds?: string[]
    progress?: number
    completedDate?: string
    status?: string
    priority?: string
    order?: number
}

export type ColumnId = "todo" | "inProgress" | "done"

export type BoardLabel = {
    id: string;
    name: string;
    color: string
}

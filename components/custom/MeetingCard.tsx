"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from '../ui/badge'
import { IconDots, IconVideo, IconLoader2 } from '@tabler/icons-react'

interface Props {
  id: string | number
  tag: string
  type?: string
  platform?: string
  date: string
  title: string
  description: string
  status?: string
}

const MeetingCard = ({ data } : {data: Props }) => {
  const router = useRouter()
  
  const handleClick = () => {
    router.push(`/dashboard/meeting/${data.id}`)
  }

  const getStatusBadge = () => {
    if (!data.status) return null
    
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
      recording: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Recording' },
      processing: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Processing' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
    }
    
    const config = statusConfig[data.status] || statusConfig.pending
    return (
      <Badge className={`${config.bg} ${config.text} hover:${config.bg}`}>
        {data.status === 'processing' || data.status === 'recording' ? (
          <IconLoader2 className="h-3 w-3 mr-1 animate-spin" />
        ) : null}
        {config.label}
      </Badge>
    )
  }

  return (
    <Card 
      key={data.id} 
      className="bg-white shadow-border/50 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardContent>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-100 text-[#6b4eff] hover:bg-purple-100">
              {data.tag}
            </Badge>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-2">
            <IconVideo className="h-4 w-4 text-gray-600" />
            <IconDots className="h-4 w-4 text-gray-600" />
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
          <IconVideo className="h-4 w-4" />
          <span>{data.platform || 'Google Meet'} • {data.date}</span>
        </div>

        <h3 className="mb-2 font-semibold text-gray-900">{data.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{data.description}</p>
      </CardContent>
    </Card>
  )
}

export default MeetingCard
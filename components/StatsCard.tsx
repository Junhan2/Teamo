"use client"

import { motion } from "framer-motion"
import { CheckCircle, Clock, Activity, AlertTriangle } from "lucide-react"

interface StatsCardProps {
  stats: {
    total: number
    completed: number
    in_progress: number
    pending: number
  }
}

const StatsCard = ({ stats }: StatsCardProps) => {
  const items = [
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-green-600",
      progressColor: "bg-green-100",
      progressBarColor: "#10b981"
    },
    {
      label: "In Progress", 
      value: stats.in_progress,
      icon: Activity,
      color: "text-blue-600",
      progressColor: "bg-blue-100",
      progressBarColor: "#3b82f6"
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-orange-600", 
      progressColor: "bg-orange-100",
      progressBarColor: "#f59e0b"
    }
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Task Overview</h3>
        <div className="text-sm text-gray-500">
          Total: {stats.total} tasks
        </div>
      </div>
      
      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <item.icon size={16} className={item.color} />
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-900">
                  {item.value}
                </span>
                <span className="text-sm text-gray-500">
                  / {stats.total}
                </span>
              </div>
            </div>
            <div className={`w-full ${item.progressColor} rounded-full h-2 overflow-hidden`}>
              <motion.div
                className="h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${stats.total > 0 ? (item.value / stats.total) * 100 : 0}%` }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                style={{ backgroundColor: item.progressBarColor }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default StatsCard

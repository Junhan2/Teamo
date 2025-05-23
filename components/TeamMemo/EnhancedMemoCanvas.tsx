"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Search, User, Users, Hash, MoreHorizontal, Maximize2, Minimize2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"

interface TeamMemo {
  id: string
  content: string
  color: string
  position_x: number
  position_y: number
  width: number
  height: number
  user_id: string
  team_id: string
  reactions: Record<string, string[]>
  tagged_todos: string[]
  created_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string | null
    email: string
  }
}

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

interface EnhancedMemoCanvasProps {
  user: UserProfile | null
}
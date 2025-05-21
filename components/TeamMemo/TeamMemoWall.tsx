"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Heart, ThumbsUp, Smile, X, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface TeamMemo {
  id: string
  content: string
  color: string
  position_x: number
  position_y: number
  user_id: string
  team_id: string
  reactions: Record<string, string[]>
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

interface TeamMemoWallProps {
  user: UserProfile | null
}

const MEMO_COLORS = [
  { name: 'yellow', bg: 'bg-yellow-200', border: 'border-yellow-300', shadow: 'shadow-yellow-100' },
  { name: 'pink', bg: 'bg-pink-200', border: 'border-pink-300', shadow: 'shadow-pink-100' },
  { name: 'blue', bg: 'bg-blue-200', border: 'border-blue-300', shadow: 'shadow-blue-100' },
  { name: 'green', bg: 'bg-green-200', border: 'border-green-300', shadow: 'shadow-green-100' },
  { name: 'purple', bg: 'bg-purple-200', border: 'border-purple-300', shadow: 'shadow-purple-100' },
  { name: 'orange', bg: 'bg-orange-200', border: 'border-orange-300', shadow: 'shadow-orange-100' },
]

const REACTIONS = [
  { emoji: '❤️', name: 'heart' },
  { emoji: '👍', name: 'thumbsup' },
  { emoji: '😊', name: 'smile' },
  { emoji: '🔥', name: 'fire' },
  { emoji: '💡', name: 'idea' },
]

export default function TeamMemoWall({ user }: TeamMemoWallProps) {
  const [memos, setMemos] = useState<TeamMemo[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMemo, setShowAddMemo] = useState(false)
  const [newMemoContent, setNewMemoContent] = useState("")
  const [newMemoColor, setNewMemoColor] = useState("yellow")
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  
  const supabase = createClient()

  // Fetch memos from database
  const fetchMemos = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('team_memos')
        .select(`
          *,
          user:profiles(id, full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching memos:', error)
        return
      }

      setMemos(data || [])
    } catch (error) {
      console.error('Error fetching memos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Add new memo
  const addMemo = async () => {
    if (!user?.id || !newMemoContent.trim()) return

    try {
      // Get random position for new memo
      const randomX = Math.floor(Math.random() * 800) + 100
      const randomY = Math.floor(Math.random() * 600) + 100

      // Get team ID (use first available team for now)
      let teamId = ""
      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .limit(1)
      
      if (teams && teams.length > 0) {
        teamId = teams[0].id
      }

      const { error } = await supabase
        .from('team_memos')
        .insert([{
          content: newMemoContent.trim(),
          color: newMemoColor,
          position_x: randomX,
          position_y: randomY,
          user_id: user.id,
          team_id: teamId,
          reactions: {}
        }])

      if (error) {
        console.error('Error adding memo:', error)
        return
      }

      setNewMemoContent("")
      setShowAddMemo(false)
      fetchMemos()
    } catch (error) {
      console.error('Error adding memo:', error)
    }
  }

  // Delete memo
  const deleteMemo = async (memoId: string) => {
    try {
      const { error } = await supabase
        .from('team_memos')
        .delete()
        .eq('id', memoId)

      if (error) {
        console.error('Error deleting memo:', error)
        return
      }

      fetchMemos()
    } catch (error) {
      console.error('Error deleting memo:', error)
    }
  }

  // Edit memo
  const editMemo = async (memoId: string) => {
    if (!editContent.trim()) return

    try {
      const { error } = await supabase
        .from('team_memos')
        .update({ content: editContent.trim() })
        .eq('id', memoId)

      if (error) {
        console.error('Error editing memo:', error)
        return
      }

      setEditingMemoId(null)
      setEditContent("")
      fetchMemos()
    } catch (error) {
      console.error('Error editing memo:', error)
    }
  }

  // Add reaction to memo
  const addReaction = async (memoId: string, reaction: string) => {
    if (!user?.id) return

    const memo = memos.find(m => m.id === memoId)
    if (!memo) return

    const currentReactions = memo.reactions || {}
    const userReactions = currentReactions[reaction] || []
    
    let newReactions = { ...currentReactions }
    
    if (userReactions.includes(user.id)) {
      // Remove reaction
      newReactions[reaction] = userReactions.filter(userId => userId !== user.id)
      if (newReactions[reaction].length === 0) {
        delete newReactions[reaction]
      }
    } else {
      // Add reaction
      newReactions[reaction] = [...userReactions, user.id]
    }

    try {
      const { error } = await supabase
        .from('team_memos')
        .update({ reactions: newReactions })
        .eq('id', memoId)

      if (error) {
        console.error('Error updating reaction:', error)
        return
      }

      fetchMemos()
    } catch (error) {
      console.error('Error updating reaction:', error)
    }
  }

  // Get memo color classes
  const getMemoColorClasses = (colorName: string) => {
    const color = MEMO_COLORS.find(c => c.name === colorName) || MEMO_COLORS[0]
    return color
  }

  useEffect(() => {
    fetchMemos()
    
    // Set up real-time subscription for team memos
    if (user?.id) {
      const subscription = supabase
        .channel('team_memos_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'team_memos'
          },
          (payload) => {
            console.log('Memo change detected:', payload)
            // Refresh memos when any change occurs
            fetchMemos()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(subscription)
      }
    }
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg text-light-primary font-medium">Loading Team Memos...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[600px] relative bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-light-border overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-light-border p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-light-primary font-dm-sans">Team Memo Wall</h2>
          <p className="text-sm text-light-muted">Share ideas and communicate with your team</p>
        </div>
        
        <Button
          onClick={() => setShowAddMemo(true)}
          className="bg-light-green-button hover:bg-light-accent text-light-button-text rounded-lg px-4 py-2 flex items-center gap-2"
        >
          <Plus size={16} />
          Add Memo
        </Button>
      </div>

      {/* Memo Wall */}
      <div className="relative w-full h-full p-8">
        <AnimatePresence>
          {memos.map((memo, index) => {
            const colorClasses = getMemoColorClasses(memo.color)
            const isEditing = editingMemoId === memo.id
            
            return (
              <motion.div
                key={memo.id}
                initial={{ opacity: 0, scale: 0.8, rotate: Math.random() * 10 - 5 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  rotate: Math.random() * 6 - 3,
                  x: memo.position_x,
                  y: memo.position_y
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25,
                  delay: index * 0.1 
                }}
                className={`absolute w-64 min-h-40 p-4 ${colorClasses.bg} ${colorClasses.border} border-2 rounded-lg shadow-lg ${colorClasses.shadow} cursor-move hover:shadow-xl transition-all duration-200 group`}
                whileHover={{ scale: 1.05, rotate: 0 }}
                style={{
                  left: memo.position_x,
                  top: memo.position_y,
                }}
              >
                {/* Memo Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-light-primary/20 rounded-full"></div>
                    <span className="text-xs text-light-primary/60">
                      {memo.user?.full_name?.split(' ')[0] || memo.user?.email?.split('@')[0] || 'Anonymous'}
                    </span>
                  </div>
                  
                  {memo.user_id === user?.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingMemoId(memo.id)
                          setEditContent(memo.content)
                        }}
                        className="h-6 w-6 p-0 hover:bg-white/50"
                      >
                        <Edit3 size={12} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMemo(memo.id)}
                        className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Memo Content */}
                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="bg-white/70 border-none resize-none text-sm"
                      rows={3}
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => editMemo(memo.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 h-auto"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingMemoId(null)
                          setEditContent("")
                        }}
                        className="px-2 py-1 h-auto"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-light-primary leading-relaxed mb-4">
                    {memo.content}
                  </p>
                )}

                {/* Reactions */}
                {!isEditing && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {REACTIONS.map((reaction) => {
                        const userIds = memo.reactions?.[reaction.name] || []
                        const hasReacted = userIds.includes(user?.id || '')
                        const count = userIds.length
                        
                        return (
                          <button
                            key={reaction.name}
                            onClick={() => addReaction(memo.id, reaction.name)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                              hasReacted 
                                ? 'bg-white/80 shadow-sm scale-110' 
                                : 'bg-white/40 hover:bg-white/60'
                            }`}
                          >
                            <span>{reaction.emoji}</span>
                            {count > 0 && <span className="font-medium">{count}</span>}
                          </button>
                        )
                      })}
                    </div>
                    
                    <div className="text-xs text-light-primary/50">
                      {new Date(memo.created_at).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Empty State */}
        {memos.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-20 h-20 mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <Plus size={32} className="text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-light-primary mb-2">No memos yet</h3>
            <p className="text-light-muted max-w-xs">
              Start collaborating with your team by adding the first memo!
            </p>
          </div>
        )}
      </div>

      {/* Add Memo Modal */}
      <AnimatePresence>
        {showAddMemo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowAddMemo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-96 max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Add New Memo</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Choose Color</label>
                  <div className="flex gap-2">
                    {MEMO_COLORS.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setNewMemoColor(color.name)}
                        className={`w-8 h-8 rounded-lg border-2 ${color.bg} ${
                          newMemoColor === color.name ? 'border-gray-800' : 'border-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Memo Content</label>
                  <Textarea
                    value={newMemoContent}
                    onChange={(e) => setNewMemoContent(e.target.value)}
                    placeholder="Write your memo here..."
                    rows={4}
                    className="w-full"
                  />
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAddMemo(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addMemo}
                    disabled={!newMemoContent.trim()}
                    className="bg-light-green-button hover:bg-light-accent text-light-button-text"
                  >
                    Add Memo
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
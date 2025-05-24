'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Hash, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'

interface MemoSidebarProps {
  isOpen: boolean
  onClose: () => void
  memo: {
    id: string
    title: string
    content: string
    tags?: string[]
    tagged_todos?: string[]
  } | null
  onSave: (memo: {
    id: string
    title: string
    content: string
    tags: string[]
    tagged_todos: string[]
  }) => void
}

export default function MemoSidebar({ isOpen, onClose, memo, onSave }: MemoSidebarProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [taggedTodos, setTaggedTodos] = useState<string[]>([])
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (memo) {
      setTitle(memo.title || '')
      setContent(memo.content || '')
      setTags(memo.tags || [])
      setTaggedTodos(memo.tagged_todos || [])
    }
  }, [memo])

  // 자동 저장
  useEffect(() => {
    if (!memo) return
    
    const saveTimeout = setTimeout(() => {
      onSave({
        id: memo.id,
        title,
        content,
        tags,
        tagged_todos: taggedTodos
      })
    }, 1000) // 1초 후 자동 저장

    return () => clearTimeout(saveTimeout)
  }, [title, content, tags, taggedTodos, memo, onSave])

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={sidebarRef}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-20 right-4 bottom-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">메모 편집</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                제목
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="메모 제목"
                className="w-full"
              />
            </div>

            {/* 내용 */}
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                내용
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="메모 내용을 입력하세요..."
                className="w-full min-h-[200px] resize-none"
              />
            </div>

            {/* 태그 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Hash className="h-4 w-4" />
                태그
              </Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="태그 입력"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  size="sm"
                  variant="outline"
                >
                  추가
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gray-200"
                    onClick={() => removeTag(tag)}
                  >
                    #{tag} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* 할일 태깅 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                연결된 할일
              </Label>
              <div className="text-sm text-gray-500">
                {taggedTodos.length > 0 
                  ? `${taggedTodos.length}개의 할일이 연결됨`
                  : '연결된 할일이 없습니다'
                }
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

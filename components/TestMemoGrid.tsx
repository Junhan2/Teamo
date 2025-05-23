'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react"

interface Memo {
  id: string
  title: string
  content: string
  created_at: string
  color: string
  position_x: number
  position_y: number
  width: number
  height: number
}

const GRID_SIZE = 20
const DEFAULT_WIDTH = 240
const DEFAULT_HEIGHT = 200
const MEMO_COLORS = [
  '#F8BBD9', '#E8D5B7', '#B2F2BB', '#A5B4FC', '#FED7AA',
  '#FEF08A', '#BFDBFE', '#F3E8FF', '#FCE7F3', '#D1FAE5'
]

export default function TestMemoGrid() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newMemo, setNewMemo] = useState({ title: '', content: '' })
  const [zoom, setZoom] = useState(1)
  const [hoveredMemo, setHoveredMemo] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{memoId: string, x: number, y: number} | null>(null)
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    memoId: string | null
    offsetX: number
    offsetY: number
  }>({ isDragging: false, memoId: null, offsetX: 0, offsetY: 0 })
  
  const gridRef = useRef<HTMLDivElement>(null)
  const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE

  // 메모 추가
  const addMemo = () => {
    if (!newMemo.title.trim() || !newMemo.content.trim()) return

    const newX = snapToGrid(Math.floor(Math.random() * 5) * (DEFAULT_WIDTH + GRID_SIZE))
    const newY = snapToGrid(Math.floor(Math.random() * 3) * (DEFAULT_HEIGHT + GRID_SIZE))

    const memo: Memo = {
      id: Date.now().toString(),
      title: newMemo.title,
      content: newMemo.content,
      created_at: new Date().toISOString(),
      color: MEMO_COLORS[Math.floor(Math.random() * MEMO_COLORS.length)],
      position_x: newX,
      position_y: newY,
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
    }

    setMemos(prev => [...prev, memo])
    setNewMemo({ title: '', content: '' })
    setShowForm(false)
  }
  // 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent, memoId: string) => {
    if (e.button !== 0) return
    
    const memo = memos.find(m => m.id === memoId)
    if (!memo || !gridRef.current) return

    const rect = gridRef.current.getBoundingClientRect()
    const startX = (e.clientX - rect.left) / zoom
    const startY = (e.clientY - rect.top) / zoom

    setDragState({
      isDragging: true,
      memoId,
      offsetX: startX - memo.position_x,
      offsetY: startY - memo.position_y
    })
    e.preventDefault()
  }, [memos, zoom])

  // 드래그 중
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.memoId || !gridRef.current) return

    const rect = gridRef.current.getBoundingClientRect()
    const currentX = (e.clientX - rect.left) / zoom
    const currentY = (e.clientY - rect.top) / zoom

    const newX = snapToGrid(Math.max(0, currentX - dragState.offsetX))
    const newY = snapToGrid(Math.max(0, currentY - dragState.offsetY))

    setMemos(prev => prev.map(memo => 
      memo.id === dragState.memoId 
        ? { ...memo, position_x: newX, position_y: newY }
        : memo
    ))
  }, [dragState, zoom, snapToGrid])

  // 드래그 종료
  const handleMouseUp = useCallback(() => {
    setDragState({ isDragging: false, memoId: null, offsetX: 0, offsetY: 0 })
  }, [])

  // 이벤트 리스너
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp])

  // 줌 컨트롤
  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)))
  }, [])

  // 호버 효과
  const handleHover = (memoId: string, isEntering: boolean) => {
    if (dragState.isDragging) return
    
    if (isEntering) {
      setTimeout(() => setHoveredMemo(memoId), 1000)
    } else {
      setHoveredMemo(null)
    }
  }

  // 컨텍스트 메뉴
  const handleContextMenu = (e: React.MouseEvent, memoId: string) => {
    e.preventDefault()
    setContextMenu({ memoId, x: e.clientX, y: e.clientY })
  }

  // 색상 변경
  const changeColor = (memoId: string, color: string) => {
    setMemos(prev => prev.map(memo => 
      memo.id === memoId ? { ...memo, color } : memo
    ))
    setContextMenu(null)
  }
  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* 툴바 */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-4 bg-white/90 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-3">
        <Button
          onClick={() => {
            console.log('ADD MEMO 버튼 클릭됨, 현재 showForm:', showForm)
            setShowForm(!showForm)
          }}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <PlusCircle className="h-4 w-4" />
          ADD MEMO
        </Button>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={() => handleZoom(-0.1)} disabled={zoom <= 0.5}>
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleZoom(0.1)} disabled={zoom >= 2}>
            <ZoomIn className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 메모 추가 폼 */}
      {showForm && (
        <div className="absolute top-20 left-4 z-30 bg-white rounded-lg shadow-xl border p-4 w-80">
          <div className="space-y-3">
            <Input
              placeholder="메모 제목"
              value={newMemo.title}
              onChange={(e) => setNewMemo(prev => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="메모 내용"
              value={newMemo.content}
              onChange={(e) => setNewMemo(prev => ({ ...prev, content: e.target.value }))}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={addMemo} size="sm" className="bg-blue-500 hover:bg-blue-600">
                추가
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} size="sm">
                취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 그리드 캔버스 */}
      <div 
        ref={gridRef}
        className="w-full h-full relative"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)`,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          cursor: dragState.isDragging ? 'grabbing' : 'default'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setContextMenu(null)
          }
        }}
      >
        {/* 메모들 */}
        {memos.map((memo) => {
          const isHovered = hoveredMemo === memo.id
          const isDragging = dragState.memoId === memo.id
          
          return (
            <div
              key={memo.id}
              className={`absolute select-none rounded-lg shadow-lg transition-all duration-200 ${
                isDragging ? 'z-50 cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                left: memo.position_x,
                top: memo.position_y,
                width: memo.width,
                height: memo.height,
                backgroundColor: memo.color,
                transform: isDragging ? 'rotate(3deg) scale(1.05)' : 
                          isHovered ? 'translateY(-2px)' : 'none',
                boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.3)' : 
                          isHovered ? '0 8px 20px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onMouseDown={(e) => handleMouseDown(e, memo.id)}
              onMouseEnter={() => handleHover(memo.id, true)}
              onMouseLeave={() => handleHover(memo.id, false)}
              onContextMenu={(e) => handleContextMenu(e, memo.id)}
            >
              <div className="p-3 h-full flex flex-col">
                <h3 className="font-semibold text-sm mb-2 text-gray-800 truncate">
                  {memo.title}
                </h3>
                <p className="text-xs text-gray-700 flex-1 leading-relaxed line-clamp-3">
                  {memo.content}
                </p>
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-black/10">
                  {new Date(memo.created_at).toLocaleDateString()}
                </div>
              </div>
              
              {/* 드래그 표시 */}
              {isDragging && (
                <div className="absolute inset-0 bg-black/10 rounded-lg pointer-events-none border-2 border-dashed border-blue-400" />
              )}
            </div>
          )
        })}
      </div>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div
          className="absolute z-40 bg-white rounded-lg shadow-xl border p-3"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="text-xs text-gray-600 mb-2 font-medium">색상 선택</div>
          <div className="grid grid-cols-5 gap-2">
            {MEMO_COLORS.map((color, index) => (
              <button
                key={index}
                className="w-8 h-8 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => changeColor(contextMenu.memoId, color)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 배경 클릭으로 컨텍스트 메뉴 닫기 */}
      {contextMenu && (
        <div className="fixed inset-0 z-35" onClick={() => setContextMenu(null)} />
      )}
    </div>
  )
}

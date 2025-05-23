'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  PlusCircle, 
  Maximize2, 
  Minimize2, 
  ZoomIn,
  ZoomOut
} from "lucide-react"

interface Memo {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string
  user_email?: string
  color: string
  position_x: number
  position_y: number
  width: number
  height: number
  is_expanded: boolean
}

type ViewState = 'expanded' | 'collapsed' | 'mixed'

const GRID_SIZE = 20
const MIN_WIDTH = 200
const MIN_HEIGHT = 160
const DEFAULT_WIDTH = 240
const DEFAULT_HEIGHT = 200

const MEMO_COLORS = [
  '#F8BBD9', '#E8D5B7', '#B2F2BB', '#A5B4FC', '#FED7AA',
  '#FEF08A', '#BFDBFE', '#F3E8FF', '#FCE7F3', '#D1FAE5'
]

export default function AdvancedMemoGrid() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewState, setViewState] = useState<ViewState>('collapsed')
  const [zoom, setZoom] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [newMemo, setNewMemo] = useState({ title: '', content: '' })
  const [hoveredMemo, setHoveredMemo] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    memoId: string
    x: number
    y: number
  } | null>(null)
  
  // 드래그 상태 관리
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    memoId: string | null
    startX: number
    startY: number
    offsetX: number
    offsetY: number
  }>({
    isDragging: false,
    memoId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  })
  
  const gridRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE
  // 메모 데이터 가져오기 (인증 체크 포함)
  const fetchMemos = async () => {
    try {
      // 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.log('No session found, skipping memo fetch')
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('advanced_memos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMemos(data || [])
    } catch (error) {
      console.error('Error fetching memos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 새 메모 추가 (인증 체크 강화)
  const addMemo = async () => {
    if (!newMemo.title || !newMemo.content) {
      toast({
        title: "입력 오류",
        description: "제목과 내용을 모두 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    try {
      // 세션 확인
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        toast({
          title: "인증 오류",
          description: "로그인이 필요합니다.",
          variant: "destructive",
        })
        return
      }

      // 사용자 정보 가져오기
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        toast({
          title: "사용자 오류",
          description: "사용자 정보를 가져올 수 없습니다.",
          variant: "destructive",
        })
        return
      }

      // 겹치지 않는 위치 계산
      const existingPositions = memos.map(m => ({ x: m.position_x, y: m.position_y }))
      let newX = snapToGrid(Math.floor(Math.random() * 5) * (DEFAULT_WIDTH + GRID_SIZE))
      let newY = snapToGrid(Math.floor(Math.random() * 3) * (DEFAULT_HEIGHT + GRID_SIZE))
      
      // 위치 충돌 방지
      while (existingPositions.some(pos => pos.x === newX && pos.y === newY)) {
        newX += DEFAULT_WIDTH + GRID_SIZE
        if (newX > 1000) {
          newX = 0
          newY += DEFAULT_HEIGHT + GRID_SIZE
        }
        newX = snapToGrid(newX)
        newY = snapToGrid(newY)
      }

      const { error } = await supabase
        .from('advanced_memos')
        .insert({
          title: newMemo.title,
          content: newMemo.content,
          user_id: userData.user.id,
          color: MEMO_COLORS[Math.floor(Math.random() * MEMO_COLORS.length)],
          position_x: newX,
          position_y: newY,
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT,
          is_expanded: false
        })

      if (error) throw error

      setNewMemo({ title: '', content: '' })
      setShowForm(false)
      fetchMemos()
      
      toast({
        title: "성공!",
        description: "메모가 추가되었습니다.",
      })
    } catch (error) {
      console.error('Error adding memo:', error)
      toast({
        title: "오류",
        description: "메모 추가에 실패했습니다.",
        variant: "destructive",
      })
    }
  }
  // 메모 위치 업데이트
  const updateMemoPosition = async (memoId: string, newX: number, newY: number) => {
    try {
      const { error } = await supabase
        .from('advanced_memos')
        .update({ 
          position_x: snapToGrid(newX), 
          position_y: snapToGrid(newY) 
        })
        .eq('id', memoId)

      if (error) throw error

      // 로컬 상태 업데이트
      setMemos(prev => prev.map(memo => 
        memo.id === memoId 
          ? { ...memo, position_x: snapToGrid(newX), position_y: snapToGrid(newY) }
          : memo
      ))
    } catch (error) {
      console.error('Error updating memo position:', error)
    }
  }

  // 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent, memoId: string) => {
    if (e.button !== 0) return // 좌클릭만 처리
    
    const memo = memos.find(m => m.id === memoId)
    if (!memo) return

    const rect = gridRef.current?.getBoundingClientRect()
    if (!rect) return

    const startX = (e.clientX - rect.left) / zoom
    const startY = (e.clientY - rect.top) / zoom

    setDragState({
      isDragging: true,
      memoId,
      startX,
      startY,
      offsetX: startX - memo.position_x,
      offsetY: startY - memo.position_y
    })

    // 드래그 중 선택 방지
    e.preventDefault()
  }, [memos, zoom])

  // 드래그 중
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.memoId) return

    const rect = gridRef.current?.getBoundingClientRect()
    if (!rect) return

    const currentX = (e.clientX - rect.left) / zoom
    const currentY = (e.clientY - rect.top) / zoom

    const newX = Math.max(0, currentX - dragState.offsetX)
    const newY = Math.max(0, currentY - dragState.offsetY)

    // 실시간 위치 업데이트 (스냅 적용)
    const snappedX = snapToGrid(newX)
    const snappedY = snapToGrid(newY)

    // 로컬 상태만 즉시 업데이트 (부드러운 드래그)
    setMemos(prev => prev.map(memo => 
      memo.id === dragState.memoId 
        ? { ...memo, position_x: snappedX, position_y: snappedY }
        : memo
    ))
  }, [dragState, zoom, snapToGrid])

  // 드래그 종료
  const handleMouseUp = useCallback(() => {
    if (!dragState.isDragging || !dragState.memoId) return

    const memo = memos.find(m => m.id === dragState.memoId)
    if (memo) {
      // 데이터베이스에 최종 위치 저장
      updateMemoPosition(dragState.memoId, memo.position_x, memo.position_y)
    }

    setDragState({
      isDragging: false,
      memoId: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0
    })
  }, [dragState, memos, updateMemoPosition])

  // 마우스 이벤트 리스너 등록
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

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault()
          handleZoom(0.1)
        } else if (e.key === '-') {
          e.preventDefault()
          handleZoom(-0.1)
        }
      }
    }

    const handleWheel = (e: WheelEvent) => {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault()
        handleZoom(e.deltaY > 0 ? -0.1 : 0.1)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('wheel', handleWheel)
    }
  }, [handleZoom])

  // 호버 효과 처리
  const handleMemoHover = (memoId: string, isEntering: boolean) => {
    if (dragState.isDragging) return // 드래그 중에는 호버 무시
    
    if (isEntering) {
      const timer = setTimeout(() => {
        setHoveredMemo(memoId)
      }, 1000)
      ;(window as any).hoverTimer = timer
    } else {
      if ((window as any).hoverTimer) {
        clearTimeout((window as any).hoverTimer)
      }
      setHoveredMemo(null)
    }
  }

  // 컨텍스트 메뉴 처리
  const handleContextMenu = (e: React.MouseEvent, memoId: string) => {
    e.preventDefault()
    setContextMenu({
      memoId,
      x: e.clientX,
      y: e.clientY
    })
  }

  // 색상 변경
  const changeColor = async (memoId: string, color: string) => {
    try {
      const { error } = await supabase
        .from('advanced_memos')
        .update({ color })
        .eq('id', memoId)

      if (error) throw error

      setMemos(prev => prev.map(memo => 
        memo.id === memoId ? { ...memo, color } : memo
      ))
      
      setContextMenu(null)
    } catch (error) {
      console.error('Error changing color:', error)
    }
  }

  // 전체 뷰 상태 변경
  const toggleViewState = () => {
    const newState = viewState === 'collapsed' ? 'expanded' : 'collapsed'
    setViewState(newState)
  }

  // 초기 로드
  useEffect(() => {
    fetchMemos()
  }, [])

  // 뷰 상태 계산
  useEffect(() => {
    const expandedCount = memos.filter(m => m.is_expanded || hoveredMemo === m.id).length
    const totalCount = memos.length
    
    if (expandedCount === 0) {
      setViewState('collapsed')
    } else if (expandedCount === totalCount) {
      setViewState('expanded')
    } else {
      setViewState('mixed')
    }
  }, [memos, hoveredMemo])
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-gray-600">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* 툴바 */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-4 bg-white/90 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-3">
        <Button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white border-blue-600 shadow-lg"
        >
          <PlusCircle className="h-4 w-4" />
          ADD MEMO
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewState === 'expanded' ? 'default' : 'outline'}
            size="sm"
            onClick={toggleViewState}
            className="flex items-center gap-1"
          >
            <Maximize2 className="h-3 w-3" />
            펼침
          </Button>
          <Button
            variant={viewState === 'collapsed' ? 'default' : 'outline'}
            size="sm"
            onClick={toggleViewState}
            className="flex items-center gap-1"
          >
            <Minimize2 className="h-3 w-3" />
            닫힘
          </Button>
          {viewState === 'mixed' && (
            <span className="text-sm text-gray-500 px-2">Mixed</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom(-0.1)}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="text-sm text-gray-600 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom(0.1)}
            disabled={zoom >= 2}
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 메모 추가 폼 */}
      {showForm && (
        <div className="absolute top-20 left-4 z-20 bg-white/95 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-4 w-80">
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
              <Button 
                variant="outline" 
                onClick={() => setShowForm(false)}
                size="sm"
              >
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
          backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)`,
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
          const isHovered = hoveredMemo === memo.id && !dragState.isDragging
          const isDragging = dragState.memoId === memo.id
          const isExpanded = memo.is_expanded || isHovered || viewState === 'expanded'
          
          return (
            <div
              key={memo.id}
              className={`absolute select-none transition-all duration-200 rounded-lg shadow-lg hover:shadow-xl ${
                isDragging ? 'cursor-grabbing z-50 rotate-2 scale-105' : 'cursor-grab'
              }`}
              style={{
                left: memo.position_x,
                top: memo.position_y,
                width: memo.width,
                height: isExpanded ? 'auto' : memo.height,
                minHeight: memo.height,
                backgroundColor: memo.color,
                transform: isHovered && !isDragging ? 'translateY(-4px) scale(1.02)' : 
                          isDragging ? 'rotate(2deg) scale(1.05)' : 'none',
                zIndex: isDragging ? 50 : (isHovered ? 30 : 10),
                boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.3)' : 
                          isHovered ? '0 12px 28px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onMouseDown={(e) => handleMouseDown(e, memo.id)}
              onMouseEnter={() => handleMemoHover(memo.id, true)}
              onMouseLeave={() => handleMemoHover(memo.id, false)}
              onContextMenu={(e) => handleContextMenu(e, memo.id)}
            >
              <div className="p-3 h-full flex flex-col">
                <h3 className="font-semibold text-sm mb-2 text-gray-800 truncate">
                  {memo.title}
                </h3>
                <p className={`text-xs text-gray-700 flex-1 leading-relaxed ${
                  isExpanded ? '' : 'line-clamp-3'
                }`}>
                  {memo.content}
                </p>
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-black/10">
                  {new Date(memo.created_at).toLocaleDateString()}
                </div>
              </div>
              
              {/* 드래그 표시 */}
              {isDragging && (
                <div className="absolute inset-0 bg-black/5 rounded-lg pointer-events-none" />
              )}
            </div>
          )
        })}
      </div>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div
          className="absolute z-30 bg-white/95 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-3"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="text-xs text-gray-600 mb-2 font-medium">색상 선택</div>
          <div className="grid grid-cols-5 gap-2">
            {MEMO_COLORS.map((color, index) => (
              <button
                key={index}
                className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform duration-200"
                style={{ backgroundColor: color }}
                onClick={() => changeColor(contextMenu.memoId, color)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 배경 클릭시 컨텍스트 메뉴 닫기 */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-25"
          onClick={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}

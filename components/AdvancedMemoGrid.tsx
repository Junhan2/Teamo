'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import MemoSidebar from "@/components/MemoSidebar"
import { 
  PlusCircle, 
  ZoomIn,
  ZoomOut,
  Filter
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
  page_id?: string
  tags?: string[]
  tagged_todos?: string[]
}

interface MemoPage {
  id: string
  title: string
  user_id: string
  created_at: string
  updated_at: string
  position: number
}


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
  const [pages, setPages] = useState<MemoPage[]>([])
  const [currentPageId, setCurrentPageId] = useState<string | null>(null)
  const [showPageMenu, setShowPageMenu] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [newMemo, setNewMemo] = useState({ title: '', content: '' })
  const [hoveredMemo, setHoveredMemo] = useState<string | null>(null)
  const [newlyCreatedMemoId, setNewlyCreatedMemoId] = useState<string | null>(null)
  const [sidebarMemo, setSidebarMemo] = useState<Memo | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    memoId: string
    x: number
    y: number
  } | null>(null)
  const [editingTags, setEditingTags] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [todos, setTodos] = useState<any[]>([])
  const [showTodoSearch, setShowTodoSearch] = useState<string | null>(null)
  const [filterTag, setFilterTag] = useState<string>('')
  const [filterTodo, setFilterTodo] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [todoSearchQuery, setTodoSearchQuery] = useState<string>('')
  const [selectedTodoIndex, setSelectedTodoIndex] = useState<number>(0)
  
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
  
  // 리사이즈 상태 관리
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean
    memoId: string | null
    handle: string | null
    startX: number
    startY: number
    startWidth: number
    startHeight: number
    startPosX: number
    startPosY: number
  }>({
    isResizing: false,
    memoId: null,
    handle: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startPosX: 0,
    startPosY: 0
  })
  
  const gridRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE

  // 페이지 데이터 가져오기
  const fetchPages = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.log('No session found')
        return
      }

      const { data, error } = await supabase
        .from('memo_pages')
        .select('*')
        .order('position', { ascending: true })

      if (error) throw error
      
      if (data && data.length > 0) {
        setPages(data)
        // 현재 페이지가 없으면 첫 번째 페이지 선택
        if (!currentPageId) {
          setCurrentPageId(data[0].id)
        }
      } else {
        // 페이지가 없으면 기본 페이지 생성
        const { data: newPage, error: createError } = await supabase
          .from('memo_pages')
          .insert({
            title: 'Page 1',
            user_id: session.user.id,
            position: 0
          })
          .select()
          .single()

        if (!createError && newPage) {
          setPages([newPage])
          setCurrentPageId(newPage.id)
        }
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
    }
  }

  // 메모 데이터 가져오기 (현재 페이지의 메모만)
  const fetchMemos = async () => {
    if (!currentPageId) return

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.log('No session found')
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('advanced_memos')
        .select('*')
        .eq('page_id', currentPageId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMemos(data || [])
    } catch (error) {
      console.error('Error fetching memos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 할일 목록 가져오기
  const fetchTodos = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('todos')
        .select('id, title, status')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTodos(data || [])
    } catch (error) {
      console.error('Error fetching todos:', error)
    }
  }

  // 새 페이지 생성
  const createPage = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const newPosition = pages.length
      const { data, error } = await supabase
        .from('memo_pages')
        .insert({
          title: `Page ${pages.length + 1}`,
          user_id: session.user.id,
          position: newPosition
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setPages([...pages, data])
        setCurrentPageId(data.id)
        setShowPageMenu(false)
      }
    } catch (error) {
      console.error('Error creating page:', error)
      toast({
        title: "오류",
        description: "페이지 생성에 실패했습니다.",
        variant: "destructive"
      })
    }
  }

  // 페이지 삭제
  const deletePage = async (pageId: string) => {
    if (pages.length <= 1) {
      toast({
        title: "삭제 불가",
        description: "최소 하나의 페이지는 필요합니다.",
        variant: "destructive"
      })
      return
    }

    try {
      const { error } = await supabase
        .from('memo_pages')
        .delete()
        .eq('id', pageId)

      if (error) throw error

      const newPages = pages.filter(p => p.id !== pageId)
      setPages(newPages)
      
      // 삭제한 페이지가 현재 페이지면 다른 페이지로 이동
      if (currentPageId === pageId && newPages.length > 0) {
        setCurrentPageId(newPages[0].id)
      }
    } catch (error) {
      console.error('Error deleting page:', error)
      toast({
        title: "오류",
        description: "페이지 삭제에 실패했습니다.",
        variant: "destructive"
      })
    }
  }

  // 초기 로드
  useEffect(() => {
    fetchPages()
    fetchTodos()
  }, [])

  // 페이지 변경 시 메모 다시 로드
  useEffect(() => {
    if (currentPageId) {
      fetchMemos()
    }
  }, [currentPageId])

  // 새 메모 추가 (빈 메모 즉시 생성)
  const addMemo = async () => {
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

      // 뷰포트 중앙 계산
      const gridElement = gridRef.current
      let newX = 100
      let newY = 100
      
      if (gridElement) {
        const rect = gridElement.getBoundingClientRect()
        const scrollLeft = gridElement.scrollLeft
        const scrollTop = gridElement.scrollTop
        
        // 뷰포트 중앙 좌표 계산 (스크롤 위치 고려)
        const centerX = scrollLeft + rect.width / 2 - DEFAULT_WIDTH / 2
        const centerY = scrollTop + rect.height / 2 - DEFAULT_HEIGHT / 2
        
        // 그리드에 맞춰 정렬
        newX = snapToGrid(centerX / zoom)
        newY = snapToGrid(centerY / zoom)
        
        // 최소값 보장
        newX = Math.max(0, newX)
        newY = Math.max(0, newY)
        
        // 기존 메모와 겹치지 않도록 조정
        const existingPositions = memos.map(m => ({ x: m.position_x, y: m.position_y }))
        const offset = GRID_SIZE * 2
        let attempts = 0
        
        while (existingPositions.some(pos => 
          Math.abs(pos.x - newX) < DEFAULT_WIDTH && 
          Math.abs(pos.y - newY) < DEFAULT_HEIGHT
        ) && attempts < 10) {
          const angle = attempts * Math.PI / 4
          newX = snapToGrid(centerX / zoom + Math.cos(angle) * offset * (Math.floor(attempts / 8) + 1))
          newY = snapToGrid(centerY / zoom + Math.sin(angle) * offset * (Math.floor(attempts / 8) + 1))
          newX = Math.max(0, newX)
          newY = Math.max(0, newY)
          attempts++
        }
      }

      // 빈 메모 생성
      const { data: insertedMemo, error } = await supabase
        .from('advanced_memos')
        .insert({
          title: '',
          content: '',
          user_id: session.user.id,
          color: MEMO_COLORS[Math.floor(Math.random() * MEMO_COLORS.length)],
          position_x: newX,
          position_y: newY,
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT,
          page_id: currentPageId,
          tags: [],
          tagged_todos: []
        })
        .select()
        .single()

      if (error) throw error
      
      if (insertedMemo) {
        // 메모 목록에 추가
        setMemos(prev => [...prev, insertedMemo])
        
        // 사이드바 열기
        setSidebarMemo(insertedMemo)
        setIsSidebarOpen(true)
        
        // 새로 생성된 메모 하이라이트
        setNewlyCreatedMemoId(insertedMemo.id)
      }
    } catch (error) {
      console.error('Error creating memo:', error)
      toast({
        title: "오류",
        description: "메모 생성에 실패했습니다.",
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
    
    // 리사이즈 핸들, 버튼, 입력 요소 클릭시 드래그 방지
    const target = e.target as HTMLElement
    if (
      target.classList.contains('resize-handle') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('.tag-input') ||
      target.closest('.todo-search')
    ) {
      return
    }
    
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
  
  // 리사이즈 시작
  const handleResizeStart = useCallback((e: React.MouseEvent, memoId: string, handle: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    const memo = memos.find(m => m.id === memoId)
    if (!memo) return
    
    setResizeState({
      isResizing: true,
      memoId,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: memo.width,
      startHeight: memo.height,
      startPosX: memo.position_x,
      startPosY: memo.position_y
    })
  }, [memos])

  // 드래그 및 리사이즈 중 마우스 이동
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // 리사이즈 처리
    if (resizeState.isResizing && resizeState.memoId) {
      const deltaX = e.clientX - resizeState.startX
      const deltaY = e.clientY - resizeState.startY
      const handle = resizeState.handle
      
      setMemos(prev => prev.map(memo => {
        if (memo.id !== resizeState.memoId) return memo
        
        let newWidth = resizeState.startWidth
        let newHeight = resizeState.startHeight
        let newPosX = resizeState.startPosX
        let newPosY = resizeState.startPosY
        
        // 핸들에 따른 리사이즈 처리
        if (handle?.includes('e')) {
          newWidth = Math.max(MIN_WIDTH, snapToGrid(resizeState.startWidth + deltaX))
        }
        if (handle?.includes('w')) {
          const widthChange = snapToGrid(deltaX)
          newWidth = Math.max(MIN_WIDTH, resizeState.startWidth - widthChange)
          if (newWidth !== resizeState.startWidth) {
            newPosX = snapToGrid(resizeState.startPosX + widthChange)
          }
        }
        if (handle?.includes('s')) {
          newHeight = Math.max(MIN_HEIGHT, snapToGrid(resizeState.startHeight + deltaY))
        }
        if (handle?.includes('n')) {
          const heightChange = snapToGrid(deltaY)
          newHeight = Math.max(MIN_HEIGHT, resizeState.startHeight - heightChange)
          if (newHeight !== resizeState.startHeight) {
            newPosY = snapToGrid(resizeState.startPosY + heightChange)
          }
        }
        
        return {
          ...memo,
          position_x: newPosX,
          position_y: newPosY,
          width: newWidth,
          height: newHeight
        }
      }))
      return
    }
    
    // 드래그 처리
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
  }, [dragState, resizeState, zoom, snapToGrid])

  // 드래그 및 리사이즈 종료
  const handleMouseUp = useCallback(async () => {
    // 리사이즈 종료 처리
    if (resizeState.isResizing && resizeState.memoId) {
      const memo = memos.find(m => m.id === resizeState.memoId)
      if (memo) {
        try {
          const { error } = await supabase
            .from('advanced_memos')
            .update({
              position_x: memo.position_x,
              position_y: memo.position_y,
              width: memo.width,
              height: memo.height
            })
            .eq('id', memo.id)
            
          if (error) throw error
        } catch (error) {
          console.error('Error updating memo size:', error)
          toast({
            title: "오류",
            description: "메모 크기 저장에 실패했습니다.",
            variant: "destructive"
          })
        }
      }
      
      setResizeState({
        isResizing: false,
        memoId: null,
        handle: null,
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0,
        startPosX: 0,
        startPosY: 0
      })
      return
    }
    
    // 드래그 종료 처리
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
  }, [dragState, resizeState, memos, updateMemoPosition, supabase, toast])

  // 메모 자동 정렬
  const autoAlignMemos = async () => {
    try {
      const sortedMemos = [...memos].sort((a, b) => {
        if (a.position_y === b.position_y) {
          return a.position_x - b.position_x;
        }
        return a.position_y - b.position_y;
      });

      let currentX = GRID_SIZE;
      let currentY = GRID_SIZE;
      let rowHeight = 0;
      const maxWidth = 1200; // 최대 너비

      const updates = sortedMemos.map((memo) => {
        // 현재 행에 메모가 들어갈 공간이 없으면 다음 행으로
        if (currentX + memo.width > maxWidth) {
          currentX = GRID_SIZE;
          currentY += rowHeight + GRID_SIZE;
          rowHeight = 0;
        }

        const newPosition = {
          id: memo.id,
          x: currentX,
          y: currentY
        };

        // 다음 메모 위치 계산
        currentX += memo.width + GRID_SIZE;
        rowHeight = Math.max(rowHeight, memo.height);

        return newPosition;
      });

      // 로컬 상태 업데이트
      setMemos(prev => prev.map(memo => {
        const update = updates.find(u => u.id === memo.id);
        if (update) {
          return { ...memo, position_x: update.x, position_y: update.y };
        }
        return memo;
      }));

      // DB 업데이트
      for (const update of updates) {
        await updateMemoPosition(update.id, update.x, update.y);
      }

      toast({
        title: "정렬 완료",
        description: "메모가 자동으로 정렬되었습니다."
      });
    } catch (error) {
      console.error('Error auto-aligning memos:', error);
      toast({
        title: "오류",
        description: "메모 정렬에 실패했습니다.",
        variant: "destructive"
      });
    }
  }

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
  // 메모 삭제
  const deleteMemo = async (memoId: string) => {
    try {
      const { error } = await supabase
        .from('advanced_memos')
        .delete()
        .eq('id', memoId)

      if (error) throw error

      setMemos(prev => prev.filter(m => m.id !== memoId))
      setContextMenu(null)
      
      toast({
        title: "삭제 완료",
        description: "메모가 삭제되었습니다."
      })
    } catch (error) {
      console.error('Error deleting memo:', error)
      toast({
        title: "오류",
        description: "메모 삭제에 실패했습니다.",
        variant: "destructive"
      })
    }
  }

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

  // 메모 클릭 핸들러
  const handleMemoClick = (memo: Memo) => {
    // 새로 생성된 메모 하이라이트 제거
    if (newlyCreatedMemoId === memo.id) {
      setNewlyCreatedMemoId(null)
    }
    
    // 사이드바 열기
    setSidebarMemo(memo)
    setIsSidebarOpen(true)
  }

  // 사이드바에서 메모 저장
  const handleSidebarSave = async (updatedMemo: {
    id: string
    title: string
    content: string
    tags: string[]
    tagged_todos: string[]
  }) => {
    try {
      const { error } = await supabase
        .from('advanced_memos')
        .update({
          title: updatedMemo.title,
          content: updatedMemo.content,
          tags: updatedMemo.tags,
          tagged_todos: updatedMemo.tagged_todos
        })
        .eq('id', updatedMemo.id)

      if (error) throw error

      // 로컬 상태 업데이트
      setMemos(prev => prev.map(memo => 
        memo.id === updatedMemo.id 
          ? { 
              ...memo, 
              title: updatedMemo.title,
              content: updatedMemo.content,
              tags: updatedMemo.tags,
              tagged_todos: updatedMemo.tagged_todos
            } 
          : memo
      ))

      // 사이드바 메모도 업데이트
      if (sidebarMemo?.id === updatedMemo.id) {
        setSidebarMemo(prev => prev ? {
          ...prev,
          title: updatedMemo.title,
          content: updatedMemo.content,
          tags: updatedMemo.tags,
          tagged_todos: updatedMemo.tagged_todos
        } : null)
      }
    } catch (error) {
      console.error('Error saving memo:', error)
      toast({
        title: "저장 실패",
        description: "메모 저장에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  // 실시간 업데이트 (UI만 업데이트, DB 저장 없음)
  const handleRealtimeUpdate = (updatedMemo: {
    id: string
    title: string
    content: string
    tags: string[]
    tagged_todos: string[]
  }) => {
    // 로컬 상태 즉시 업데이트
    setMemos(prev => prev.map(memo => 
      memo.id === updatedMemo.id 
        ? { 
            ...memo, 
            title: updatedMemo.title,
            content: updatedMemo.content,
            tags: updatedMemo.tags,
            tagged_todos: updatedMemo.tagged_todos
          } 
        : memo
    ))

    // 사이드바 메모도 업데이트
    if (sidebarMemo?.id === updatedMemo.id) {
      setSidebarMemo(prev => prev ? {
        ...prev,
        title: updatedMemo.title,
        content: updatedMemo.content,
        tags: updatedMemo.tags,
        tagged_todos: updatedMemo.tagged_todos
      } : null)
    }
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

  // 태그 추가
  const addTag = async (memoId: string, tag: string) => {
    try {
      const memo = memos.find(m => m.id === memoId)
      if (!memo) return

      const newTags = [...(memo.tags || []), tag]
      
      const { error } = await supabase
        .from('advanced_memos')
        .update({ tags: newTags })
        .eq('id', memoId)

      if (error) throw error

      setMemos(prev => prev.map(m => 
        m.id === memoId ? { ...m, tags: newTags } : m
      ))
    } catch (error) {
      console.error('Error adding tag:', error)
    }
  }

  // 태그 제거
  const removeTag = async (memoId: string, tagToRemove: string) => {
    try {
      const memo = memos.find(m => m.id === memoId)
      if (!memo) return

      const newTags = (memo.tags || []).filter(tag => tag !== tagToRemove)
      
      const { error } = await supabase
        .from('advanced_memos')
        .update({ tags: newTags })
        .eq('id', memoId)

      if (error) throw error

      setMemos(prev => prev.map(m => 
        m.id === memoId ? { ...m, tags: newTags } : m
      ))
    } catch (error) {
      console.error('Error removing tag:', error)
    }
  }

  // 할일 태그 토글
  const toggleTodoTag = async (memoId: string, todoId: string) => {
    try {
      const memo = memos.find(m => m.id === memoId)
      if (!memo) return

      const currentTodos = memo.tagged_todos || []
      const newTodos = currentTodos.includes(todoId)
        ? currentTodos.filter(id => id !== todoId)
        : [...currentTodos, todoId]
      
      const { error } = await supabase
        .from('advanced_memos')
        .update({ tagged_todos: newTodos })
        .eq('id', memoId)

      if (error) throw error

      setMemos(prev => prev.map(m => 
        m.id === memoId ? { ...m, tagged_todos: newTodos } : m
      ))
    } catch (error) {
      console.error('Error toggling todo tag:', error)
    }
  }

  // 초기 로드는 이미 위에서 처리됨
  // useEffect(() => {
  //   fetchMemos()
  // }, [])

  // 뷰 상태 계산

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-gray-600">로딩 중...</div>
      </div>
    )
  }

  // 필터링된 메모 계산
  const filteredMemos = memos.filter(memo => {
    // 태그 필터
    if (filterTag && (!memo.tags || !memo.tags.includes(filterTag))) {
      return false
    }
    
    // 할일 필터
    if (filterTodo && (!memo.tagged_todos || !memo.tagged_todos.includes(filterTodo))) {
      return false
    }
    
    return true
  })

  return (
    <div className="w-full h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* CSS 애니메이션 추가 */}
      <style>{`
        @keyframes highlight {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        .resize-handle {
          position: absolute;
          background: transparent;
          transition: background-color 0.2s;
        }
        
        .resize-handle:hover {
          background-color: rgba(59, 130, 246, 0.3);
        }
        
        .resize-handle-n {
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          cursor: ns-resize;
        }
        
        .resize-handle-s {
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          cursor: ns-resize;
        }
        
        .resize-handle-e {
          top: 0;
          bottom: 0;
          right: 0;
          width: 4px;
          cursor: ew-resize;
        }
        
        .resize-handle-w {
          top: 0;
          bottom: 0;
          left: 0;
          width: 4px;
          cursor: ew-resize;
        }
        
        .resize-handle-ne {
          top: 0;
          right: 0;
          width: 8px;
          height: 8px;
          cursor: nesw-resize;
        }
        
        .resize-handle-nw {
          top: 0;
          left: 0;
          width: 8px;
          height: 8px;
          cursor: nwse-resize;
        }
        
        .resize-handle-se {
          bottom: 0;
          right: 0;
          width: 8px;
          height: 8px;
          cursor: nwse-resize;
        }
        
        .resize-handle-sw {
          bottom: 0;
          left: 0;
          width: 8px;
          height: 8px;
          cursor: nesw-resize;
        }
      `}</style>
      
      {/* 메모 컨트롤 패널 - 헤더 아래 중앙 배치 */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex items-center gap-4 bg-white/90 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 p-3">
          <Button
            onClick={addMemo}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white border-blue-600 shadow-lg"
          >
            <PlusCircle className="h-4 w-4" />
            ADD MEMO
          </Button>
          
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          
          <div className="h-6 w-px bg-gray-300" />
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-2"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="p-2"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* 툴바 */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-4">
        {/* 페이지 선택기 */}
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowPageMenu(!showPageMenu)}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-lg rounded-lg shadow-lg border border-gray-200 px-4 py-2 min-w-[200px] justify-between"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">
                {pages.find(p => p.id === currentPageId)?.title || 'Select Page'}
              </span>
            </div>
            <svg className={`w-4 h-4 transition-transform ${showPageMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
          
          {/* 페이지 드롭다운 메뉴 */}
          {showPageMenu && (
            <div className="absolute top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[250px]">
              <div className="flex items-center justify-between px-3 py-2 mb-2">
                <span className="font-semibold text-gray-700">Pages</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={createPage}
                  className="h-6 w-6 p-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Button>
              </div>
              
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      page.id === currentPageId ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <span
                      onClick={() => {
                        setCurrentPageId(page.id)
                        setShowPageMenu(false)
                      }}
                      className="flex-1"
                    >
                      {page.title}
                    </span>
                    {pages.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`"${page.title}" 페이지를 삭제하시겠습니까?\n이 페이지의 모든 메모가 삭제됩니다.`)) {
                            deletePage(page.id)
                          }
                        }}
                        className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 필터 패널 */}
      {showFilters && (
        <div className="absolute top-20 left-4 z-20 bg-white/95 backdrop-blur-lg rounded-lg shadow-xl border border-gray-200 p-4 w-80">
          <h3 className="text-sm font-semibold mb-3 text-gray-700">Filter Memos</h3>
          
          <div className="space-y-3">
            {/* 태그 필터 */}
            <div>
              <Label className="text-xs text-gray-600 mb-1">Filter by Tag</Label>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
              >
                <option value="">All Tags</option>
                {Array.from(new Set(memos.flatMap(m => m.tags || []))).map(tag => (
                  <option key={tag} value={tag}>#{tag}</option>
                ))}
              </select>
            </div>
            
            {/* 할일 필터 */}
            <div>
              <Label className="text-xs text-gray-600 mb-1">Filter by Task</Label>
              <select
                value={filterTodo}
                onChange={(e) => setFilterTodo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
              >
                <option value="">All Tasks</option>
                {todos.map(todo => (
                  <option key={todo.id} value={todo.id}>{todo.title}</option>
                ))}
              </select>
            </div>
            
            {/* 필터 초기화 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterTag('')
                setFilterTodo('')
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
          
          {/* 필터 결과 */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              Showing {filteredMemos.length} of {memos.length} memos
            </p>
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
            setNewlyCreatedMemoId(null) // 클릭 시 하이라이트 제거
          }
        }}
      >
        {/* 메모들 */}
        {filteredMemos.map((memo) => {
          const isHovered = hoveredMemo === memo.id && !dragState.isDragging
          const isDragging = dragState.memoId === memo.id
          const isResizing = resizeState.memoId === memo.id
          const isNewlyCreated = newlyCreatedMemoId === memo.id
          
          return (
            <div
              key={memo.id}
              className={`absolute select-none transition-all duration-200 rounded-lg shadow-lg hover:shadow-xl ${
                isDragging ? 'cursor-grabbing z-50' : isResizing ? 'cursor-default' : 'cursor-grab'
              } ${isNewlyCreated ? 'animate-[highlight_1s_ease-in-out]' : ''}`}
              style={{
                left: memo.position_x,
                top: memo.position_y,
                width: memo.width,
                height: memo.height,
                backgroundColor: memo.color,
                transform: isHovered && !isDragging && !isResizing ? 'translateY(-2px)' : 'none',
                zIndex: isDragging || isResizing ? 50 : (isHovered ? 30 : 10),
                boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.3)' : 
                          isHovered ? '0 12px 28px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.1)',
                outline: isNewlyCreated ? '3px solid #3B82F6' : 'none',
                outlineOffset: isNewlyCreated ? '2px' : '0'
              }}
              onMouseDown={(e) => handleMouseDown(e, memo.id)}
              onMouseEnter={() => handleMemoHover(memo.id, true)}
              onMouseLeave={() => handleMemoHover(memo.id, false)}
              onContextMenu={(e) => handleContextMenu(e, memo.id)}
              onClick={() => handleMemoClick(memo)}
            >
              <div className="p-3 h-full flex flex-col overflow-hidden">
                <h3 className="font-semibold text-sm mb-2 text-gray-800 truncate">
                  {memo.title}
                </h3>
                <p className="text-xs text-gray-700 flex-1 line-clamp-3 overflow-hidden">
                  {memo.content}
                </p>
                
                {/* 태그 영역 */}
                <div className="mt-2 space-y-1">
                  {/* 일반 태그 */}
                  {memo.tags && memo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {memo.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-gray-200 text-gray-700"
                        >
                          #{tag}
                        </span>
                      ))}
                      {memo.tags.length > 3 && (
                        <span className="text-[10px] text-gray-500">+{memo.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                  
                  {/* 할일 태그 */}
                  {memo.tagged_todos && memo.tagged_todos.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {memo.tagged_todos.slice(0, 2).map((todoId) => {
                        const todo = todos.find(t => t.id === todoId)
                        if (!todo) return null
                        return (
                          <span
                            key={todoId}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 truncate max-w-[100px]"
                          >
                            📌 {todo.title}
                          </span>
                        )
                      })}
                      {memo.tagged_todos.length > 2 && (
                        <span className="text-[10px] text-gray-500">+{memo.tagged_todos.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* 리사이즈 핸들들 */}
              <div className="resize-handle resize-handle-n" onMouseDown={(e) => handleResizeStart(e, memo.id, 'n')} />
              <div className="resize-handle resize-handle-s" onMouseDown={(e) => handleResizeStart(e, memo.id, 's')} />
              <div className="resize-handle resize-handle-e" onMouseDown={(e) => handleResizeStart(e, memo.id, 'e')} />
              <div className="resize-handle resize-handle-w" onMouseDown={(e) => handleResizeStart(e, memo.id, 'w')} />
              <div className="resize-handle resize-handle-ne" onMouseDown={(e) => handleResizeStart(e, memo.id, 'ne')} />
              <div className="resize-handle resize-handle-nw" onMouseDown={(e) => handleResizeStart(e, memo.id, 'nw')} />
              <div className="resize-handle resize-handle-se" onMouseDown={(e) => handleResizeStart(e, memo.id, 'se')} />
              <div className="resize-handle resize-handle-sw" onMouseDown={(e) => handleResizeStart(e, memo.id, 'sw')} />
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
          <div className="space-y-3">
            {/* 색상 선택 */}
            <div>
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
            
            {/* 구분선 */}
            <div className="border-t border-gray-200"></div>
            
            {/* 액션 버튼들 */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const memo = memos.find(m => m.id === contextMenu.memoId)
                  if (memo) {
                    setSidebarMemo(memo)
                    setIsSidebarOpen(true)
                  }
                  setContextMenu(null)
                }}
                className="flex items-center gap-1 text-sm"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                수정
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm('정말로 이 메모를 삭제하시겠습니까?')) {
                    deleteMemo(contextMenu.memoId)
                  }
                }}
                className="flex items-center gap-1 text-sm"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 배경 클릭시 컨텍스트 메뉴와 페이지 메뉴 닫기 */}
      {(contextMenu || showPageMenu || showTodoSearch) && (
        <div
          className="fixed inset-0 z-25"
          onClick={() => {
            setContextMenu(null)
            setShowPageMenu(false)
            setShowTodoSearch(null)
          }}
        />
      )}
      
      {/* 할일 검색 모달 */}
      {showTodoSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col todo-search">
            <h3 className="font-semibold mb-3">할일 태그하기</h3>
            <Input
              placeholder="할일 검색..."
              className="mb-3"
              autoFocus
              value={todoSearchQuery}
              onChange={(e) => {
                setTodoSearchQuery(e.target.value)
                setSelectedTodoIndex(0)
              }}
              onKeyDown={(e) => {
                const filteredTodos = todos.filter(todo => 
                  todo.title.toLowerCase().includes(todoSearchQuery.toLowerCase())
                )
                
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setSelectedTodoIndex(prev => 
                    prev < filteredTodos.length - 1 ? prev + 1 : prev
                  )
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setSelectedTodoIndex(prev => prev > 0 ? prev - 1 : 0)
                } else if (e.key === 'Enter' && filteredTodos.length > 0) {
                  e.preventDefault()
                  const selectedTodo = filteredTodos[selectedTodoIndex]
                  if (selectedTodo) {
                    toggleTodoTag(showTodoSearch, selectedTodo.id)
                  }
                } else if (e.key === 'Escape') {
                  setShowTodoSearch(null)
                  setTodoSearchQuery('')
                  setSelectedTodoIndex(0)
                }
              }}
            />
            <div className="flex-1 overflow-y-auto space-y-2">
              {todos
                .filter(todo => 
                  todo.title.toLowerCase().includes(todoSearchQuery.toLowerCase())
                )
                .map((todo, index) => {
                const memo = memos.find(m => m.id === showTodoSearch)
                const isTagged = memo?.tagged_todos?.includes(todo.id)
                const isSelected = index === selectedTodoIndex
                
                return (
                  <div
                    key={todo.id}
                    onClick={() => toggleTodoTag(showTodoSearch, todo.id)}
                    onMouseEnter={() => setSelectedTodoIndex(index)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      isTagged 
                        ? 'bg-blue-100 border-2 border-blue-300' 
                        : isSelected
                        ? 'bg-gray-100 border-2 border-gray-300'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{todo.title}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        todo.status === 'completed' ? 'bg-green-100 text-green-700' :
                        todo.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {todo.status === 'completed' ? '완료' :
                         todo.status === 'in_progress' ? '진행중' : '대기'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            <Button
              onClick={() => {
                setShowTodoSearch(null)
                setTodoSearchQuery('')
                setSelectedTodoIndex(0)
              }}
              className="mt-3"
              variant="outline"
            >
              닫기
            </Button>
          </div>
        </div>
      )}

      {/* 메모 사이드바 */}
      <MemoSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        memo={sidebarMemo}
        onSave={handleSidebarSave}
        onRealtimeUpdate={handleRealtimeUpdate}
      />
    </div>
  )
}

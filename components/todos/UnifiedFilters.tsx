"use client"

import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Filter, Users, Lock, Globe, CheckCircle2, Clock, CircleDot } from 'lucide-react'

export interface UnifiedFilterOptions {
  spaces: string[] // 선택된 스페이스 ID들
  status: 'all' | 'completed' | 'in_progress' | 'pending'
  shareType: 'all' | 'personal' | 'shared'
}

interface UnifiedFiltersProps {
  spaces: Array<{ id: string; name: string; type: string }>
  filters: UnifiedFilterOptions
  onFiltersChange: (filters: UnifiedFilterOptions) => void
}

export default function UnifiedFilters({
  spaces,
  filters,
  onFiltersChange
}: UnifiedFiltersProps) {
  const handleSpaceChange = (spaceId: string) => {
    const newSpaces = filters.spaces.includes(spaceId)
      ? filters.spaces.filter(id => id !== spaceId)
      : [...filters.spaces, spaceId]
    
    onFiltersChange({
      ...filters,
      spaces: newSpaces
    })
  }

  const handleStatusChange = (status: UnifiedFilterOptions['status']) => {
    onFiltersChange({
      ...filters,
      status
    })
  }

  const handleShareTypeChange = (shareType: UnifiedFilterOptions['shareType']) => {
    onFiltersChange({
      ...filters,
      shareType
    })
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="h-4 w-4 text-gray-600" />
        <h3 className="font-semibold text-gray-900">필터</h3>
      </div>

      {/* 스페이스 필터 */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          스페이스
        </label>
        <div className="flex flex-wrap gap-2">
          {spaces.map(space => (
            <Badge
              key={space.id}
              variant={filters.spaces.includes(space.id) ? "default" : "outline"}
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => handleSpaceChange(space.id)}
            >
              {space.type === 'personal' && <Lock className="h-3 w-3 mr-1" />}
              {space.type === 'team' && <Users className="h-3 w-3 mr-1" />}
              {space.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* 상태 필터 */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          상태
        </label>
        <ToggleGroup
          type="single"
          value={filters.status}
          onValueChange={(value) => value && handleStatusChange(value as UnifiedFilterOptions['status'])}
          className="justify-start"
        >
          <ToggleGroupItem value="all" className="text-xs">
            <CircleDot className="h-3 w-3 mr-1" />
            전체
          </ToggleGroupItem>
          <ToggleGroupItem value="pending" className="text-xs">
            <CircleDot className="h-3 w-3 mr-1 text-amber-600" />
            대기중
          </ToggleGroupItem>
          <ToggleGroupItem value="in_progress" className="text-xs">
            <Clock className="h-3 w-3 mr-1 text-blue-600" />
            진행중
          </ToggleGroupItem>
          <ToggleGroupItem value="completed" className="text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
            완료
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* 공유 타입 필터 */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          공유 상태
        </label>
        <ToggleGroup
          type="single"
          value={filters.shareType}
          onValueChange={(value) => value && handleShareTypeChange(value as UnifiedFilterOptions['shareType'])}
          className="justify-start"
        >
          <ToggleGroupItem value="all" className="text-xs">
            <CircleDot className="h-3 w-3 mr-1" />
            전체
          </ToggleGroupItem>
          <ToggleGroupItem value="personal" className="text-xs">
            <Lock className="h-3 w-3 mr-1" />
            개인
          </ToggleGroupItem>
          <ToggleGroupItem value="shared" className="text-xs">
            <Globe className="h-3 w-3 mr-1" />
            공유
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* 선택된 필터 요약 */}
      {(filters.spaces.length > 0 || filters.status !== 'all' || filters.shareType !== 'all') && (
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">적용된 필터:</span>
            <div className="flex flex-wrap gap-1">
              {filters.spaces.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters.spaces.length}개 스페이스
                </Badge>
              )}
              {filters.status !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {filters.status === 'completed' && '완료'}
                  {filters.status === 'in_progress' && '진행중'}
                  {filters.status === 'pending' && '대기중'}
                </Badge>
              )}
              {filters.shareType !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {filters.shareType === 'personal' ? '개인' : '공유'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

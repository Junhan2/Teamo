// contexts/SpaceContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { spacesClient } from '@/lib/api/spaces/client';
import type { Space, SpaceWithRole } from '@/types/space';

interface SpaceContextType {
  currentSpace: Space | null;
  spaces: SpaceWithRole[];
  isLoading: boolean;
  switchSpace: (spaceId: string) => Promise<void>;
  refreshSpaces: () => Promise<void>;
  setDefaultSpace: (spaceId: string) => Promise<void>;
  addSpace: (space: SpaceWithRole) => void;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [spaces, setSpaces] = useState<SpaceWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 스페이스 목록 로드
  const loadSpaces = useCallback(async () => {
    try {
      const userSpaces = await spacesClient.getUserSpaces();
      setSpaces(userSpaces);

      // 기본 스페이스 찾기
      const defaultSpace = userSpaces.find(s => s.is_default);
      if (defaultSpace) {
        setCurrentSpace(defaultSpace);
      } else if (userSpaces.length > 0) {
        // 기본 스페이스가 없으면 첫 번째 스페이스 선택
        setCurrentSpace(userSpaces[0]);
      }
    } catch (error) {
      console.error('Failed to load spaces:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  // 스페이스 전환
  const switchSpace = useCallback(async (spaceId: string) => {
    const space = spaces.find(s => s.id === spaceId);
    if (space) {
      setCurrentSpace(space);
      // 스페이스 전환 시 대시보드로 이동
      router.push('/dashboard');
      router.refresh();
    }
  }, [spaces, router]);

  // 기본 스페이스 설정
  const setDefaultSpace = useCallback(async (spaceId: string) => {
    try {
      await spacesClient.setDefaultSpace(spaceId);
      
      // 즉시 로컬 상태 업데이트
      const updatedSpaces = spaces.map(space => ({
        ...space,
        is_default: space.id === spaceId
      }));
      setSpaces(updatedSpaces);
      
      // 현재 스페이스도 업데이트
      const newDefaultSpace = updatedSpaces.find(s => s.id === spaceId);
      if (newDefaultSpace) {
        setCurrentSpace(newDefaultSpace);
      }
    } catch (error) {
      console.error('Failed to set default space:', error);
      throw error;
    }
  }, [spaces]);

  // 새 스페이스 추가 (즉시 목록에 반영)
  const addSpace = useCallback((space: SpaceWithRole) => {
    setSpaces(prevSpaces => [...prevSpaces, space]);
    
    // 첫 번째 스페이스이거나 현재 스페이스가 없으면 현재 스페이스로 설정
    if (spaces.length === 0 || !currentSpace) {
      setCurrentSpace(space);
    }
  }, [spaces.length, currentSpace]);

  // 스페이스 목록 새로고침
  const refreshSpaces = useCallback(async () => {
    setIsLoading(true);
    await loadSpaces();
  }, [loadSpaces]);

  useEffect(() => {
    loadSpaces();
  }, [loadSpaces]);

  return (
    <SpaceContext.Provider
      value={{
        currentSpace,
        spaces,
        isLoading,
        switchSpace,
        refreshSpaces,
        setDefaultSpace,
        addSpace,
      }}
    >
      {children}
    </SpaceContext.Provider>
  );
}

export function useSpace() {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error('useSpace must be used within a SpaceProvider');
  }
  return context;
}

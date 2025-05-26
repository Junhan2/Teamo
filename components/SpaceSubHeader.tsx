'use client';

import { useSpace } from '@/contexts/SpaceContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChart3, CheckSquare } from 'lucide-react';

export default function SpaceSubHeader() {
  const { currentSpace } = useSpace();
  const pathname = usePathname();

  // 스페이스가 선택되지 않았거나 전역 페이지들에서는 서브 헤더를 표시하지 않음
  if (!currentSpace || 
      pathname === '/overview' || 
      pathname === '/profile' || 
      pathname === '/settings' || 
      pathname.startsWith('/auth') ||
      pathname === '/spaces' ||
      pathname === '/spaces/new') {
    return null;
  }

  // 현재 탭 결정
  const isOverviewActive = pathname === `/space/${currentSpace.id}` || 
                          pathname === `/space/${currentSpace.id}/overview`;
  const isTasksActive = pathname === `/space/${currentSpace.id}/tasks`;

  return (
    <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-12">
          {/* 스페이스 정보 */}
          <div className="flex items-center gap-3 mr-8">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="font-medium text-gray-900">{currentSpace.name}</span>
          </div>

          {/* 탭 메뉴 */}
          <nav className="flex items-center gap-1">
            <Link href={`/space/${currentSpace.id}`}>
              <Button 
                variant={isOverviewActive ? "default" : "ghost"} 
                size="sm"
                className={`h-8 px-3 ${
                  isOverviewActive 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </Button>
            </Link>
            <Link href={`/space/${currentSpace.id}/tasks`}>
              <Button 
                variant={isTasksActive ? "default" : "ghost"} 
                size="sm"
                className={`h-8 px-3 ${
                  isTasksActive 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Tasks
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}

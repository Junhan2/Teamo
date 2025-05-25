"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getInvitationByToken, acceptInvitation } from "@/lib/api/invitations/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import PageLoading from "@/components/PageLoading"
import { toast } from "@/components/ui/use-toast"
import { 
  Users, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  LogIn,
  UserPlus
} from "lucide-react"
import Link from "next/link"

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<any>(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const checkAuthAndFetchInvitation = async () => {
      try {
        setLoading(true)
        
        // 인증 확인
        const { data: { user } } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
        
        // 초대 정보 가져오기
        const invitationData = await getInvitationByToken(token)
        
        // 상태 확인
        if (invitationData.status !== 'pending') {
          if (invitationData.status === 'accepted') {
            setError('이미 수락된 초대입니다.')
          } else if (invitationData.status === 'expired') {
            setError('만료된 초대입니다.')
          } else {
            setError('유효하지 않은 초대입니다.')
          }
        }
        
        // 만료 시간 확인
        if (new Date(invitationData.expires_at) < new Date()) {
          setError('만료된 초대입니다.')
        }
        
        setInvitation(invitationData)
        
      } catch (error) {
        console.error('Error fetching invitation:', error)
        setError('초대 정보를 찾을 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchInvitation()
  }, [token, supabase])

  const handleAccept = async () => {
    if (!isAuthenticated) {
      // 로그인 페이지로 리다이렉트 (초대 토큰 포함)
      router.push(`/auth/login?redirect=/invite/${token}`)
      return
    }

    try {
      setIsAccepting(true)
      
      const result = await acceptInvitation(token)
      
      toast({
        title: "초대 수락 완료",
        description: "스페이스에 성공적으로 참여했습니다.",
      })
      
      // 스페이스 대시보드로 이동
      router.push(`/spaces/${result.space_id}`)
      
    } catch (error: any) {
      console.error('Error accepting invitation:', error)
      toast({
        title: "오류",
        description: error.message || "초대 수락 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsAccepting(false)
    }
  }

  if (loading) {
    return <PageLoading message="초대 정보를 확인하는 중..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle>초대 오류</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">홈으로 돌아가기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>스페이스 초대</CardTitle>
          <CardDescription>
            {invitation.space.name} 스페이스에 초대되었습니다
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 스페이스 정보 */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">스페이스</span>
              <span className="font-medium">{invitation.space.name}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">타입</span>
              <Badge variant="outline">
                {invitation.space.type}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">역할</span>
              <Badge variant={invitation.role === 'admin' ? 'default' : 'secondary'}>
                {invitation.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                {invitation.role}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">만료일</span>
              <span className="text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(invitation.expires_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* 액션 버튼 */}
          {isAuthenticated ? (
            <Button 
              onClick={handleAccept} 
              disabled={isAccepting}
              className="w-full"
              size="lg"
            >
              {isAccepting ? (
                "수락 중..."
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  초대 수락하기
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center text-gray-600">
                초대를 수락하려면 먼저 로그인이 필요합니다.
              </p>
              <Button 
                onClick={() => router.push(`/auth/login?redirect=/invite/${token}`)}
                className="w-full"
                size="lg"
              >
                <LogIn className="h-5 w-5 mr-2" />
                로그인하고 수락하기
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push(`/auth/signup?redirect=/invite/${token}`)}
                className="w-full"
                size="lg"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                회원가입하고 수락하기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

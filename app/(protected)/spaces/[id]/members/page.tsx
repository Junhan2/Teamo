"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getSpace, getSpaceMembers } from "@/lib/api/spaces/members"
import { createInvitation, getSpaceInvitations, cancelInvitation } from "@/lib/api/invitations/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import PageLoading from "@/components/PageLoading"
import { 
  Users, 
  Mail, 
  UserPlus, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  Copy,
  Trash2,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

interface Member {
  user_id: string
  role: string
  is_active: boolean
  profiles: {
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

export default function SpaceMembersPage() {
  const params = useParams()
  const router = useRouter()
  const spaceId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [space, setSpace] = useState<any>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member")
  const [isInviting, setIsInviting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  const supabase = createClient()

  // 현재 사용자 ID 가져오기
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getCurrentUser()
  }, [])

  // 데이터 가져오기
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 스페이스 정보
      const spaceData = await getSpace(spaceId)
      setSpace(spaceData)
      
      // 멤버 목록
      const membersData = await getSpaceMembers(spaceId)
      setMembers(membersData)
      
      // 초대 목록
      const invitationsData = await getSpaceInvitations(spaceId)
      setInvitations(invitationsData)
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "오류",
        description: "데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [spaceId])

  // 초대 전송
  const handleInvite = async () => {
    if (!inviteEmail) {
      toast({
        title: "오류",
        description: "이메일 주소를 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsInviting(true)
      
      const invitation = await createInvitation({
        spaceId,
        email: inviteEmail,
        role: inviteRole
      })

      // 초대 링크 생성
      const inviteUrl = `${window.location.origin}/invite/${invitation.token}`
      
      // 클립보드에 복사
      await navigator.clipboard.writeText(inviteUrl)
      
      toast({
        title: "초대 전송 완료",
        description: "초대 링크가 클립보드에 복사되었습니다.",
      })
      
      // 폼 초기화
      setInviteEmail("")
      setInviteRole("member")
      
      // 목록 새로고침
      await fetchData()
      
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast({
        title: "오류",
        description: "초대 전송 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsInviting(false)
    }
  }

  // 초대 취소
  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitation(invitationId)
      
      toast({
        title: "초대 취소됨",
        description: "초대가 취소되었습니다.",
      })
      
      await fetchData()
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast({
        title: "오류",
        description: "초대 취소 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    }
  }

  // 초대 링크 복사
  const copyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`
    await navigator.clipboard.writeText(inviteUrl)
    
    toast({
      title: "복사됨",
      description: "초대 링크가 클립보드에 복사되었습니다.",
    })
  }

  if (loading) {
    return <PageLoading message="멤버 정보를 불러오는 중..." />
  }

  if (!space) {
    return <div>스페이스를 찾을 수 없습니다.</div>
  }

  const currentUserRole = members.find(m => m.user_id === currentUserId)?.role
  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'owner'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/spaces/${spaceId}`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                스페이스로 돌아가기
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {space.name} - 멤버 관리
              </h1>
              <p className="text-gray-600">스페이스 멤버 및 초대 관리</p>
            </div>
          </div>
        </div>

        {/* 초대 폼 (관리자만) */}
        {isAdmin && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                새 멤버 초대
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">이메일 주소</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">역할</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "member" | "admin")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">멤버</SelectItem>
                      <SelectItem value="admin">관리자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleInvite} 
                  disabled={isInviting}
                  className="w-full"
                >
                  {isInviting ? "초대 중..." : "초대 전송"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 현재 멤버 목록 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>현재 멤버 ({members.length}명)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.profiles.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.profiles.full_name?.[0] || member.profiles.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.profiles.full_name || member.profiles.email}
                      </p>
                      <p className="text-sm text-gray-500">{member.profiles.email}</p>
                    </div>
                  </div>
                  
                  <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                    {member.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 대기 중인 초대 */}
        {invitations.filter(i => i.status === 'pending').length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>대기 중인 초대</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitations
                  .filter(i => i.status === 'pending')
                  .map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <p className="text-sm text-gray-500">
                            만료: {new Date(invitation.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {invitation.role}
                        </Badge>
                        
                        {isAdmin && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyInviteLink(invitation.token)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelInvitation(invitation.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Clock, MessageCircle, UserPlus, Calendar } from "lucide-react";

interface EmailSettings {
  email_enabled: boolean;
  email_on_task_assigned: boolean;
  email_on_task_due_soon: boolean;
  email_on_space_invite: boolean;
  email_on_comment: boolean;
  email_digest_enabled: boolean;
  email_digest_time: string;
}

export default function EmailSettings() {
  const [settings, setSettings] = useState<EmailSettings>({
    email_enabled: true,
    email_on_task_assigned: true,
    email_on_task_due_soon: true,
    email_on_space_invite: true,
    email_on_comment: true,
    email_digest_enabled: false,
    email_digest_time: "09:00:00",
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("email_notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // 기본 설정 생성
        const { data: newSettings } = await supabase
          .from("email_notification_settings")
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (newSettings) {
          setSettings(newSettings);
        }
      }
    } catch (error) {
      console.error("Error loading email settings:", error);
      toast.error("이메일 설정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function updateSetting(key: keyof EmailSettings, value: boolean | string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      const { error } = await supabase
        .from("email_notification_settings")
        .update({ [key]: value, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("설정이 저장되었습니다.");
    } catch (error) {
      console.error("Error updating email settings:", error);
      toast.error("설정 저장에 실패했습니다.");
      // 롤백
      setSettings(settings);
    }
  }

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          이메일 알림 설정
        </CardTitle>
        <CardDescription>
          중요한 업데이트를 이메일로 받아보세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 전체 이메일 알림 */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-enabled" className="text-base">
              이메일 알림 받기
            </Label>
            <p className="text-sm text-gray-500">
              모든 이메일 알림을 켜거나 끕니다
            </p>
          </div>
          <Switch
            id="email-enabled"
            checked={settings.email_enabled}
            onCheckedChange={(checked) => updateSetting("email_enabled", checked)}
          />
        </div>

        {settings.email_enabled && (
          <>
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-sm font-medium">알림 유형별 설정</h3>
              
              {/* 할일 할당 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserPlus className="h-4 w-4 text-gray-400" />
                  <div>
                    <Label htmlFor="task-assigned" className="text-sm">
                      할일 할당
                    </Label>
                    <p className="text-xs text-gray-500">
                      새로운 할일이 나에게 할당될 때
                    </p>
                  </div>
                </div>
                <Switch
                  id="task-assigned"
                  checked={settings.email_on_task_assigned}
                  onCheckedChange={(checked) => updateSetting("email_on_task_assigned", checked)}
                />
              </div>

              {/* 마감일 임박 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <Label htmlFor="due-soon" className="text-sm">
                      마감일 임박
                    </Label>
                    <p className="text-xs text-gray-500">
                      할일 마감일이 가까워질 때
                    </p>
                  </div>
                </div>
                <Switch
                  id="due-soon"
                  checked={settings.email_on_task_due_soon}
                  onCheckedChange={(checked) => updateSetting("email_on_task_due_soon", checked)}
                />
              </div>

              {/* 스페이스 초대 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <Label htmlFor="space-invite" className="text-sm">
                      스페이스 초대
                    </Label>
                    <p className="text-xs text-gray-500">
                      새로운 스페이스에 초대받을 때
                    </p>
                  </div>
                </div>
                <Switch
                  id="space-invite"
                  checked={settings.email_on_space_invite}
                  onCheckedChange={(checked) => updateSetting("email_on_space_invite", checked)}
                />
              </div>

              {/* 댓글 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-4 w-4 text-gray-400" />
                  <div>
                    <Label htmlFor="comment" className="text-sm">
                      댓글
                    </Label>
                    <p className="text-xs text-gray-500">
                      내 할일에 댓글이 달릴 때
                    </p>
                  </div>
                </div>
                <Switch
                  id="comment"
                  checked={settings.email_on_comment}
                  onCheckedChange={(checked) => updateSetting("email_on_comment", checked)}
                />
              </div>
            </div>

            {/* 일일 요약 (향후 구현) */}
            <div className="border-t pt-6 opacity-50">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="digest" className="text-base">
                    일일 요약 이메일
                  </Label>
                  <p className="text-sm text-gray-500">
                    매일 오전에 할일 요약을 받아보세요 (준비중)
                  </p>
                </div>
                <Switch
                  id="digest"
                  checked={settings.email_digest_enabled}
                  disabled
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

"use client"

import { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import useAuthStore from '@/stores/authStore';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LoginDialogProps {
  children?: React.ReactNode;
}

export function LoginDialog({ children }: LoginDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const { login, loading, isAuthenticated, user, logout } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      toast.success("登录成功", {
        description: `欢迎回来，${email}`,
      });
      setShowLoginForm(false);
    } catch (err) {
      toast.error("登录失败", {
        description: err instanceof Error ? err.message : '登录失败，请检查邮箱和密码',
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("已退出登录");
  };

  // 如果已登录，显示用户头像和下拉菜单
  if (isAuthenticated && user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" style={{ padding: 0 }}>
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex flex-col p-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-bold">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <Button 
              variant="ghost" 
              className="flex items-center justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 mt-1"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>退出登录</span>
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // 如果未登录，显示登录按钮或登录表单
  return (
    <>
      {showLoginForm ? (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">登录</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowLoginForm(false)}>
                ✕
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="邮箱"
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="密码"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setShowLoginForm(true)}
        >
          <User className="h-5 w-5" />
        </Button>
      )}
    </>
  );
} 
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  GraduationCap, LayoutDashboard, Building2, Award, Calculator,
  Lightbulb, MessageSquare, User, LogOut, Menu, X,
  ChevronLeft, Shield, Upload, Bell, GitCompare, BarChart3,
  Headphones, Megaphone
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const studentNav = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/universities", label: "الجامعات", icon: Building2 },
  { href: "/scholarships", label: "برامج الابتعاث", icon: Award },
  { href: "/compare", label: "المقارنة", icon: GitCompare },
  { href: "/calculator", label: "حاسبة الموزونة", icon: Calculator },
  { href: "/recommendations", label: "التوصيات", icon: Lightbulb },
  { href: "/ai-chat", label: "مساعد AI", icon: MessageSquare },
];

const adminNav = [
  { href: "/admin", label: "لوحة الإدارة", icon: Shield },
  { href: "/admin/universities", label: "إدارة الجامعات", icon: Building2 },
  { href: "/admin/scholarships", label: "إدارة المنح", icon: Award },
  { href: "/admin/importer", label: "استيراد الجامعات", icon: Upload },
  { href: "/admin/data-quality", label: "جودة البيانات", icon: BarChart3 },
  { href: "/admin/announcements", label: "الإعلانات", icon: Megaphone },
  { href: "/admin/support", label: "رسائل الدعم", icon: Headphones },
];

function NavItem({ href, label, icon: Icon, onClick }: { href: string; label: string; icon: any; onClick?: () => void }) {
  const [location] = useLocation();
  const active = location === href || (href !== "/dashboard" && href !== "/admin" && location.startsWith(href));
  return (
    <Link href={href} onClick={onClick}>
      <div
        data-testid={`nav-${href.replace(/\//g, "-")}`}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
          active
            ? "bg-white/20 text-white"
            : "text-white/75 hover:bg-white/10 hover:text-white"
        )}
      >
        <Icon size={18} />
        <span>{label}</span>
      </div>
    </Link>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { currentUser, isAdmin, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const initials = currentUser?.email?.charAt(0).toUpperCase() ?? "م";

  const sidebar = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
          <GraduationCap size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-lg leading-none">ابتعاثي</p>
          <p className="text-white/60 text-xs mt-0.5">دليلك للابتعاث</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-white/40 text-xs font-medium px-4 pb-2 pt-1">القائمة الرئيسية</p>
        {studentNav.map((item) => (
          <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
        ))}

        {isAdmin && (
          <>
            <div className="border-t border-white/10 my-3" />
            <p className="text-white/40 text-xs font-medium px-4 pb-2">الإدارة</p>
            {adminNav.map((item) => (
              <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <Link href="/profile">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors">
            <Avatar className="w-8 h-8 bg-white/20">
              <AvatarFallback className="bg-white/20 text-white text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentUser?.email}</p>
              <p className="text-white/50 text-xs">{isAdmin ? "مدير النظام" : "طالب"}</p>
            </div>
          </div>
        </Link>
        <button
          onClick={handleSignOut}
          data-testid="button-signout"
          className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm"
        >
          <LogOut size={16} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden" dir="rtl">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col flex-shrink-0">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-64 flex flex-col">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setSidebarOpen(true)}
              data-testid="button-menu"
            >
              <Menu size={20} />
            </button>
            {title && <h1 className="font-semibold text-foreground">{title}</h1>}
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors relative" data-testid="button-notifications">
              <Bell size={18} className="text-muted-foreground" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors" data-testid="button-user-menu">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <ChevronLeft size={14} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href="/profile"><span className="flex items-center gap-2 w-full cursor-pointer"><User size={14} />الملف الشخصي</span></Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut size={14} className="ml-2" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

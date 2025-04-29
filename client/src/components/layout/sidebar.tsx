import { Link, useLocation } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  File, 
  Tag, 
  BarChart2, 
  Settings, 
  LogOut, 
  ChevronDown, 
  PieChart,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";

type NavItemProps = {
  href: string;
  icon: React.ReactNode;
  text: string;
  isActive: boolean;
};

function NavItem({ href, icon, text, isActive }: NavItemProps) {
  return (
    <div
      onClick={() => window.location.href = href}
      className={cn(
        "flex items-center space-x-3 rounded-lg p-3 mb-2 cursor-pointer",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent"
      )}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const getName = () => {
    if (!user) return 'User';
    return user.name || user.username;
  };
  
  const getInitials = () => {
    if (!user) return 'U';
    if (user.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <aside className="w-full md:w-64 bg-sidebar bg-sidebar-background md:min-h-screen p-4 flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="bg-primary rounded-lg p-2">
            <PieChart className="text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-sidebar-foreground">AjayFarenziya</h1>
        </div>
        <button 
          className="md:hidden text-sidebar-foreground focus:outline-none" 
          onClick={toggleMobileMenu}
        >
          <ChevronDown className={cn(
            "transition-transform duration-200",
            isMobileMenuOpen ? "transform rotate-180" : ""
          )} />
        </button>
      </div>
      
      <nav className={cn(
        "space-y-2",
        isMobile && !isMobileMenuOpen ? "hidden" : "block"
      )}>
        <NavItem 
          href="/" 
          icon={<Home className="h-5 w-5" />} 
          text="Dashboard" 
          isActive={location === '/'} 
        />
        <NavItem 
          href="/expenses" 
          icon={<File className="h-5 w-5" />} 
          text="Expenses" 
          isActive={location === '/expenses'} 
        />
        <NavItem 
          href="/categories" 
          icon={<Tag className="h-5 w-5" />} 
          text="Categories" 
          isActive={location === '/categories'} 
        />
        <NavItem 
          href="/reports" 
          icon={<BarChart2 className="h-5 w-5" />} 
          text="Reports" 
          isActive={location === '/reports'} 
        />
        <NavItem 
          href="/settings" 
          icon={<Settings className="h-5 w-5" />} 
          text="Settings" 
          isActive={location === '/settings'} 
        />
        {user?.role === "admin" && (
          <NavItem 
            href="/users" 
            icon={<Users className="h-5 w-5" />} 
            text="User Management" 
            isActive={location === '/users'} 
          />
        )}
      </nav>
      
      <div className={cn(
        "mt-auto pt-4 border-t border-sidebar-border",
        isMobile && !isMobileMenuOpen ? "hidden" : "block"
      )}>
        <div className="flex items-center space-x-3 mb-4">
          <Avatar>
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">{getName()}</p>
            <p className="text-xs text-sidebar-foreground/60">{user?.role || 'User'}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="flex items-center space-x-2 text-sidebar-foreground/70 hover:text-sidebar-foreground text-sm w-full justify-start px-0"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}
